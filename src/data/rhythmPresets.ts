export type SymptomKey =
  | 'headache'
  | 'fatigue'
  | 'brainFog'
  | 'bloating'
  | 'morningTired';

export interface RhythmEntry {
  id: string;
  date: string; // YYYY-MM-DD
  sleepHours: number;
  sleepQuality: number; // 1-5
  energy: number; // 1-10
  stress: number; // 1-10
  caffeineCups: number;
  lateCaffeine: boolean; // 15:00 sonrası
  waterGlasses: number;
  exerciseMin: number;
  screenBeforeBed: boolean;
  tags: string[];
  symptoms: Record<SymptomKey, number>; // 0=Yok, 1=Hafif, 2=Orta, 3=Şiddetli
  note: string;
  isDemo?: boolean;
}

export const SYMPTOM_META: { key: SymptomKey; label: string; short: string }[] = [
  { key: 'headache', label: 'Baş Ağrısı / Migren', short: 'Baş Ağrısı' },
  { key: 'fatigue', label: 'Öğleden Sonra Çöküşü', short: 'Yorgunluk' },
  { key: 'brainFog', label: 'Odak Dağınıklığı (Beyin Sisi)', short: 'Odak Kaybı' },
  { key: 'bloating', label: 'Mide Hassasiyeti / Şişkinlik', short: 'Mide' },
  { key: 'morningTired', label: 'Sabah Yorgun Uyanma', short: 'Sabah Yorg.' },
];

export const TRIGGER_TAGS = [
  'Geç Akşam Yemeği',
  'Şekerli Atıştırmalık',
  'Açık Hava Yürüyüşü',
  'Magnezyum / Takviye',
  'Yoğun Toplantı',
  'Lodos / Hava Değişimi',
  'Düzensiz Uyku',
  'Az Su Tüketimi',
];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function createDemoRhythmEntries(): RhythmEntry[] {
  const rows: Omit<RhythmEntry, 'id' | 'date'>[] = [
    { sleepHours: 5.5, sleepQuality: 2, energy: 4, stress: 8, caffeineCups: 4, lateCaffeine: true, waterGlasses: 4, exerciseMin: 0, screenBeforeBed: true, tags: ['Yoğun Toplantı', 'Geç Akşam Yemeği'], symptoms: { headache: 3, fatigue: 3, brainFog: 2, bloating: 2, morningTired: 3 }, note: '16:30 double espresso, geç uyku', isDemo: true },
    { sleepHours: 7.5, sleepQuality: 4, energy: 8, stress: 4, caffeineCups: 1, lateCaffeine: false, waterGlasses: 9, exerciseMin: 35, screenBeforeBed: false, tags: ['Açık Hava Yürüyüşü', 'Magnezyum / Takviye'], symptoms: { headache: 0, fatigue: 0, brainFog: 0, bloating: 0, morningTired: 1 }, note: 'Akşam yürüyüşü iyi geldi', isDemo: true },
    { sleepHours: 6.0, sleepQuality: 2, energy: 5, stress: 7, caffeineCups: 3, lateCaffeine: true, waterGlasses: 5, exerciseMin: 10, screenBeforeBed: true, tags: ['Lodos / Hava Değişimi', 'Düzensiz Uyku'], symptoms: { headache: 2, fatigue: 2, brainFog: 2, bloating: 1, morningTired: 2 }, note: 'Öğleden sonra şakak ağrısı', isDemo: true },
    { sleepHours: 8.0, sleepQuality: 5, energy: 9, stress: 3, caffeineCups: 1, lateCaffeine: false, waterGlasses: 10, exerciseMin: 45, screenBeforeBed: false, tags: ['Açık Hava Yürüyüşü', 'Magnezyum / Takviye'], symptoms: { headache: 0, fatigue: 0, brainFog: 0, bloating: 0, morningTired: 0 }, note: 'Çok net zihin, yüksek odak', isDemo: true },
    { sleepHours: 5.8, sleepQuality: 2, energy: 4, stress: 8, caffeineCups: 4, lateCaffeine: true, waterGlasses: 4, exerciseMin: 0, screenBeforeBed: true, tags: ['Şekerli Atıştırmalık', 'Yoğun Toplantı'], symptoms: { headache: 2, fatigue: 3, brainFog: 3, bloating: 2, morningTired: 3 }, note: 'Öğle sonrası tatlı + kahve çöküşü', isDemo: true },
    { sleepHours: 7.2, sleepQuality: 4, energy: 7, stress: 5, caffeineCups: 2, lateCaffeine: false, waterGlasses: 8, exerciseMin: 25, screenBeforeBed: false, tags: ['Açık Hava Yürüyüşü'], symptoms: { headache: 0, fatigue: 1, brainFog: 0, bloating: 0, morningTired: 1 }, note: 'Dengeli gün', isDemo: true },
    { sleepHours: 6.2, sleepQuality: 3, energy: 5, stress: 6, caffeineCups: 3, lateCaffeine: true, waterGlasses: 5, exerciseMin: 0, screenBeforeBed: true, tags: ['Geç Akşam Yemeği', 'Az Su Tüketimi'], symptoms: { headache: 2, fatigue: 2, brainFog: 2, bloating: 2, morningTired: 2 }, note: 'Su içmeyi unuttum', isDemo: true },
    { sleepHours: 7.8, sleepQuality: 4, energy: 8, stress: 4, caffeineCups: 1, lateCaffeine: false, waterGlasses: 9, exerciseMin: 30, screenBeforeBed: false, tags: ['Açık Hava Yürüyüşü', 'Magnezyum / Takviye'], symptoms: { headache: 0, fatigue: 0, brainFog: 0, bloating: 0, morningTired: 0 }, note: 'Sabah dinç uyanış', isDemo: true },
    { sleepHours: 5.2, sleepQuality: 1, energy: 3, stress: 9, caffeineCups: 4, lateCaffeine: true, waterGlasses: 4, exerciseMin: 0, screenBeforeBed: true, tags: ['Düzensiz Uyku', 'Yoğun Toplantı', 'Lodos / Hava Değişimi'], symptoms: { headache: 3, fatigue: 3, brainFog: 3, bloating: 1, morningTired: 3 }, note: 'Migren atağı, karanlık oda gerekti', isDemo: true },
    { sleepHours: 7.4, sleepQuality: 4, energy: 7, stress: 4, caffeineCups: 2, lateCaffeine: false, waterGlasses: 8, exerciseMin: 20, screenBeforeBed: false, tags: ['Magnezyum / Takviye'], symptoms: { headache: 0, fatigue: 1, brainFog: 1, bloating: 0, morningTired: 1 }, note: 'Toparlanma günü', isDemo: true },
    { sleepHours: 6.4, sleepQuality: 3, energy: 6, stress: 6, caffeineCups: 2, lateCaffeine: false, waterGlasses: 7, exerciseMin: 15, screenBeforeBed: true, tags: ['Şekerli Atıştırmalık', 'Geç Akşam Yemeği'], symptoms: { headache: 1, fatigue: 2, brainFog: 1, bloating: 2, morningTired: 2 }, note: 'Akşam yemeği geçe kaldı', isDemo: true },
    { sleepHours: 8.1, sleepQuality: 5, energy: 9, stress: 3, caffeineCups: 1, lateCaffeine: false, waterGlasses: 10, exerciseMin: 40, screenBeforeBed: false, tags: ['Açık Hava Yürüyüşü', 'Magnezyum / Takviye'], symptoms: { headache: 0, fatigue: 0, brainFog: 0, bloating: 0, morningTired: 0 }, note: 'En verimli hafta sonu', isDemo: true },
    { sleepHours: 6.0, sleepQuality: 2, energy: 5, stress: 7, caffeineCups: 3, lateCaffeine: true, waterGlasses: 5, exerciseMin: 0, screenBeforeBed: true, tags: ['Yoğun Toplantı', 'Az Su Tüketimi'], symptoms: { headache: 2, fatigue: 2, brainFog: 2, bloating: 1, morningTired: 2 }, note: 'Saat 16:00 kahvesi uyku kaçırdı', isDemo: true },
    { sleepHours: 7.6, sleepQuality: 4, energy: 8, stress: 4, caffeineCups: 1, lateCaffeine: false, waterGlasses: 9, exerciseMin: 30, screenBeforeBed: false, tags: ['Açık Hava Yürüyüşü'], symptoms: { headache: 0, fatigue: 0, brainFog: 0, bloating: 0, morningTired: 1 }, note: 'Bugün ritim yerinde', isDemo: true },
  ];

  return rows.map((r, idx) => {
    const date = daysAgo(rows.length - 1 - idx);
    return { ...r, id: `demo-${date}`, date };
  });
}
