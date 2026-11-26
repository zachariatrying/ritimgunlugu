import { RhythmEntry, SYMPTOM_META, SymptomKey } from '../data/rhythmPresets';

export interface CorrelationInsight {
  id: string;
  factorLabel: string;
  outcomeLabel: string;
  direction: 'risk' | 'protective';
  impactText: string;
  detailText: string;
  confidence: 'Yüksek Kanıt' | 'Orta Kanıt' | 'Ön Sinyal';
  score: number;
}

function avg(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

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

    const rateWith = (withF.filter((e) => e.symptoms[symptomKey] >= 1).length / withF.length) * 100;
    const rateWithout = (withoutF.filter((e) => e.symptoms[symptomKey] >= 1).length / withoutF.length) * 100;
    const diff = Math.round(rateWith - rateWithout);
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
      detailText: `Bu etkenin olduğu ${withF.length} günün %${Math.round(rateWith)}'ında görüldü (olmadığı günlerde %${Math.round(rateWithout)}).`,
      confidence,
      score: Math.abs(diff),
    });
  };

  // Core physiological factors vs symptoms
  for (const s of SYMPTOM_META) {
    checkBinaryFactor('late-caf', '15:00 Sonrası Kafein', (e) => e.lateCaffeine, s.key, s.label);
    checkBinaryFactor('short-sleep', '6.5 Saatten Az Uyku', (e) => e.sleepHours < 6.5, s.key, s.label);
    checkBinaryFactor('high-caf', '3+ Fincan Kafein', (e) => e.caffeineCups >= 3, s.key, s.label);
    checkBinaryFactor('screen-bed', 'Yatmadan Önce Ekran', (e) => e.screenBeforeBed, s.key, s.label);
    checkBinaryFactor('low-water', 'Az Su (< 6 Bardak)', (e) => e.waterGlasses < 6, s.key, s.label);
    checkBinaryFactor('walk', '20+ dk Egzersiz / Yürüyüş', (e) => e.exerciseMin >= 20, s.key, s.label);
  }

  // Energy boost from exercise & good sleep
  const activeDays = entries.filter((e) => e.exerciseMin >= 20);
  const inactiveDays = entries.filter((e) => e.exerciseMin < 20);
  if (activeDays.length >= 2 && inactiveDays.length >= 2) {
    const delta = avg(activeDays.map((e) => e.energy)) - avg(inactiveDays.map((e) => e.energy));
    if (delta >= 1.0) {
      insights.push({
        id: 'exercise-energy',
        factorLabel: '20+ dk Hareket / Yürüyüş',
        outcomeLabel: 'Günlük Enerji Puanı',
        direction: 'protective',
        impactText: `+${delta.toFixed(1)} puan daha yüksek enerji`,
        detailText: `Hareket ettiğin ${activeDays.length} günde ortalama enerji ${avg(activeDays.map((e) => e.energy)).toFixed(1)}/10 (diğer günlerde ${avg(inactiveDays.map((e) => e.energy)).toFixed(1)}/10).`,
        confidence: entries.length >= 10 ? 'Yüksek Kanıt' : 'Orta Kanıt',
        score: Math.round(delta * 18),
      });
    }
  }

  // Deduplicate keeping strongest insights
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

  const lines = [
    `RitimGünlüğü Hekim / Uzman Görüşme Özeti`,
    `Tarih Aralığı: ${sorted[0].date} — ${sorted[sorted.length - 1].date} (${sorted.length} gün)`,
    `Ortalama Uyku: ${avgSleep} saat | Ortalama Enerji: ${avgEnergy}/10`,
    `Baş Ağrısı / Migren: ${headacheDays} gün (${severeHeadache} gün orta/şiddetli)`,
    '',
    'Öne Çıkan Kişisel Korelasyonlar:',
    ...(topInsights.length
      ? topInsights.map((i, idx) => `${idx + 1}. ${i.factorLabel} -> ${i.outcomeLabel}: ${i.impactText}`)
      : ['- Henüz yeterli veri birikmedi (en az 4-7 gün önerilir).']),
  ];
  return lines.join('\n');
}
