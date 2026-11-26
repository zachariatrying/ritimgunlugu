import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Check,
  Coffee,
  Copy,
  Download,
  FileText,
  Lightbulb,
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

    ctx.fillStyle = '#F6F9FC';
    ctx.fillRect(0, 0, 1080, 1350);
    ctx.fillStyle = '#2563EB';
    ctx.fillRect(0, 0, 1080, 18);

    ctx.fillStyle = '#2563EB';
    ctx.font = 'bold 26px system-ui, sans-serif';
    ctx.fillText('RİTİMGÜNLÜĞÜ · SEBEP-SONUÇ ANALİZİM', 72, 100);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 54px system-ui, sans-serif';
    ctx.fillText(`${sorted.length} Günlük Vücut Ritimim`, 72, 185);

    insights.slice(0, 4).forEach((ins, idx) => {
      const y = 260 + idx * 230;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(72, y, 936, 196);
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      ctx.strokeRect(72, y, 936, 196);

      ctx.fillStyle = ins.direction === 'risk' ? '#E11D48' : '#0D9488';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText(`${ins.factorLabel} → ${ins.outcomeLabel}`, 108, y + 54);
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 26px system-ui, sans-serif';
      ctx.fillText(ins.impactText, 108, y + 102);
      ctx.fillStyle = '#475569';
      ctx.font = '22px system-ui, sans-serif';
      ctx.fillText(ins.actionTip.slice(0, 68), 108, y + 150);
    });

    ctx.fillStyle = '#475569';
    ctx.font = '22px monospace';
    ctx.fillText('zachariatrying.github.io/ritimgunlugu · %100 Cihaz İçi', 72, 1265);

    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `ritimgunlugu-ozet-${today}.png`;
    a.click();
    showToast('1080×1350 Ritim Kartı PNG indirildi!');
  };

  return (
    <div className="min-h-screen bg-[#F6F9FC] text-[#0F172A] pb-20">
      {/* Clean Daylight Wellness Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}store-assets/ritimgunlugu_icon.png`}
              alt="RitimGünlüğü"
              className="w-10 h-10 rounded-xl border border-slate-200 object-cover"
            />
            <div>
              <h1 className="text-xl font-extrabold text-[#0F172A] leading-none">RitimGünlüğü</h1>
              <p className="text-xs text-slate-500 mt-1">
                Baş ağrısı, odak düşüşü ve yorgunluğun günlük alışkanlıklarınla ilişkisini keşfet
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={downloadStoryPng}
              className="px-3.5 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Ritim Kartı PNG
            </button>
            <button
              onClick={() => {
                setDeleteStep(0);
                setKvkkOpen(true);
              }}
              className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 cursor-pointer"
              title="KVKK & Veri Kontrolü"
            >
              <Shield className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-lg">
          {toast}
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* 3-Step Self-Explanatory Guide Strip */}
        <section className="grid sm:grid-cols-3 gap-3 bg-white border border-slate-200 rounded-2xl p-4">
          <div className="flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-full bg-blue-100 text-[#2563EB] font-bold text-xs flex items-center justify-center shrink-0">1</span>
            <div className="text-xs">
              <div className="font-bold text-slate-900">10 Saniyede İşaretle</div>
              <p className="text-slate-500 mt-0.5">Uyku saati, kahve, su ve varsa baş ağrısı/yorgunluğunu gir.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-full bg-teal-100 text-[#0D9488] font-bold text-xs flex items-center justify-center shrink-0">2</span>
            <div className="text-xs">
              <div className="font-bold text-slate-900">Sebep–Sonuç Karşılaştır</div>
              <p className="text-slate-500 mt-0.5">Motor, alışkanlığın olduğu günlerle olmadığı günlerin yüzdesini kıyaslar.</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5">
            <span className="w-6 h-6 rounded-full bg-rose-100 text-[#E11D48] font-bold text-xs flex items-center justify-center shrink-0">3</span>
            <div className="text-xs">
              <div className="font-bold text-slate-900">Hekim Özeti Çıkar</div>
              <p className="text-slate-500 mt-0.5">Randevuda paylaşabileceğin 14 günlük net özet al.</p>
            </div>
          </div>
        </section>

        {hasDemo && (
          <div className="flex flex-wrap items-center justify-between gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-900">
            <span>
              <strong>Örnek 14 Günlük Ritim Verisi</strong> yüklü — sebep-sonuç grafiklerini inceleyip kendi günlerini ekleyebilirsin.
            </span>
            <button onClick={clearOnlyDemo} className="font-bold underline cursor-pointer">
              Örnek Veriyi Temizle
            </button>
          </div>
        )}

        {/* KPI Bar */}
        <section className="grid grid-cols-3 gap-3">
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5">
            <div className="text-xs text-slate-500 flex items-center gap-1"><Moon className="w-3.5 h-3.5 text-[#2563EB]" /> Ort. Uyku</div>
            <div className="font-ritim-mono text-2xl font-bold mt-1">{avgSleep} sa</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5">
            <div className="text-xs text-slate-500 flex items-center gap-1"><Activity className="w-3.5 h-3.5 text-[#0D9488]" /> Ort. Enerji</div>
            <div className="font-ritim-mono text-2xl font-bold mt-1">{avgEnergy}/10</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5">
            <div className="text-xs text-slate-500">Baş Ağrısı</div>
            <div className="font-ritim-mono text-2xl font-bold text-[#E11D48] mt-1">{headacheDays}/{sorted.length} gün</div>
          </div>
        </section>

        {/* Navigation Tabs */}
        <nav className="grid grid-cols-4 gap-1.5 bg-slate-200/70 p-1 rounded-xl">
          {[
            { id: 'correlations', label: 'Sebep & Sonuç', icon: Sparkles },
            { id: 'log', label: '10 sn Kayıt', icon: Coffee },
            { id: 'trends', label: '14 Gün Eğrisi', icon: TrendingUp },
            { id: 'doctor', label: 'Hekim Özeti', icon: FileText },
          ].map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id as Tab)}
                className={`py-2 px-2 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  active ? 'bg-white text-[#2563EB] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* TAB 1: CLEAR CAUSE-AND-EFFECT BARS */}
        {tab === 'correlations' && (
          <section className="grid md:grid-cols-2 gap-4">
            {insights.length === 0 ? (
              <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 text-center text-sm text-slate-500">
                Anlamlı sebep-sonuç analizi için en az 4 günlük kayıt ekleyin.
              </div>
            ) : (
              insights.map((ins) => (
                <article key={ins.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        ins.direction === 'risk' ? 'bg-rose-100 text-[#E11D48]' : 'bg-teal-100 text-[#0D9488]'
                      }`}
                    >
                      {ins.direction === 'risk' ? 'Tetikleyici Risk' : 'Koruyucu Alışkanlık'}
                    </span>
                    <span className="font-ritim-mono text-[11px] text-slate-500">{ins.confidence}</span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {ins.factorLabel} → {ins.outcomeLabel}
                    </h3>
                    <div className={`text-base font-extrabold mt-0.5 ${ins.direction === 'risk' ? 'text-[#E11D48]' : 'text-[#0D9488]'}`}>
                      {ins.impactText}
                    </div>
                  </div>

                  {/* Side-by-Side Visual Comparison Bars */}
                  <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl text-xs">
                    <div>
                      <div className="flex justify-between font-medium mb-1">
                        <span>Etken Varken</span>
                        <span className="font-ritim-mono font-bold">%{ins.rateWithPct}</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${ins.direction === 'risk' ? 'bg-[#E11D48]' : 'bg-[#0D9488]'}`}
                          style={{ width: `${Math.min(100, ins.rateWithPct)}%` }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between font-medium mb-1 text-slate-600">
                        <span>Etken Yokken</span>
                        <span className="font-ritim-mono">%{ins.rateWithoutPct}</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-400 rounded-full" style={{ width: `${Math.min(100, ins.rateWithoutPct)}%` }} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs text-slate-700 bg-blue-50/70 p-2.5 rounded-xl">
                    <Lightbulb className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                    <span>{ins.actionTip}</span>
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {/* TAB 2: 10s LOG */}
        {tab === 'log' && (
          <form onSubmit={handleSaveEntry} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-extrabold">10 Saniyelik Günlük Kayıt</h2>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-ritim-mono" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="flex justify-between font-bold mb-1"><span>Uyku Süresi</span><span className="text-[#2563EB]">{sleepHours.toFixed(1)} sa</span></div>
                <input type="range" min={3} max={11} step={0.5} value={sleepHours} onChange={(e) => setSleepHours(Number(e.target.value))} className="w-full accent-[#2563EB]" />
              </div>
              <div>
                <div className="flex justify-between font-bold mb-1"><span>Günlük Enerji</span><span className="text-[#0D9488]">{energy}/10</span></div>
                <input type="range" min={1} max={10} value={energy} onChange={(e) => setEnergy(Number(e.target.value))} className="w-full accent-[#0D9488]" />
              </div>
              <div>
                <div className="flex justify-between font-bold mb-1"><span>Stres</span><span className="text-[#E11D48]">{stress}/10</span></div>
                <input type="range" min={1} max={10} value={stress} onChange={(e) => setStress(Number(e.target.value))} className="w-full accent-[#E11D48]" />
              </div>
              <div>
                <div className="flex justify-between font-bold mb-1"><span>Kafein (Fincan)</span><span className="text-amber-600">{caffeineCups} fincan</span></div>
                <input type="range" min={0} max={7} value={caffeineCups} onChange={(e) => setCaffeineCups(Number(e.target.value))} className="w-full accent-amber-600" />
              </div>
              <div>
                <div className="flex justify-between font-bold mb-1"><span>Su</span><span className="text-sky-600">{waterGlasses} bardak</span></div>
                <input type="range" min={1} max={14} value={waterGlasses} onChange={(e) => setWaterGlasses(Number(e.target.value))} className="w-full accent-sky-600" />
              </div>
              <div>
                <div className="flex justify-between font-bold mb-1"><span>Yürüyüş / Egzersiz</span><span className="text-[#0D9488]">{exerciseMin} dk</span></div>
                <input type="range" min={0} max={90} step={5} value={exerciseMin} onChange={(e) => setExerciseMin(Number(e.target.value))} className="w-full accent-[#0D9488]" />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-xs font-semibold">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer">
                <input type="checkbox" checked={lateCaffeine} onChange={(e) => setLateCaffeine(e.target.checked)} />
                15:00 Sonrası Kafein İçtim
              </label>
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 cursor-pointer">
                <input type="checkbox" checked={screenBeforeBed} onChange={(e) => setScreenBeforeBed(e.target.checked)} />
                Yatmadan Önce Ekran (30+ dk)
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
                    className={`px-3 py-1 rounded-full text-xs font-semibold border cursor-pointer ${
                      active ? 'bg-[#2563EB] text-white border-[#2563EB]' : 'bg-slate-50 text-slate-700 border-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2">
              {SYMPTOM_META.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-xl text-xs">
                  <span className="font-medium">{s.label}</span>
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map((lvl) => (
                      <button
                        type="button"
                        key={lvl}
                        onClick={() => setSymptoms((prev) => ({ ...prev, [s.key]: lvl }))}
                        className={`w-7 h-7 rounded-lg font-ritim-mono font-bold cursor-pointer ${
                          symptoms[s.key] === lvl ? 'bg-[#2563EB] text-white' : 'bg-white border border-slate-200 text-slate-600'
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
              <input type="text" placeholder="Kısa not..." value={note} onChange={(e) => setNote(e.target.value)} className="flex-1 border border-slate-300 rounded-xl px-3.5 py-2.5 text-sm" />
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-[#2563EB] text-white font-bold text-sm cursor-pointer">Kaydı Ekle</button>
            </div>
          </form>
        )}

        {/* TAB 3: TRENDS */}
        {tab === 'trends' && (
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 overflow-x-auto">
              <h2 className="text-sm font-extrabold mb-3">14 Günlük Uyku &amp; Enerji Trendi</h2>
              {sorted.length > 0 && (
                <svg viewBox="0 0 640 200" className="w-full min-w-[460px] h-44">
                  <line x1="30" y1="170" x2="620" y2="170" stroke="#CBD5E1" strokeWidth="1" />
                  {(() => {
                    const slice = sorted.slice(-14);
                    const stepX = slice.length > 1 ? 570 / (slice.length - 1) : 0;
                    const energyPts = slice.map((e, i) => `${30 + i * stepX},${170 - (e.energy / 10) * 140}`).join(' ');
                    const sleepPts = slice.map((e, i) => `${30 + i * stepX},${170 - (Math.min(10, e.sleepHours) / 10) * 140}`).join(' ');
                    return (
                      <>
                        <polyline fill="none" stroke="#2563EB" strokeWidth="3" points={energyPts} />
                        <polyline fill="none" stroke="#0D9488" strokeWidth="2.5" strokeDasharray="5 4" points={sleepPts} />
                      </>
                    );
                  })()}
                </svg>
              )}
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 overflow-x-auto">
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
                      <td className="py-2 pr-2 font-ritim-mono">{e.date.slice(5)}</td>
                      <td className="py-2 px-1 font-ritim-mono">{e.sleepHours}s</td>
                      <td className="py-2 px-1 font-ritim-mono font-bold text-[#2563EB]">{e.energy}</td>
                      {SYMPTOM_META.map((s) => (
                        <td key={s.key} className="py-1.5 px-1 text-center font-ritim-mono">
                          <span className={`inline-block w-6 py-0.5 rounded font-bold ${e.symptoms[s.key] >= 2 ? 'bg-rose-100 text-[#E11D48]' : 'text-slate-600'}`}>
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

        {/* TAB 4: DOCTOR */}
        {tab === 'doctor' && (
          <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-extrabold">Hekim Görüşme Özeti</h2>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(doctorSummary);
                  setCopiedDoctor(true);
                  setTimeout(() => setCopiedDoctor(false), 2000);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#2563EB] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedDoctor ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedDoctor ? 'Kopyalandı' : 'Özeti Kopyala'}
              </button>
            </div>
            <pre className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs whitespace-pre-wrap font-ritim-mono text-slate-800">
              {doctorSummary}
            </pre>
          </section>
        )}

        <footer className="border-t border-slate-200 pt-4 text-xs text-slate-500 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>RitimGünlüğü tıbbi tanı koymaz; verileriniz yalnızca kendi cihazınızda saklanır.</p>
        </footer>
      </main>

      {kvkkOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">KVKK &amp; Veri Kontrolü</h3>
              <button onClick={() => setKvkkOpen(false)} className="p-1 text-slate-500 cursor-pointer"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2">
              <button onClick={exportJson} className="w-full py-2.5 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer">
                <Download className="w-4 h-4" /> JSON Yedeğini İndir ({entries.length} gün)
              </button>
              <label className="w-full py-2.5 px-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-4 h-4" /> JSON Yedeğinden Geri Yükle
                <input type="file" accept="application/json" className="hidden" onChange={importJson} />
              </label>
              <button
                onClick={wipeAll}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer ${
                  deleteStep === 1 ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 border border-rose-200'
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
