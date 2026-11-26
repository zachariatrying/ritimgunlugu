import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Calendar,
  Check,
  Coffee,
  Copy,
  Download,
  FileText,
  Moon,
  Shield,
  Sparkles,
  Trash2,
  TrendingUp,
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

type Tab = 'log' | 'correlations' | 'trends' | 'doctor';

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

export default function App() {
  const [entries, setEntries] = useState<RhythmEntry[]>(loadInitialEntries);
  const [tab, setTab] = useState<Tab>('correlations');
  const [kvkkOpen, setKvkkOpen] = useState(false);
  const [deleteStep, setDeleteStep] = useState<0 | 1>(0);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedDoctor, setCopiedDoctor] = useState(false);

  // Quick 10-second log form state
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [sleepHours, setSleepHours] = useState(7.0);
  const [sleepQuality, setSleepQuality] = useState(4);
  const [energy, setEnergy] = useState(7);
  const [stress, setStress] = useState(4);
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

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const sorted = useMemo(
    () => [...entries].sort((a, b) => a.date.localeCompare(b.date)),
    [entries]
  );

  const insights = useMemo(() => computeCorrelations(sorted), [sorted]);
  const doctorSummary = useMemo(() => buildDoctorSummary(sorted), [sorted]);
  const hasDemo = useMemo(() => entries.some((e) => e.isDemo), [entries]);

  const avgSleep = useMemo(
    () =>
      sorted.length
        ? (sorted.reduce((s, e) => s + e.sleepHours, 0) / sorted.length).toFixed(1)
        : '0.0',
    [sorted]
  );
  const avgEnergy = useMemo(
    () =>
      sorted.length
        ? (sorted.reduce((s, e) => s + e.energy, 0) / sorted.length).toFixed(1)
        : '0.0',
    [sorted]
  );
  const headacheDays = useMemo(
    () => sorted.filter((e) => e.symptoms.headache >= 1).length,
    [sorted]
  );

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: RhythmEntry = {
      id: `entry-${date}`,
      date,
      sleepHours,
      sleepQuality,
      energy,
      stress,
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
    setEntries((prev) => {
      const filtered = prev.filter((item) => item.date !== date);
      return [...filtered, newEntry];
    });
    showToast(`${date} ritim kaydın kaydedildi!`);
    setTab('correlations');
  };

  const toggleTag = (t: string) => {
    setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ritimgunlugu-yedek-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON yedeği indirildi.');
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
          showToast(`${parsed.length} günlük kayıt içe aktarıldı.`);
          setKvkkOpen(false);
        }
      } catch {
        showToast('Geçersiz JSON dosyası.');
      }
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
    showToast('Tüm veriler cihazdan kalıcı olarak silindi.');
  };

  const downloadStoryPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#3730A3';
    ctx.fillRect(0, 0, 1080, 1350);

    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(0, 0, 1080, 18);

    ctx.fillStyle = '#E0E7FF';
    ctx.font = 'bold 28px system-ui, sans-serif';
    ctx.fillText('RİTİMGÜNLÜĞÜ · KİŞİSEL KORELASYON ÖZETİ', 72, 100);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 58px system-ui, sans-serif';
    ctx.fillText(`${sorted.length} Günlük Vücut Ritimim`, 72, 190);

    // Metrics row
    const cards = [
      { label: 'ORTALAMA UYKU', val: `${avgSleep} sa` },
      { label: 'ENERJİ ORT.', val: `${avgEnergy} / 10` },
      { label: 'BAŞ AĞRISI', val: `${headacheDays} gün` },
    ];
    cards.forEach((c, idx) => {
      const x = 72 + idx * 320;
      ctx.fillStyle = 'rgba(255,255,255,0.12)';
      ctx.fillRect(x, 260, 296, 170);
      ctx.fillStyle = '#FCD34D';
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.fillText(c.label, x + 28, 315);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 52px system-ui, sans-serif';
      ctx.fillText(c.val, x + 28, 390);
    });

    // Top correlations
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(72, 480, 936, 680);
    ctx.fillStyle = '#3730A3';
    ctx.font = 'bold 30px system-ui, sans-serif';
    ctx.fillText('EN GÜÇLÜ TETİKLEYİCİLER & KORUYUCULAR', 112, 550);

    insights.slice(0, 4).forEach((ins, idx) => {
      const y = 620 + idx * 128;
      ctx.fillStyle = ins.direction === 'risk' ? '#FEF2F2' : '#ECFDF5';
      ctx.fillRect(112, y, 856, 102);
      ctx.fillStyle = ins.direction === 'risk' ? '#B91C1C' : '#047857';
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillText(`${ins.factorLabel} → ${ins.outcomeLabel}`, 140, y + 42);
      ctx.fillStyle = '#1E293B';
      ctx.font = '24px system-ui, sans-serif';
      ctx.fillText(ins.impactText, 140, y + 80);
    });

    ctx.fillStyle = '#C7D2FE';
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillText('zachariatrying.github.io/ritimgunlugu · %100 Cihaz İçi', 72, 1265);

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `ritimgunlugu-ozet-${today}.png`;
    a.click();
    showToast('1080×1350 Ritim Kartı PNG indirildi!');
  };

  return (
    <div className="min-h-screen bg-[#F6F5FF] text-[#0F172A] pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#3730A3] text-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src="./store-assets/ritimgunlugu_icon.png"
              alt="RitimGünlüğü"
              className="w-10 h-10 rounded-xl border border-white/20"
            />
            <div>
              <h1 className="text-lg font-extrabold tracking-tight leading-tight">RitimGünlüğü</h1>
              <p className="text-xs text-indigo-200">Uyku, Kafein &amp; Semptom Korelasyonu</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadStoryPng}
              className="px-3 py-1.5 rounded-lg bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-300 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Kart İndir
            </button>
            <button
              onClick={() => {
                setDeleteStep(0);
                setKvkkOpen(true);
              }}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition cursor-pointer"
              title="KVKK & Veri Kontrolü"
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Demo Banner */}
      {hasDemo && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-4xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
            <span>
              <strong>Örnek 14 Günlük Veri</strong> yüklü — korelasyon motorunu anında inceleyebilir veya kendi kaydını ekleyebilirsin.
            </span>
            <button
              onClick={clearOnlyDemo}
              className="underline font-semibold hover:text-amber-950 cursor-pointer"
            >
              Örnek Veriyi Temizle
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full text-sm font-medium shadow-lg">
          {toast}
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-5">
        {/* KPI Summary Strip */}
        <section className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl p-3.5 border border-indigo-100 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Moon className="w-3.5 h-3.5 text-indigo-600" /> Ort. Uyku
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">{avgSleep} sa</div>
          </div>
          <div className="bg-white rounded-2xl p-3.5 border border-indigo-100 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-amber-500" /> Ort. Enerji
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">{avgEnergy}/10</div>
          </div>
          <div className="bg-white rounded-2xl p-3.5 border border-indigo-100 shadow-xs">
            <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-rose-500" /> Baş Ağrısı
            </div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
              {headacheDays}/{sorted.length} gün
            </div>
          </div>
        </section>

        {/* Tabs */}
        <nav className="grid grid-cols-4 gap-1.5 bg-indigo-100/70 p-1 rounded-xl">
          {[
            { id: 'correlations', label: 'Korelasyon', icon: Sparkles },
            { id: 'log', label: '10 sn Kayıt', icon: Coffee },
            { id: 'trends', label: 'Trendler', icon: TrendingUp },
            { id: 'doctor', label: 'Hekim Özeti', icon: FileText },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id as Tab)}
                className={`py-2 px-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  active ? 'bg-white text-indigo-900 shadow-xs' : 'text-slate-600 hover:text-indigo-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* TAB 1: CORRELATIONS */}
        {tab === 'correlations' && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-slate-900">
                Kişisel Tetikleyiciler &amp; Koruyucular ({sorted.length} Gün Analizi)
              </h2>
              <button
                onClick={() => setTab('log')}
                className="text-xs font-bold text-indigo-700 hover:underline cursor-pointer"
              >
                + Bugünü Ekle
              </button>
            </div>

            {insights.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-sm text-slate-600">
                Anlamlı korelasyon hesaplamak için en az 4 günlük kayıt gerekir. "10 sn Kayıt" sekmesinden günlerini ekle veya örnek veriyi yükle.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {insights.map((ins) => (
                  <div
                    key={ins.id}
                    className={`rounded-2xl p-4 border shadow-xs ${
                      ins.direction === 'risk'
                        ? 'bg-white border-rose-200'
                        : 'bg-white border-emerald-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          ins.direction === 'risk'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {ins.direction === 'risk' ? 'Tetikleyici Risk' : 'Koruyucu Etken'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">{ins.confidence}</span>
                    </div>
                    <div className="font-bold text-slate-900 text-sm">
                      {ins.factorLabel} → {ins.outcomeLabel}
                    </div>
                    <div
                      className={`text-base font-extrabold mt-1 ${
                        ins.direction === 'risk' ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {ins.impactText}
                    </div>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{ins.detailText}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* TAB 2: 10-SECOND LOG */}
        {tab === 'log' && (
          <form onSubmit={handleSaveEntry} className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-xs space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-extrabold">10 Saniyelik Günlük Ritim Kaydı</h2>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 flex justify-between">
                  <span>Uyku Süresi</span>
                  <span className="text-indigo-700">{sleepHours.toFixed(1)} saat</span>
                </label>
                <input
                  type="range"
                  min={3}
                  max={11}
                  step={0.5}
                  value={sleepHours}
                  onChange={(e) => setSleepHours(Number(e.target.value))}
                  className="w-full accent-indigo-700 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 flex justify-between">
                  <span>Günlük Enerji</span>
                  <span className="text-indigo-700">{energy} / 10</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={energy}
                  onChange={(e) => setEnergy(Number(e.target.value))}
                  className="w-full accent-indigo-700 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 flex justify-between">
                  <span>Stres Seviyesi</span>
                  <span className="text-rose-600">{stress} / 10</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={stress}
                  onChange={(e) => setStress(Number(e.target.value))}
                  className="w-full accent-rose-600 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 flex justify-between">
                  <span>Kafein (Kahve / Çay Fincanı)</span>
                  <span className="text-amber-700">{caffeineCups} fincan</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={7}
                  value={caffeineCups}
                  onChange={(e) => setCaffeineCups(Number(e.target.value))}
                  className="w-full accent-amber-600 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 flex justify-between">
                  <span>Su Tüketimi</span>
                  <span className="text-sky-700">{waterGlasses} bardak</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={14}
                  value={waterGlasses}
                  onChange={(e) => setWaterGlasses(Number(e.target.value))}
                  className="w-full accent-sky-600 mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 flex justify-between">
                  <span>Yürüyüş / Egzersiz</span>
                  <span className="text-emerald-700">{exerciseMin} dk</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={90}
                  step={5}
                  value={exerciseMin}
                  onChange={(e) => setExerciseMin(Number(e.target.value))}
                  className="w-full accent-emerald-600 mt-1"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={lateCaffeine}
                  onChange={(e) => setLateCaffeine(e.target.checked)}
                />
                15:00 Sonrası Kafein İçtim
              </label>
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={screenBeforeBed}
                  onChange={(e) => setScreenBeforeBed(e.target.checked)}
                />
                Yatmadan Önce Ekran (30+ dk)
              </label>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">Günün Etkenleri</div>
              <div className="flex flex-wrap gap-2">
                {TRIGGER_TAGS.map((t) => {
                  const active = tags.includes(t);
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => toggleTag(t)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition cursor-pointer ${
                        active
                          ? 'bg-indigo-700 text-white border-indigo-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-xs font-bold text-slate-700 mb-2">Semptom Şiddeti (0 = Yok, 3 = Şiddetli)</div>
              <div className="space-y-2">
                {SYMPTOM_META.map((s) => (
                  <div key={s.key} className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-xl">
                    <span className="text-xs sm:text-sm font-medium text-slate-800">{s.label}</span>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3].map((lvl) => (
                        <button
                          type="button"
                          key={lvl}
                          onClick={() => setSymptoms((prev) => ({ ...prev, [s.key]: lvl }))}
                          className={`w-8 h-7 rounded-lg text-xs font-bold cursor-pointer transition ${
                            symptoms[s.key] === lvl
                              ? lvl === 0
                                ? 'bg-emerald-600 text-white'
                                : lvl === 1
                                ? 'bg-amber-400 text-slate-950'
                                : lvl === 2
                                ? 'bg-orange-500 text-white'
                                : 'bg-rose-600 text-white'
                              : 'bg-white border border-slate-200 text-slate-600'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Kısa not (ör. Lodos vardı, öğleden sonra kahve içtim)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex-1 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm"
              />
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-sm cursor-pointer"
              >
                Kaydı Ekle
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: TRENDS */}
        {tab === 'trends' && (
          <section className="space-y-4">
            <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-xs">
              <h2 className="text-sm font-extrabold text-slate-900 mb-3">
                Son {Math.min(14, sorted.length)} Günlük Uyku &amp; Enerji Trendi
              </h2>
              {sorted.length > 0 ? (
                <div className="overflow-x-auto">
                  <svg viewBox="0 0 640 200" className="w-full min-w-[480px] h-44">
                    <line x1="30" y1="20" x2="30" y2="170" stroke="#CBD5E1" strokeWidth="1" />
                    <line x1="30" y1="170" x2="620" y2="170" stroke="#CBD5E1" strokeWidth="1" />
                    {(() => {
                      const slice = sorted.slice(-14);
                      const stepX = slice.length > 1 ? 570 / (slice.length - 1) : 0;
                      const energyPts = slice
                        .map((e, i) => `${30 + i * stepX},${170 - (e.energy / 10) * 140}`)
                        .join(' ');
                      const sleepPts = slice
                        .map((e, i) => `${30 + i * stepX},${170 - (Math.min(10, e.sleepHours) / 10) * 140}`)
                        .join(' ');
                      return (
                        <>
                          <polyline fill="none" stroke="#3730A3" strokeWidth="3" points={energyPts} />
                          <polyline fill="none" stroke="#F59E0B" strokeWidth="3" strokeDasharray="6 4" points={sleepPts} />
                          {slice.map((e, i) => (
                            <g key={e.id}>
                              <circle
                                cx={30 + i * stepX}
                                cy={170 - (e.energy / 10) * 140}
                                r="4"
                                fill="#3730A3"
                              />
                              <text
                                x={30 + i * stepX}
                                y="190"
                                fontSize="10"
                                textAnchor="middle"
                                fill="#64748B"
                              >
                                {e.date.slice(5)}
                              </text>
                            </g>
                          ))}
                        </>
                      );
                    })()}
                  </svg>
                  <div className="flex gap-4 text-xs text-slate-600 mt-1">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-1 bg-indigo-700 inline-block" /> Enerji (1–10)
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-1 bg-amber-500 inline-block" /> Uyku (Saat)
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Kayıt yok.</p>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4 border border-indigo-100 shadow-xs overflow-x-auto">
              <h3 className="text-sm font-extrabold text-slate-900 mb-3">Günlük Semptom Matrisi</h3>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-slate-500 border-b">
                    <th className="py-2 pr-2">Tarih</th>
                    <th className="py-2 px-1">Uyku</th>
                    <th className="py-2 px-1">Enerji</th>
                    {SYMPTOM_META.map((s) => (
                      <th key={s.key} className="py-2 px-1 text-center">{s.short}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...sorted].reverse().slice(0, 14).map((e) => (
                    <tr key={e.id} className="border-b border-slate-100">
                      <td className="py-2 pr-2 font-mono">{e.date.slice(5)}</td>
                      <td className="py-2 px-1">{e.sleepHours}s</td>
                      <td className="py-2 px-1 font-bold text-indigo-700">{e.energy}</td>
                      {SYMPTOM_META.map((s) => {
                        const v = e.symptoms[s.key];
                        const bg =
                          v === 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : v === 1
                            ? 'bg-amber-100 text-amber-800'
                            : v === 2
                            ? 'bg-orange-200 text-orange-900'
                            : 'bg-rose-200 text-rose-900';
                        return (
                          <td key={s.key} className="py-1.5 px-1 text-center">
                            <span className={`inline-block w-6 py-0.5 rounded font-bold ${bg}`}>{v}</span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 4: DOCTOR SUMMARY */}
        {tab === 'doctor' && (
          <section className="bg-white rounded-2xl p-5 border border-indigo-100 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Hekim / Uzman Görüşme Özeti</h2>
                <p className="text-xs text-slate-500">Nöroloji, dahiliye veya diyetisyen randevunda doğrudan paylaşabilirsin.</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(doctorSummary);
                  setCopiedDoctor(true);
                  setTimeout(() => setCopiedDoctor(false), 2000);
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedDoctor ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedDoctor ? 'Kopyalandı' : 'Özeti Kopyala'}
              </button>
            </div>
            <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm whitespace-pre-wrap font-mono text-slate-800">
              {doctorSummary}
            </pre>
          </section>
        )}

        {/* Medical Disclaimer Footer */}
        <footer className="bg-white/80 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <strong>Bilgilendirme:</strong> RitimGünlüğü tıbbi tanı koymaz ve tedavi önermez. Tüm verileriniz yalnızca kendi cihazınızda saklanır; sağlık şikayetleriniz için mutlaka hekiminize danışın.
          </p>
        </footer>
      </main>

      {/* KVKK Modal */}
      {kvkkOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-700" /> KVKK &amp; Veri Kontrolü
              </h3>
              <button onClick={() => setKvkkOpen(false)} className="p-1 text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Hesap açmadan tam kullanım sunulur. Kayıtlarınız sunucuya gönderilmez; yalnızca tarayıcı ve cihaz hafızasında tutulur.
            </p>
            <div className="space-y-2">
              <button
                onClick={exportJson}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-50 text-indigo-900 font-bold text-xs flex items-center justify-center gap-2 border border-indigo-200 cursor-pointer"
              >
                <Download className="w-4 h-4" /> JSON Yedeğini İndir ({entries.length} gün)
              </button>
              <label className="w-full py-2.5 px-4 rounded-xl bg-slate-50 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 cursor-pointer">
                <Upload className="w-4 h-4" /> JSON Yedeğinden Geri Yükle
                <input type="file" accept="application/json" className="hidden" onChange={importJson} />
              </label>
              <button
                onClick={wipeAll}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${
                  deleteStep === 1
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                <Trash2 className="w-4 h-4" />
                {deleteStep === 1 ? 'Emin misin? Kalıcı Olarak Sil' : 'Tüm Verilerimi Kalıcı Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
