import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Check,
  Coffee,
  Copy,
  Download,
  Droplets,
  FileText,
  Lightbulb,
  Moon,
  Plus,
  Shield,
  Sparkles,
  Sun,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  createDemoRhythmEntries,
  RhythmEntry,
  SYMPTOM_META,
  SymptomKey,
  TRIGGER_TAGS,
} from './data/rhythmPresets';
import { buildDoctorSummary, computeCorrelations } from './utils/correlationEngine';

const STORAGE_KEY = 'ritimgunlugu_entries_v1';
const COMFORT_KEY = 'ritimgunlugu_comfort_v1';
type WizardStep = 1 | 2 | 3 | 4;
type OutputTab = 'correlations' | 'history' | 'doctor';
type ComfortMode = 'dusk' | 'sand';

function loadInitialEntries(): RhythmEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return createDemoRhythmEntries();
}

function loadComfortMode(): ComfortMode {
  try {
    const raw = localStorage.getItem(COMFORT_KEY);
    if (raw === 'sand' || raw === 'dusk') return raw;
  } catch {}
  return 'dusk';
}

export default function App() {
  const [entries, setEntries] = useState<RhythmEntry[]>(loadInitialEntries);
  const [comfort, setComfort] = useState<ComfortMode>(loadComfortMode);
  const [step, setStep] = useState<WizardStep>(1);
  const [outputTab, setOutputTab] = useState<OutputTab>('correlations');
  const [kvkkOpen, setKvkkOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1>(0);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedDoctor, setCopiedDoctor] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [sleepHours, setSleepHours] = useState(7.0);
  const [energy, setEnergy] = useState(7);
  const [caffeineCups, setCaffeineCups] = useState(2);
  const [lateCaffeine, setLateCaffeine] = useState(false);
  const [waterGlasses, setWaterGlasses] = useState(7);
  const [exerciseMin, setExerciseMin] = useState(25);
  const [screenBeforeBed, setScreenBeforeBed] = useState(false);
  const [tags, setTags] = useState<string[]>(['Açık Hava Yürüyüşü']);
  const [symptoms, setSymptoms] = useState<Record<SymptomKey, number>>({
    headache: 0,
    fatigue: 0,
    brainFog: 0,
    bloating: 0,
    morningTired: 0,
  });
  const [note, setNote] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {}
  }, [entries]);

  useEffect(() => {
    try {
      localStorage.setItem(COMFORT_KEY, comfort);
    } catch {}
    document.documentElement.setAttribute('data-comfort', comfort);
  }, [comfort]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const sorted = useMemo(() => [...entries].sort((a, b) => a.date.localeCompare(b.date)), [entries]);
  const insights = useMemo(() => computeCorrelations(sorted), [sorted]);
  const doctorSummary = useMemo(() => buildDoctorSummary(sorted), [sorted]);
  const hasDemo = useMemo(() => entries.some((e) => e.isDemo), [entries]);
  const latestEntry = sorted[sorted.length - 1];

  const avgSleep = useMemo(
    () => (sorted.length ? (sorted.reduce((s, e) => s + e.sleepHours, 0) / sorted.length).toFixed(1) : '0.0'),
    [sorted]
  );
  const avgEnergy = useMemo(
    () => (sorted.length ? (sorted.reduce((s, e) => s + e.energy, 0) / sorted.length).toFixed(1) : '0.0'),
    [sorted]
  );
  const headacheDays = useMemo(() => sorted.filter((e) => e.symptoms.headache >= 1).length, [sorted]);

  const personalAdvice = useMemo(() => {
    const tips: string[] = [];
    const ref = latestEntry;
    if (ref) {
      if (ref.symptoms.headache >= 2) {
        tips.push('Bugün baş ağrın belirgin: ekran parlaklığını düşük tut, 2 büyük bardak su iç ve 20 dakika loş ortamda gözlerini dinlendir.');
      }
      if (ref.lateCaffeine) {
        tips.push('15:00 sonrası kafein kaydın var; yarın kafeini 14:30 öncesiyle sınırlamak gece uykunu derinleştirir.');
      }
      if (ref.sleepHours < 6.5) {
        tips.push(`Son uyku süren ${ref.sleepHours} saat: bu akşam yatış saatini 45 dakika öne çekmek ertesi gün ağrı ve yorgunluğu azaltır.`);
      }
      if (ref.waterGlasses < 6) {
        tips.push('Su tüketimin 6 bardağın altında kaldı; masanda 1 litrelik şişe bulundurmak susuzluk kaynaklı baş ağrısını önler.');
      }
    }
    if (insights[0]) {
      tips.push(`Verindeki en güçlü desen: "${insights[0].factorLabel}" → ${insights[0].outcomeLabel} (${insights[0].impactText}).`);
    }
    if (tips.length === 0) {
      tips.push('Uyku, su ve günlük ritmin dengeli görünüyor. Aynı tempoyu koruyup akşam ekran süresini düşük tutmaya devam et.');
    }
    return tips.slice(0, 3);
  }, [latestEntry, insights]);

  const handleSaveEntry = () => {
    const newEntry: RhythmEntry = {
      id: `entry-${date}`,
      date,
      sleepHours,
      sleepQuality: sleepHours >= 7 ? 4 : 2,
      energy,
      stress: symptoms.headache >= 2 ? 7 : 4,
      caffeineCups,
      lateCaffeine,
      waterGlasses,
      exerciseMin,
      screenBeforeBed,
      tags,
      symptoms,
      note: note.trim(),
      isDemo: false,
    };
    setEntries((prev) => [...prev.filter((item) => item.date !== date), newEntry]);
    showToast(`${date} ritim kaydın kaydedildi.`);
    setOutputTab('correlations');
    setStep(4);
  };

  const toggleTag = (t: string) => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const cycleSymptom = (key: SymptomKey) => {
    setSymptoms((prev) => ({
      ...prev,
      [key]: prev[key] >= 2 ? 0 : prev[key] + 1,
    }));
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ritimgunlugu-yedek-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (Array.isArray(parsed)) {
          setEntries(parsed);
          setKvkkOpen(false);
          showToast(`${parsed.length} günlük kayıt içe aktarıldı.`);
        }
      } catch {}
    };
    reader.readAsText(file);
  };

  const clearOnlyDemo = () => {
    setEntries((prev) => prev.filter((e) => !e.isDemo));
    showToast('Örnek 14 günlük veri temizlendi.');
  };

  const wipeAll = () => {
    if (deleteStep === 0) {
      setDeleteStep(1);
      return;
    }
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
    setDeleteStep(0);
    setKvkkOpen(false);
    showToast('Tüm veriler cihazdan silindi.');
  };

  const downloadStoryPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#181E1C';
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = '#6BA38B';
    ctx.fillRect(0, 0, 1080, 14);

    ctx.fillStyle = '#9AB0A5';
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.fillText('RİTİMGÜNLÜĞÜ · MİGREN DOSTU ÖZET', 72, 96);

    ctx.fillStyle = '#E6E2D8';
    ctx.font = 'bold 52px system-ui, sans-serif';
    ctx.fillText(`${sorted.length} Günlük Vücut Ritimim`, 72, 178);

    insights.slice(0, 4).forEach((ins, idx) => {
      const y = 250 + idx * 230;
      ctx.fillStyle = '#212926';
      ctx.fillRect(72, y, 936, 196);
      ctx.strokeStyle = '#313E39';
      ctx.lineWidth = 2;
      ctx.strokeRect(72, y, 936, 196);

      ctx.fillStyle = ins.direction === 'risk' ? '#D4956A' : '#6BA38B';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText(`${ins.factorLabel} → ${ins.outcomeLabel}`, 108, y + 54);
      ctx.fillStyle = '#E6E2D8';
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillText(ins.impactText, 108, y + 102);
      ctx.fillStyle = '#9AB0A5';
      ctx.font = '22px system-ui, sans-serif';
      ctx.fillText(ins.actionTip.slice(0, 68), 108, y + 150);
    });

    ctx.fillStyle = '#9AB0A5';
    ctx.font = '22px monospace';
    ctx.fillText('zachariatrying.github.io/ritimgunlugu · %100 Cihaz İçi', 72, 1265);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `ritimgunlugu-ozet-${today}.png`;
    a.click();
    showToast('Loş Ritim Kartı PNG indirildi!');
  };

  return (
    <div
      className="min-h-screen pb-16"
      style={{ backgroundColor: 'var(--bg-page)', color: 'var(--ink-main)' }}
    >
      {/* Calm Low-Glare Header */}
      <header style={{ borderBottom: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-card-alt)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <img
              src={`${import.meta.env.BASE_URL}store-assets/ritimgunlugu_icon.png`}
              alt="RitimGünlüğü"
              className="w-9 h-9 rounded-xl object-cover"
              style={{ border: '1px solid var(--border-soft)' }}
            />
            <div>
              <h1 className="text-base font-bold leading-none">RitimGünlüğü</h1>
              <p className="text-[11px] mt-1" style={{ color: 'var(--ink-muted)' }}>
                Migren dostu, adım adım ritim &amp; tetikleyici günlüğü
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setComfort((c) => (c === 'dusk' ? 'sand' : 'dusk'))}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
              style={{ border: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-card)', color: 'var(--ink-main)' }}
              title="Işık hassasiyetine göre görünümü değiştir"
            >
              {comfort === 'dusk' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              {comfort === 'dusk' ? 'Kağıt Mod' : 'Loş Mod'}
            </button>

            <button
              type="button"
              onClick={() => setStep(step === 4 ? 1 : 4)}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer"
              style={{ border: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-card)', color: 'var(--ink-main)' }}
            >
              {step === 4 ? '+ Yeni Giriş' : 'Günlük & Analiz'}
            </button>

            <button
              type="button"
              onClick={() => {
                setDeleteStep(0);
                setKvkkOpen(true);
              }}
              className="p-1.5 rounded-lg cursor-pointer"
              style={{ border: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-card)', color: 'var(--ink-muted)' }}
              title="KVKK & Veri Kontrolü"
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-xs font-semibold shadow-lg"
          style={{ backgroundColor: 'var(--accent-sage)', color: '#111815' }}
        >
          {toast}
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 py-7 space-y-6">
        {/* Progress Indicator for Steps 1..3 */}
        {step !== 4 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--ink-muted)' }}>
              <span className="font-ritim-mono font-medium">Adım {step} / 3</span>
              <span>Her ekranda tek bir soru</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-1.5 rounded-full transition-colors"
                  style={{
                    backgroundColor: n <= step ? 'var(--accent-sage)' : 'var(--border-soft)',
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: HOW DO YOU FEEL TODAY? */}
        {step === 1 && (
          <section
            className="rounded-2xl p-6 space-y-6"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-soft)' }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-xl font-bold">Bugün nasıl hissediyorsun?</h2>
                <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>
                  Önce sadece ağrı veya yorgunluk durumunu işaretle.
                </p>
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs font-ritim-mono"
                style={{ backgroundColor: 'var(--bg-card-alt)', border: '1px solid var(--border-soft)', color: 'var(--ink-main)' }}
              />
            </div>

            <div className="space-y-2.5">
              <div className="text-sm font-semibold">Baş ağrısı veya migren var mı?</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { val: 0, label: 'Yok', sub: 'Rahat' },
                  { val: 1, label: 'Hafif', sub: 'Baskı hissi' },
                  { val: 2, label: 'Orta', sub: 'Işık hassasiyeti' },
                  { val: 3, label: 'Şiddetli', sub: 'Dinlenme gerek' },
                ].map((opt) => {
                  const active = symptoms.headache === opt.val;
                  return (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setSymptoms((p) => ({ ...p, headache: opt.val }))}
                      className="p-3.5 rounded-xl text-left cursor-pointer transition-colors"
                      style={{
                        backgroundColor: active
                          ? opt.val >= 2
                            ? 'var(--accent-amber-soft)'
                            : 'var(--accent-sage-soft)'
                          : 'var(--bg-card-alt)',
                        border: `1px solid ${
                          active ? (opt.val >= 2 ? 'var(--accent-amber)' : 'var(--accent-sage)') : 'var(--border-soft)'
                        }`,
                      }}
                    >
                      <div className="text-sm font-bold">{opt.label}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                        {opt.sub}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="text-xs font-semibold" style={{ color: 'var(--ink-muted)' }}>
                Eşlik eden başka belirti var mı? (Dokunarak değiştir)
              </div>
              <div className="flex flex-wrap gap-2">
                {SYMPTOM_META.filter((s) => s.key !== 'headache').map((s) => {
                  const level = symptoms[s.key];
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => cycleSymptom(s.key)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer"
                      style={{
                        backgroundColor: level > 0 ? 'var(--accent-amber-soft)' : 'var(--bg-card-alt)',
                        border: `1px solid ${level > 0 ? 'var(--accent-amber)' : 'var(--border-soft)'}`,
                      }}
                    >
                      {s.short}: {level === 0 ? 'Yok' : level === 1 ? 'Hafif' : 'Belirgin'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="text-xs underline cursor-pointer"
                style={{ color: 'var(--ink-muted)' }}
              >
                Atla, doğrudan analize geç
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer"
                style={{ backgroundColor: 'var(--accent-sage)', color: '#111815' }}
              >
                Devam Et <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* STEP 2: SLEEP, WATER & ENERGY */}
        {step === 2 && (
          <section
            className="rounded-2xl p-6 space-y-6"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-soft)' }}
          >
            <div>
              <h2 className="text-xl font-bold">Uyku ve su düzenin</h2>
              <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>
                Migren ve gün içi odak için iki temel denge.
              </p>
            </div>

            {/* Sleep */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <Moon className="w-4 h-4" style={{ color: 'var(--accent-sage)' }} />
                  Dün gece kaç saat uyudun?
                </span>
                <span className="font-ritim-mono text-base font-bold">{sleepHours} saat</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[5, 6, 7, 8, 9].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setSleepHours(h)}
                    className="px-3.5 py-2 rounded-xl text-xs font-ritim-mono font-bold cursor-pointer"
                    style={{
                      backgroundColor: sleepHours === h ? 'var(--accent-sage-soft)' : 'var(--bg-card-alt)',
                      border: `1px solid ${sleepHours === h ? 'var(--accent-sage)' : 'var(--border-soft)'}`,
                    }}
                  >
                    {h} sa
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSleepHours((v) => Math.max(3, Number((v - 0.5).toFixed(1))))}
                  className="px-3 py-2 rounded-xl text-xs font-ritim-mono cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-card-alt)', border: '1px solid var(--border-soft)' }}
                >
                  -0.5
                </button>
                <button
                  type="button"
                  onClick={() => setSleepHours((v) => Math.min(12, Number((v + 0.5).toFixed(1))))}
                  className="px-3 py-2 rounded-xl text-xs font-ritim-mono cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-card-alt)', border: '1px solid var(--border-soft)' }}
                >
                  +0.5
                </button>
              </div>
            </div>

            {/* Water */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <Droplets className="w-4 h-4" style={{ color: 'var(--accent-sage)' }} />
                  Bugün kaç bardak su içtin?
                </span>
                <span className="font-ritim-mono text-base font-bold">{waterGlasses} bardak</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[4, 6, 8, 10].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWaterGlasses(w)}
                    className="px-3.5 py-2 rounded-xl text-xs font-ritim-mono font-bold cursor-pointer"
                    style={{
                      backgroundColor: waterGlasses === w ? 'var(--accent-sage-soft)' : 'var(--bg-card-alt)',
                      border: `1px solid ${waterGlasses === w ? 'var(--accent-sage)' : 'var(--border-soft)'}`,
                    }}
                  >
                    {w} bardak
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setWaterGlasses((v) => Math.max(0, v - 1))}
                  className="px-3 py-2 rounded-xl text-xs font-ritim-mono cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-card-alt)', border: '1px solid var(--border-soft)' }}
                >
                  -1
                </button>
                <button
                  type="button"
                  onClick={() => setWaterGlasses((v) => Math.min(16, v + 1))}
                  className="px-3 py-2 rounded-xl text-xs font-ritim-mono cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-card-alt)', border: '1px solid var(--border-soft)' }}
                >
                  +1
                </button>
              </div>
            </div>

            {/* Energy */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <Activity className="w-4 h-4" style={{ color: 'var(--accent-sage)' }} />
                  Genel enerji hissin
                </span>
                <span className="font-ritim-mono text-base font-bold">{energy} / 10</span>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setEnergy(n)}
                    className="py-2 rounded-lg text-xs font-ritim-mono font-bold cursor-pointer"
                    style={{
                      backgroundColor: energy === n ? 'var(--accent-sage)' : 'var(--bg-card-alt)',
                      color: energy === n ? '#111815' : 'var(--ink-main)',
                      border: `1px solid ${energy === n ? 'var(--accent-sage)' : 'var(--border-soft)'}`,
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                style={{ border: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-card-alt)' }}
              >
                <ArrowLeft className="w-4 h-4" /> Geri
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer"
                style={{ backgroundColor: 'var(--accent-sage)', color: '#111815' }}
              >
                Devam Et <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </section>
        )}

        {/* STEP 3: TRIGGERS & HABITS */}
        {step === 3 && (
          <section
            className="rounded-2xl p-6 space-y-6"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-soft)' }}
          >
            <div>
              <h2 className="text-xl font-bold">Bugünkü etkenler</h2>
              <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>
                Son adımda sadece gün içindeki tetikleyicileri seç ve sonucu gör.
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  const next = !lateCaffeine;
                  setLateCaffeine(next);
                  setCaffeineCups(next ? 3 : 1);
                }}
                className="w-full p-3.5 rounded-xl flex items-center justify-between text-left cursor-pointer"
                style={{
                  backgroundColor: lateCaffeine ? 'var(--accent-amber-soft)' : 'var(--bg-card-alt)',
                  border: `1px solid ${lateCaffeine ? 'var(--accent-amber)' : 'var(--border-soft)'}`,
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Coffee className="w-4 h-4 shrink-0" />
                  <div>
                    <div className="text-sm font-semibold">15:00 sonrası kahve / kafein</div>
                    <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                      Geç saat kafeini uyku derinliğini etkileyebilir
                    </div>
                  </div>
                </div>
                <span className="text-xs font-bold">{lateCaffeine ? 'Evet' : 'Hayır'}</span>
              </button>

              <button
                type="button"
                onClick={() => setScreenBeforeBed((v) => !v)}
                className="w-full p-3.5 rounded-xl flex items-center justify-between text-left cursor-pointer"
                style={{
                  backgroundColor: screenBeforeBed ? 'var(--accent-amber-soft)' : 'var(--bg-card-alt)',
                  border: `1px solid ${screenBeforeBed ? 'var(--accent-amber)' : 'var(--border-soft)'}`,
                }}
              >
                <div>
                  <div className="text-sm font-semibold">Yatmadan önce parlak ekran</div>
                  <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                    Son 30 dakika telefon veya bilgisayar kullanımı
                  </div>
                </div>
                <span className="text-xs font-bold">{screenBeforeBed ? 'Evet' : 'Hayır'}</span>
              </button>

              <button
                type="button"
                onClick={() => setExerciseMin((v) => (v >= 20 ? 0 : 30))}
                className="w-full p-3.5 rounded-xl flex items-center justify-between text-left cursor-pointer"
                style={{
                  backgroundColor: exerciseMin >= 20 ? 'var(--accent-sage-soft)' : 'var(--bg-card-alt)',
                  border: `1px solid ${exerciseMin >= 20 ? 'var(--accent-sage)' : 'var(--border-soft)'}`,
                }}
              >
                <div>
                  <div className="text-sm font-semibold">20+ dakika yürüyüş / açık hava</div>
                  <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>
                    Doğal hareket enerji ve ağrı eşiğini destekler
                  </div>
                </div>
                <span className="text-xs font-bold">{exerciseMin >= 20 ? 'Yaptım' : 'Yapmadım'}</span>
              </button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold" style={{ color: 'var(--ink-muted)' }}>
                Ek etiketler (isteğe bağlı)
              </div>
              <div className="flex flex-wrap gap-2">
                {TRIGGER_TAGS.map((t) => {
                  const active = tags.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleTag(t)}
                      className="px-3 py-1.5 rounded-full text-xs cursor-pointer"
                      style={{
                        backgroundColor: active ? 'var(--accent-sage-soft)' : 'var(--bg-card-alt)',
                        border: `1px solid ${active ? 'var(--accent-sage)' : 'var(--border-soft)'}`,
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Kısa not (örn. lodos vardı, öğleden sonra dinlendim)"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs"
              style={{
                backgroundColor: 'var(--bg-card-alt)',
                border: '1px solid var(--border-soft)',
                color: 'var(--ink-main)',
              }}
            />

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                style={{ border: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-card-alt)' }}
              >
                <ArrowLeft className="w-4 h-4" /> Geri
              </button>
              <button
                type="button"
                onClick={handleSaveEntry}
                className="px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 cursor-pointer"
                style={{ backgroundColor: 'var(--accent-sage)', color: '#111815' }}
              >
                <Check className="w-4 h-4" /> Kaydet ve Tavsiyemi Gör
              </button>
            </div>
          </section>
        )}

        {/* STEP 4: PERSONAL ADVICE & CLEAN OUTPUT HUB */}
        {step === 4 && (
          <div className="space-y-5">
            {hasDemo && (
              <div
                className="rounded-xl px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-2"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-soft)', color: 'var(--ink-muted)' }}
              >
                <span>Örnek 14 günlük ritim verisi yüklü; kendi günlerini ekledikçe analiz sana özel güncellenir.</span>
                <button type="button" onClick={clearOnlyDemo} className="font-bold underline cursor-pointer" style={{ color: 'var(--ink-main)' }}>
                  Örneği Temizle
                </button>
              </div>
            )}

            {/* Personalized Advice Card */}
            <section
              className="rounded-2xl p-5 space-y-3"
              style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-soft)' }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={{ color: 'var(--accent-sage)' }} />
                  <h2 className="text-base font-bold">Bugün İçin Kişisel Tavsiyen</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  style={{ backgroundColor: 'var(--accent-sage)', color: '#111815' }}
                >
                  <Plus className="w-3.5 h-3.5" /> Bugünü Güncelle
                </button>
              </div>

              <ul className="space-y-2">
                {personalAdvice.map((tip, i) => (
                  <li
                    key={i}
                    className="rounded-xl p-3 text-xs leading-relaxed flex items-start gap-2"
                    style={{ backgroundColor: 'var(--bg-card-alt)', border: '1px solid var(--border-soft)' }}
                  >
                    <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent-sage)' }} />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-card-alt)', border: '1px solid var(--border-soft)' }}>
                  <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>Ort. Uyku</div>
                  <div className="font-ritim-mono text-lg font-bold mt-0.5">{avgSleep} sa</div>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-card-alt)', border: '1px solid var(--border-soft)' }}>
                  <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>Ort. Enerji</div>
                  <div className="font-ritim-mono text-lg font-bold mt-0.5">{avgEnergy}/10</div>
                </div>
                <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--bg-card-alt)', border: '1px solid var(--border-soft)' }}>
                  <div className="text-[11px]" style={{ color: 'var(--ink-muted)' }}>Ağrılı Gün</div>
                  <div className="font-ritim-mono text-lg font-bold mt-0.5">{headacheDays} / {sorted.length}</div>
                </div>
              </div>
            </section>

            {/* Clean 3-Tab Switch */}
            <nav
              className="grid grid-cols-3 p-1 rounded-xl gap-1"
              style={{ backgroundColor: 'var(--bg-card-alt)', border: '1px solid var(--border-soft)' }}
            >
              {[
                { id: 'correlations', label: 'Sebep–Sonuç' },
                { id: 'history', label: 'Günlük Kayıtlar' },
                { id: 'doctor', label: 'Hekim Özeti' },
              ].map((t) => {
                const active = outputTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setOutputTab(t.id as OutputTab)}
                    className="py-2 rounded-lg text-xs font-semibold cursor-pointer"
                    style={{
                      backgroundColor: active ? 'var(--bg-card)' : 'transparent',
                      color: active ? 'var(--ink-main)' : 'var(--ink-muted)',
                      border: active ? '1px solid var(--border-soft)' : '1px solid transparent',
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </nav>

            {outputTab === 'correlations' && (
              <div className="space-y-3">
                {insights.length === 0 ? (
                  <div
                    className="rounded-2xl p-6 text-center text-xs"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-soft)', color: 'var(--ink-muted)' }}
                  >
                    Sebep–sonuç çıkarımı için en az 4 günlük kayıt gerekiyor.
                  </div>
                ) : (
                  insights.slice(0, 4).map((ins) => {
                    const isRisk = ins.direction === 'risk';
                    return (
                      <div
                        key={ins.id}
                        className="rounded-2xl p-4 space-y-3"
                        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-soft)' }}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-bold">
                            {ins.factorLabel} → {ins.outcomeLabel}
                          </div>
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                            style={{
                              backgroundColor: isRisk ? 'var(--accent-amber-soft)' : 'var(--accent-sage-soft)',
                              color: isRisk ? 'var(--accent-amber)' : 'var(--accent-sage)',
                            }}
                          >
                            {ins.impactText}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>{ins.detailText}</p>
                        <div className="grid sm:grid-cols-2 gap-2.5 text-[11px]">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span>Etken Varken</span>
                              <span className="font-ritim-mono font-bold">%{ins.rateWithPct}</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-card-alt)' }}>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, ins.rateWithPct)}%`,
                                  backgroundColor: isRisk ? 'var(--accent-amber)' : 'var(--accent-sage)',
                                }}
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span>Etken Yokken</span>
                              <span className="font-ritim-mono font-bold">%{ins.rateWithoutPct}</span>
                            </div>
                            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-card-alt)' }}>
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.min(100, ins.rateWithoutPct)}%`,
                                  backgroundColor: 'var(--ink-muted)',
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {outputTab === 'history' && (
              <div className="space-y-2">
                {[...sorted].reverse().map((e) => (
                  <div
                    key={e.id}
                    className="rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                    style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-soft)' }}
                  >
                    <div>
                      <span className="font-ritim-mono font-bold">{e.date}</span>
                      <span className="ml-2" style={{ color: 'var(--ink-muted)' }}>
                        Uyku {e.sleepHours} sa · Su {e.waterGlasses} brd · Enerji {e.energy}/10
                      </span>
                      {e.note && <div className="mt-1 text-[11px]" style={{ color: 'var(--ink-muted)' }}>{e.note}</div>}
                    </div>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                      style={{
                        backgroundColor: e.symptoms.headache >= 1 ? 'var(--accent-amber-soft)' : 'var(--accent-sage-soft)',
                        color: e.symptoms.headache >= 1 ? 'var(--accent-amber)' : 'var(--accent-sage)',
                      }}
                    >
                      {e.symptoms.headache === 0 ? 'Baş ağrısı yok' : `Baş ağrısı: ${e.symptoms.headache}/3`}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {outputTab === 'doctor' && (
              <div
                className="rounded-2xl p-5 space-y-4"
                style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-soft)' }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" style={{ color: 'var(--accent-sage)' }} />
                    <h3 className="text-sm font-bold">Hekim / Uzman Görüşme Özeti</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={downloadStoryPng}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      style={{ border: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-card-alt)' }}
                    >
                      <Download className="w-3.5 h-3.5" /> Loş Kart PNG
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(doctorSummary);
                        setCopiedDoctor(true);
                        setTimeout(() => setCopiedDoctor(false), 1800);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                      style={{ backgroundColor: 'var(--accent-sage)', color: '#111815' }}
                    >
                      {copiedDoctor ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedDoctor ? 'Kopyalandı' : 'Özeti Kopyala'}
                    </button>
                  </div>
                </div>
                <pre
                  className="rounded-xl p-4 text-xs whitespace-pre-wrap font-ritim-mono leading-relaxed"
                  style={{ backgroundColor: 'var(--bg-card-alt)', border: '1px solid var(--border-soft)' }}
                >
                  {doctorSummary}
                </pre>
              </div>
            )}

            <div className="text-[11px] text-center space-y-1.5" style={{ color: 'var(--ink-muted)' }}>
              <p>
                RitimGünlüğü tıbbi cihaz değildir (1219 sayılı Kanun &amp; TİTCK kapsamında tanı/tedavi sunmaz). Şiddetli,
                ani veya alışılmadık baş ağrılarında <strong>112 Acil</strong>&rsquo;e başvurun.
              </p>
              <p className="flex flex-wrap justify-center gap-3">
                <a href="https://ichd-3.org/" target="_blank" rel="noopener noreferrer" className="underline">
                  IHS (ICHD-3)
                </a>
                <a href="https://www.noroloji.org.tr/" target="_blank" rel="noopener noreferrer" className="underline">
                  Türk Nöroloji Derneği
                </a>
                <a href="./privacy.html" className="underline font-semibold" style={{ color: 'var(--accent-sage)' }}>
                  Gizlilik &amp; KVKK
                </a>
              </p>
            </div>
          </div>
        )}
      </main>

      {/* KVKK Modal */}
      {kvkkOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div
            className="max-w-md w-full rounded-2xl p-5 space-y-4"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-soft)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">KVKK &amp; Cihaz İçi Veri</h3>
              <button type="button" onClick={() => setKvkkOpen(false)} className="p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
              Tüm kayıtların yalnızca tarayıcının yerel hafızasında saklanır; sunucuya gönderilmez.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={exportJson}
                className="py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ border: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-card-alt)' }}
              >
                <Download className="w-3.5 h-3.5" /> JSON Yedek
              </button>
              <label
                className="py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                style={{ border: '1px solid var(--border-soft)', backgroundColor: 'var(--bg-card-alt)' }}
              >
                <Upload className="w-3.5 h-3.5" /> İçe Aktar
                <input type="file" accept=".json" onChange={importJson} className="hidden" />
              </label>
            </div>
            <button
              type="button"
              onClick={wipeAll}
              className="w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              style={{ backgroundColor: 'var(--accent-amber-soft)', color: 'var(--accent-amber)', border: '1px solid var(--accent-amber)' }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleteStep === 0 ? 'Tüm Verileri Sil' : 'Emin misin? Tekrar Tıkla'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
