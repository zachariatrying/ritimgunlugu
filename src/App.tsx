import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
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
type Tab = 'correlations' | 'log' | 'trends' | 'doctor';

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

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [sleepHours, setSleepHours] = useState(7.0);
  const [sleepQuality] = useState(4);
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

  const sorted = useMemo(() => [...entries].sort((a, b) => a.date.localeCompare(b.date)), [entries]);
  const insights = useMemo(() => computeCorrelations(sorted), [sorted]);
  const doctorSummary = useMemo(() => buildDoctorSummary(sorted), [sorted]);
  const hasDemo = useMemo(() => entries.some((e) => e.isDemo), [entries]);

  const avgSleep = useMemo(() => (sorted.length ? (sorted.reduce((s, e) => s + e.sleepHours, 0) / sorted.length).toFixed(1) : '0.0'), [sorted]);
  const avgEnergy = useMemo(() => (sorted.length ? (sorted.reduce((s, e) => s + e.energy, 0) / sorted.length).toFixed(1) : '0.0'), [sorted]);
  const headacheDays = useMemo(() => sorted.filter((e) => e.symptoms.headache >= 1).length, [sorted]);

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
    setEntries((prev) => [...prev.filter((item) => item.date !== date), newEntry]);
    showToast(`${date} ritim kaydın eklendi.`);
    setTab('correlations');
  };

  const toggleTag = (t: string) => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

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

    ctx.fillStyle = '#12101B';
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = '#F2C166';
    ctx.fillRect(0, 0, 1080, 14);

    ctx.fillStyle = '#A69FB8';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('RİTİMGÜNLÜĞÜ · GECE GÖZLEM ÖZETİ', 72, 100);

    ctx.fillStyle = '#F3EEE6';
    ctx.font = 'bold 56px Georgia, serif';
    ctx.fillText(`${sorted.length} Günlük Vücut Ritimim`, 72, 190);

    [
      { label: 'ORTALAMA UYKU', val: `${avgSleep} sa` },
      { label: 'ENERJİ ORT.', val: `${avgEnergy} / 10` },
      { label: 'BAŞ AĞRISI', val: `${headacheDays} gün` },
    ].forEach((c, idx) => {
      const x = 72 + idx * 320;
      ctx.fillStyle = '#1B1829';
      ctx.fillRect(x, 260, 296, 160);
      ctx.fillStyle = '#F2C166';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.fillText(c.label, x + 26, 315);
      ctx.fillStyle = '#F3EEE6';
      ctx.font = 'bold 48px system-ui, sans-serif';
      ctx.fillText(c.val, x + 26, 385);
    });

    insights.slice(0, 4).forEach((ins, idx) => {
      const y = 470 + idx * 165;
      ctx.fillStyle = '#1B1829';
      ctx.fillRect(72, y, 936, 135);
      ctx.fillStyle = ins.direction === 'risk' ? '#FDA4AF' : '#6EE7B7';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText(`${ins.factorLabel} → ${ins.outcomeLabel}`, 104, y + 52);
      ctx.fillStyle = '#F3EEE6';
      ctx.font = '24px system-ui, sans-serif';
      ctx.fillText(ins.impactText, 104, y + 98);
    });

    ctx.fillStyle = '#A69FB8';
    ctx.font = '22px monospace';
    ctx.fillText('zachariatrying.github.io/ritimgunlugu · %100 Cihaz İçi', 72, 1265);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `ritimgunlugu-ozet-${today}.png`;
    a.click();
    showToast('1080×1350 Ritim Kartı PNG indirildi!');
  };

  const leadInsight = insights[0];

  const navItems: { id: Tab; label: string; icon: typeof Sparkles }[] = [
    { id: 'correlations', label: 'Gözlem', icon: Sparkles },
    { id: 'log', label: '10 sn Kayıt', icon: Coffee },
    { id: 'trends', label: 'Eğriler', icon: TrendingUp },
    { id: 'doctor', label: 'Hekim', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-[#12101B] text-[#F3EEE6] flex flex-col lg:flex-row pb-24 lg:pb-0">
      {/* Desktop Left Vertical Observatory Rail */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:justify-between border-r border-[#2C2644] bg-[#161322] p-6 shrink-0">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}store-assets/ritimgunlugu_icon.png`}
              alt="RitimGünlüğü"
              className="w-10 h-10 rounded-xl border border-[#2C2644]"
            />
            <div>
              <h1 className="font-dusk-serif text-xl font-bold leading-none">RitimGünlüğü</h1>
              <span className="font-dusk-mono text-[11px] text-[#A69FB8]">Dusk Observatory</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer ${
                    active
                      ? 'bg-[#2A2442] text-[#F2C166]'
                      : 'text-[#A69FB8] hover:text-[#F3EEE6] hover:bg-[#1E1A30]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Compact Readouts */}
          <div className="border-t border-[#2C2644] pt-5 space-y-3 font-dusk-mono text-xs">
            <div className="flex justify-between">
              <span className="text-[#A69FB8] flex items-center gap-1.5"><Moon className="w-3.5 h-3.5" /> Ort. Uyku</span>
              <span className="text-[#F3EEE6] font-semibold">{avgSleep} sa</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A69FB8] flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Ort. Enerji</span>
              <span className="text-[#F2C166] font-semibold">{avgEnergy}/10</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#A69FB8]">Baş Ağrısı</span>
              <span className="text-[#FDA4AF] font-semibold">{headacheDays}/{sorted.length} g</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-6 border-t border-[#2C2644]">
          <button
            onClick={downloadStoryPng}
            className="w-full py-2.5 px-3 rounded-xl bg-[#F2C166] text-[#12101B] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> Ritim Kartı PNG
          </button>
          <button
            onClick={() => {
              setDeleteStep(0);
              setKvkkOpen(true);
            }}
            className="w-full py-2 px-3 rounded-xl border border-[#2C2644] text-[#A69FB8] hover:text-white text-xs flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5" /> KVKK &amp; Yedek
          </button>
        </div>
      </aside>

      {/* Mobile Compact Top Strip */}
      <div className="lg:hidden px-4 pt-4 pb-2 flex items-center justify-between border-b border-[#2C2644]">
        <div className="flex items-center gap-2.5">
          <img
            src={`${import.meta.env.BASE_URL}store-assets/ritimgunlugu_icon.png`}
            alt="RitimGünlüğü"
            className="w-8 h-8 rounded-lg border border-[#2C2644]"
          />
          <h1 className="font-dusk-serif text-lg font-bold">RitimGünlüğü</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadStoryPng} className="px-2.5 py-1.5 rounded-lg bg-[#F2C166] text-[#12101B] text-xs font-bold cursor-pointer">
            Kart
          </button>
          <button onClick={() => setKvkkOpen(true)} className="p-2 rounded-lg border border-[#2C2644] text-[#A69FB8] cursor-pointer">
            <Shield className="w-4 h-4" />
          </button>
        </div>
      </div>

      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-[#F2C166] text-[#12101B] px-4 py-2 rounded-full text-xs font-bold shadow-lg">
          {toast}
        </div>
      )}

      {/* Main Content Canvas */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-8 py-6 sm:py-8 space-y-6">
        {hasDemo && (
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#A69FB8] border-b border-[#2C2644] pb-3">
            <span>Örnek 14 günlük ritim verisi aktif — kendi günlerini ekleyebilirsin.</span>
            <button onClick={clearOnlyDemo} className="text-[#F2C166] underline cursor-pointer">
              Örneği Temizle
            </button>
          </div>
        )}

        {tab === 'correlations' && (
          <div className="space-y-7">
            {/* Editorial Narrative Lead */}
            {leadInsight ? (
              <section className="space-y-3 border-b border-[#2C2644] pb-6">
                <h2 className="font-dusk-serif text-2xl sm:text-3xl leading-snug text-[#F3EEE6]">
                  Son {sorted.length} günde <span className="text-[#F2C166]">{leadInsight.factorLabel}</span> olduğu günlerde{' '}
                  <span className={leadInsight.direction === 'risk' ? 'text-[#FDA4AF]' : 'text-[#6EE7B7]'}>
                    {leadInsight.outcomeLabel}
                  </span>{' '}
                  {leadInsight.impactText}.
                </h2>
                <p className="text-sm text-[#A69FB8] max-w-2xl">{leadInsight.detailText}</p>
              </section>
            ) : (
              <div className="py-6 text-sm text-[#A69FB8]">Anlamlı korelasyon için en az 4 günlük kayıt ekleyin.</div>
            )}

            {/* Horizontal Comparison Rows */}
            <section className="divide-y divide-[#2C2644]">
              {insights.map((ins) => (
                <div key={ins.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${ins.direction === 'risk' ? 'bg-[#FDA4AF]' : 'bg-[#6EE7B7]'}`}
                      />
                      <span className="font-semibold text-sm text-[#F3EEE6]">
                        {ins.factorLabel} → {ins.outcomeLabel}
                      </span>
                    </div>
                    <p className="text-xs text-[#A69FB8]">{ins.detailText}</p>
                  </div>
                  <div className="shrink-0 sm:text-right">
                    <div
                      className={`font-dusk-mono text-sm font-bold ${
                        ins.direction === 'risk' ? 'text-[#FDA4AF]' : 'text-[#6EE7B7]'
                      }`}
                    >
                      {ins.impactText}
                    </div>
                    <div className="font-dusk-mono text-[10px] text-[#A69FB8]">{ins.confidence}</div>
                  </div>
                </div>
              ))}
            </section>
          </div>
        )}

        {tab === 'log' && (
          <form onSubmit={handleSaveEntry} className="bg-[#1B1829] border border-[#2C2644] rounded-2xl p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-dusk-serif text-xl font-bold">10 Saniyelik Gece/Gündüz Kaydı</h2>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-[#12101B] border border-[#2C2644] rounded-lg px-3 py-1.5 text-xs font-dusk-mono text-[#F3EEE6]"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="flex justify-between mb-1"><span>Uyku</span><span className="font-dusk-mono text-[#F2C166]">{sleepHours.toFixed(1)} sa</span></div>
                <input type="range" min={3} max={11} step={0.5} value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} className="w-full accent-[#F2C166]" />
              </div>
              <div>
                <div className="flex justify-between mb-1"><span>Enerji</span><span className="font-dusk-mono text-[#6EE7B7]">{energy}/10</span></div>
                <input type="range" min={1} max={10} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} className="w-full accent-[#6EE7B7]" />
              </div>
              <div>
                <div className="flex justify-between mb-1"><span>Stres</span><span className="font-dusk-mono text-[#FDA4AF]">{stress}/10</span></div>
                <input type="range" min={1} max={10} value={stress} onChange={(e) => setStress(Number(e.target.value))} className="w-full accent-[#FDA4AF]" />
              </div>
              <div>
                <div className="flex justify-between mb-1"><span>Kafein</span><span className="font-dusk-mono text-[#F2C166]">{caffeineCups} fincan</span></div>
                <input type="range" min={0} max={7} value={caffeineCups} onChange={(e) => setCaffeineCups(Number(e.target.value))} className="w-full accent-[#F2C166]" />
              </div>
              <div>
                <div className="flex justify-between mb-1"><span>Su</span><span className="font-dusk-mono text-[#93C5FD]">{waterGlasses} bardak</span></div>
                <input type="range" min={1} max={14} value={waterGlasses} onChange={(e) => setWaterGlasses(Number(e.target.value))} className="w-full accent-[#93C5FD]" />
              </div>
              <div>
                <div className="flex justify-between mb-1"><span>Hareket</span><span className="font-dusk-mono text-[#6EE7B7]">{exerciseMin} dk</span></div>
                <input type="range" min={0} max={90} step={5} value={exerciseMin} onChange={(e) => setExerciseMin(Number(e.target.value))} className="w-full accent-[#6EE7B7]" />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#12101B] border border-[#2C2644] cursor-pointer">
                <input type="checkbox" checked={lateCaffeine} onChange={(e) => setLateCaffeine(e.target.checked)} />
                15:00 Sonrası Kafein
              </label>
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#12101B] border border-[#2C2644] cursor-pointer">
                <input type="checkbox" checked={screenBeforeBed} onChange={(e) => setScreenBeforeBed(e.target.checked)} />
                Yatmadan Önce Ekran
              </label>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {TRIGGER_TAGS.map((t) => {
                const active = tags.includes(t);
                return (
                  <button
                    type="button"
                    key={t}
                    onClick={() => toggleTag(t)}
                    className={`px-3 py-1 rounded-full text-xs border cursor-pointer ${
                      active ? 'bg-[#F2C166] text-[#12101B] border-[#F2C166] font-bold' : 'bg-[#12101B] text-[#A69FB8] border-[#2C2644]'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              {SYMPTOM_META.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-2 bg-[#12101B] px-3 py-2 rounded-xl text-xs">
                  <span>{s.label}</span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((lvl) => (
                      <button
                        type="button"
                        key={lvl}
                        onClick={() => setSymptoms((prev) => ({ ...prev, [s.key]: lvl }))}
                        className={`w-7 h-7 rounded-lg font-dusk-mono font-bold cursor-pointer ${
                          symptoms[s.key] === lvl
                            ? 'bg-[#F2C166] text-[#12101B]'
                            : 'bg-[#1B1829] text-[#A69FB8] border border-[#2C2644]'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Kısa gözlem notu..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex-1 bg-[#12101B] border border-[#2C2644] rounded-xl px-3.5 py-2.5 text-sm text-[#F3EEE6]"
              />
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#F2C166] text-[#12101B] font-bold text-sm cursor-pointer">
                Kaydet
              </button>
            </div>
          </form>
        )}

        {tab === 'trends' && (
          <div className="space-y-5">
            <div className="bg-[#1B1829] border border-[#2C2644] rounded-2xl p-4">
              <h2 className="font-dusk-serif text-lg font-bold mb-3">14 Günlük Uyku &amp; Enerji Eğrisi</h2>
              {sorted.length > 0 && (
                <div className="overflow-x-auto">
                  <svg viewBox="0 0 640 200" className="w-full min-w-[460px] h-44">
                    <line x1="30" y1="170" x2="620" y2="170" stroke="#2C2644" strokeWidth="1" />
                    {(() => {
                      const slice = sorted.slice(-14);
                      const stepX = slice.length > 1 ? 570 / (slice.length - 1) : 0;
                      const energyPts = slice.map((e, i) => `${30 + i * stepX},${170 - (e.energy / 10) * 140}`).join(' ');
                      const sleepPts = slice.map((e, i) => `${30 + i * stepX},${170 - (Math.min(10, e.sleepHours) / 10) * 140}`).join(' ');
                      return (
                        <>
                          <polyline fill="none" stroke="#6EE7B7" strokeWidth="3" points={energyPts} />
                          <polyline fill="none" stroke="#F2C166" strokeWidth="2.5" strokeDasharray="5 4" points={sleepPts} />
                        </>
                      );
                    })()}
                  </svg>
                </div>
              )}
            </div>
            <div className="bg-[#1B1829] border border-[#2C2644] rounded-2xl p-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[#A69FB8] border-b border-[#2C2644]">
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
                    <tr key={e.id} className="border-b border-[#2C2644]/50">
                      <td className="py-2 pr-2 font-dusk-mono">{e.date.slice(5)}</td>
                      <td className="py-2 px-1 font-dusk-mono">{e.sleepHours}s</td>
                      <td className="py-2 px-1 font-dusk-mono text-[#6EE7B7]">{e.energy}</td>
                      {SYMPTOM_META.map((s) => (
                        <td key={s.key} className="py-1.5 px-1 text-center font-dusk-mono">
                          <span className={`inline-block w-6 py-0.5 rounded ${e.symptoms[s.key] >= 2 ? 'bg-[#FDA4AF]/20 text-[#FDA4AF]' : 'text-[#A69FB8]'}`}>
                            {e.symptoms[s.key]}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'doctor' && (
          <section className="bg-[#1B1829] border border-[#2C2644] rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-dusk-serif text-xl font-bold">Hekim Görüşme Özeti</h2>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(doctorSummary);
                  setCopiedDoctor(true);
                  setTimeout(() => setCopiedDoctor(false), 2000);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#F2C166] text-[#12101B] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedDoctor ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedDoctor ? 'Kopyalandı' : 'Özeti Kopyala'}
              </button>
            </div>
            <pre className="bg-[#12101B] border border-[#2C2644] rounded-xl p-4 text-xs whitespace-pre-wrap font-dusk-mono text-[#E7EFEA]">
              {doctorSummary}
            </pre>
          </section>
        )}

        <footer className="pt-4 border-t border-[#2C2644] text-xs text-[#A69FB8] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-[#F2C166] shrink-0 mt-0.5" />
          <p>RitimGünlüğü tıbbi tanı koymaz; verileriniz yalnızca kendi cihazınızda saklanır.</p>
        </footer>
      </main>

      {/* Mobile Floating Translucent Dock */}
      <nav className="lg:hidden fixed bottom-3 left-3 right-3 z-40 rounded-2xl border border-[#2C2644] bg-[#1B1829]/95 backdrop-blur-md p-1.5 grid grid-cols-4 gap-1 shadow-2xl">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`py-2 rounded-xl text-[11px] font-semibold flex flex-col items-center gap-1 cursor-pointer ${
                active ? 'bg-[#2A2442] text-[#F2C166]' : 'text-[#A69FB8]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {kvkkOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#1B1829] border border-[#2C2644] rounded-2xl max-w-md w-full p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-dusk-serif text-lg font-bold">KVKK &amp; Veri Kontrolü</h3>
              <button onClick={() => setKvkkOpen(false)} className="p-1 text-[#A69FB8] cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2">
              <button onClick={exportJson} className="w-full py-2.5 px-4 rounded-xl bg-[#12101B] border border-[#2C2644] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer">
                <Download className="w-4 h-4" /> JSON Yedeğini İndir ({entries.length} gün)
              </button>
              <label className="w-full py-2.5 px-4 rounded-xl bg-[#12101B] border border-[#2C2644] text-xs font-bold flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" /> JSON Yedeğinden Geri Yükle
                <input type="file" accept="application/json" className="hidden" onChange={importJson} />
              </label>
              <button
                onClick={wipeAll}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${
                  deleteStep === 1 ? 'bg-rose-600 text-white' : 'bg-rose-950/50 text-rose-300 border border-rose-800'
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
