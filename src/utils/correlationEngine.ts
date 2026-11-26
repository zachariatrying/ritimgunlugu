import { RhythmEntry, SYMPTOM_META, SymptomKey } from '../data/rhythmPresets';

export interface CorrelationInsight {
  id: string;
  factorLabel: string;
  outcomeLabel: string;
  direction: 'risk' | 'protective';
  impactText: string;
  detailText: string;
  actionTip: string;
  rateWithPct: number;
  rateWithoutPct: number;
  confidence: 'Yüksek Kanıt' | 'Orta Kanıt' | 'Ön Sinyal';
  score: number;
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

const ACTION_TIPS: Record<string, string> = {
  'late-caf': 'Kafeini saat 14:30’dan önce kesip öğleden sonra bitki çayı veya suya geçmeyi dene.',
  'short-sleep': 'Yatış saatini 45 dakika öne çekmek ertesi günkü odak ve ağrı riskini hızla düşürür.',
  'high-caf': 'Günlük kahve sayısını 2 fincanla sınırlayıp her kahve yanında 1 bardak su iç.',
  'screen-bed': 'Uyumadan 30 dk önce telefonu şarja bırakmak derin uyku kalitesini belirgin artırır.',
  'low-water': 'Masanda 1 litrelik şişe bulundurmak susuzluk kaynaklı baş ağrısını azaltır.',
  walk: 'Günde 20–30 dakikalık tempolu yürüyüş enerji puanını ve uyku derinliğini koruyor.',
};

export function computeCorrelations(entries: RhythmEntry[]): CorrelationInsight[] {
  if (entries.length < 4) return [];
  const insights: CorrelationInsight[] = [];

  const checkBinaryFactor = (
    id: string,
    factorLabel: string,
    predicate: (e: RhythmEntry) => boolean,
    symptomKey: SymptomKey,
    symptomLabel: string
  ) => {
    const withF = entries.filter(predicate);
    const withoutF = entries.filter((e) => !predicate(e));
    if (withF.length < 2 || withoutF.length < 2) return;

    const rateWith = Math.round((withF.filter((e) => e.symptoms[symptomKey] >= 1).length / withF.length) * 100);
    const rateWithout = Math.round((withoutF.filter((e) => e.symptoms[symptomKey] >= 1).length / withoutF.length) * 100);
    const diff = rateWith - rateWithout;
    if (Math.abs(diff) < 20) return;

    const confidence: CorrelationInsight['confidence'] =
      entries.length >= 10 && withF.length >= 3 && withoutF.length >= 3
        ? 'Yüksek Kanıt'
        : withF.length >= 2
        ? 'Orta Kanıt'
        : 'Ön Sinyal';

    insights.push({
      id: `${id}-${symptomKey}`,
      factorLabel,
      outcomeLabel: symptomLabel,
      direction: diff > 0 ? 'risk' : 'protective',
      impactText: diff > 0 ? `+%${diff} daha sık görülüyor` : `%${Math.abs(diff)} daha az görülüyor`,
      detailText: `Bu alışkanlığın olduğu ${withF.length} günün %${rateWith}'ında görüldü (olmadığı günlerde %${rateWithout}).`,
      actionTip: ACTION_TIPS[id] || 'Bu etkeni 7 gün daha takip ederek etkinin tutarlılığını doğrula.',
      rateWithPct: rateWith,
      rateWithoutPct: rateWithout,
      confidence,
      score: Math.abs(diff),
    });
  };

  for (const s of SYMPTOM_META) {
    checkBinaryFactor('late-caf', '15:00 Sonrası Kafein', (e) => e.lateCaffeine, s.key, s.label);
    checkBinaryFactor('short-sleep', '6.5 Saatten Az Uyku', (e) => e.sleepHours < 6.5, s.key, s.label);
    checkBinaryFactor('high-caf', '3+ Fincan Kafein', (e) => e.caffeineCups >= 3, s.key, s.label);
    checkBinaryFactor('screen-bed', 'Yatmadan Önce Ekran', (e) => e.screenBeforeBed, s.key, s.label);
    checkBinaryFactor('low-water', 'Az Su (< 6 Bardak)', (e) => e.waterGlasses < 6, s.key, s.label);
    checkBinaryFactor('walk', '20+ dk Yürüyüş / Hareket', (e) => e.exerciseMin >= 20, s.key, s.label);
  }

  const activeDays = entries.filter((e) => e.exerciseMin >= 20);
  const inactiveDays = entries.filter((e) => e.exerciseMin < 20);
  if (activeDays.length >= 2 && inactiveDays.length >= 2) {
    const avgWith = avg(activeDays.map((e) => e.energy));
    const avgWithout = avg(inactiveDays.map((e) => e.energy));
    const delta = avgWith - avgWithout;
    if (delta >= 1.0) {
      insights.push({
        id: 'exercise-energy',
        factorLabel: '20+ dk Hareket / Yürüyüş',
        outcomeLabel: 'Günlük Enerji Puanı',
        direction: 'protective',
        impactText: `+${delta.toFixed(1)} puan daha yüksek enerji`,
        detailText: `Hareket ettiğin ${activeDays.length} günde ortalama enerji ${avgWith.toFixed(1)}/10 (diğer günlerde ${avgWithout.toFixed(1)}/10).`,
        actionTip: ACTION_TIPS.walk,
        rateWithPct: Math.round(avgWith * 10),
        rateWithoutPct: Math.round(avgWithout * 10),
        confidence: entries.length >= 10 ? 'Yüksek Kanıt' : 'Orta Kanıt',
        score: Math.round(delta * 18),
      });
    }
  }

  return insights.sort((a, b) => b.score - a.score).slice(0, 6);
}

export function buildDoctorSummary(entries: RhythmEntry[]): string {
  if (!entries.length) return 'Henüz kayıt bulunmuyor.';
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const avgSleep = avg(sorted.map((e) => e.sleepHours)).toFixed(1);
  const avgEnergy = avg(sorted.map((e) => e.energy)).toFixed(1);
  const headacheDays = sorted.filter((e) => e.symptoms.headache >= 1).length;
  const severeHeadache = sorted.filter((e) => e.symptoms.headache >= 2).length;
  const topInsights = computeCorrelations(sorted).slice(0, 3);

  return [
    `RitimGünlüğü Hekim / Uzman Görüşme Özeti`,
    `Tarih Aralığı: ${sorted[0].date} — ${sorted[sorted.length - 1].date} (${sorted.length} gün)`,
    `Ortalama Uyku: ${avgSleep} saat | Ortalama Enerji: ${avgEnergy}/10`,
    `Baş Ağrısı / Migren: ${headacheDays} gün (${severeHeadache} gün orta/şiddetli)`,
    '',
    'Öne Çıkan Kişisel Korelasyonlar:',
    ...(topInsights.length
      ? topInsights.map((i, idx) => `${idx + 1}. ${i.factorLabel} -> ${i.outcomeLabel}: ${i.impactText}`)
      : ['- Henüz yeterli veri birikmedi (en az 4 gün önerilir).']),
  ].join('\n');
}
