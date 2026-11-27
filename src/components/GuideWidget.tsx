import { useEffect, useState } from 'react';
import { BookOpen, Eye, Layers, LineChart, Lock, X } from 'lucide-react';

const GUIDE_STEPS = [
  {
    icon: Eye,
    badge: '01 · KONFOR & MİGREN MODU',
    title: 'Göz Yormayan Alacakaranlık / Kum Teması',
    desc: 'Sağ üstteki tema anahtarıyla Alacakaranlık (koyu mat) veya Sıcak Kum (düşük parlaklık) modunu seçerek ışık hassasiyetini azaltın.',
  },
  {
    icon: Layers,
    badge: '02 · 3 ADIMLI HIZLI KAYIT',
    title: 'Sayfa Sayfa Sade Giriş',
    desc: 'Kalabalık formlar yerine sırasıyla: 1. Bugün Nasıl Hissediyorsun? → 2. Uyku, Su & Kafein → 3. Günlük Tetikleyiciler adımlarını tamamlayın.',
  },
  {
    icon: LineChart,
    badge: '03 · TETİKLEYİCİ KORELASYONU',
    title: 'Kişisel Örüntü & Tavsiye Çıktısı',
    desc: 'Kayıtlarınız biriktikçe hangi uyku süresi, su tüketimi veya tetikleyicinin baş ağrısı ve enerji düşüşüyle ilişkili olduğunu net görün.',
  },
  {
    icon: Lock,
    badge: '04 · YEREL GİZLİLİK',
    title: 'Veriler Yalnızca Cihazınızda',
    desc: 'Tüm günlük kayıtlarınız tarayıcınızda saklanır; dilediğiniz an JSON olarak yedekleyebilir veya tek tıkla silebilirsiniz.',
  },
];

export function GuideWidget() {
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('rehber') === '1' || window.location.hash === '#rehber';
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="RitimGünlüğü kullanım rehberini aç"
        style={{
          backgroundColor: 'var(--bg-card)',
          color: 'var(--ink-main)',
          border: '1px solid var(--accent-sage)',
        }}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold shadow-md cursor-pointer transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        <BookOpen className="w-4 h-4" style={{ color: 'var(--accent-sage)' }} />
        <span>Rehber</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="app-guide-title"
        >
          <div
            style={{
              backgroundColor: 'var(--bg-page)',
              color: 'var(--ink-main)',
              border: '1px solid var(--border-soft)',
            }}
            className="w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                borderBottom: '1px solid var(--border-soft)',
              }}
              className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 rounded-t-2xl"
            >
              <div>
                <div
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: 'var(--accent-sage)' }}
                >
                  RitimGünlüğü Kullanım Rehberi
                </div>
                <h2 id="app-guide-title" className="text-lg font-bold">
                  3 Adımda Ritim Takibi
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Rehberi kapat"
                style={{
                  backgroundColor: 'var(--bg-card-alt)',
                  border: '1px solid var(--border-soft)',
                  color: 'var(--ink-main)',
                }}
                className="rounded-lg p-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              {GUIDE_STEPS.map((step) => {
                const Icon = step.icon;
                return (
                  <div
                    key={step.badge}
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      border: '1px solid var(--border-soft)',
                    }}
                    className="rounded-xl p-3.5 flex items-start gap-3"
                  >
                    <div
                      className="shrink-0 rounded-lg p-2"
                      style={{
                        backgroundColor: 'var(--accent-sage-soft)',
                        color: 'var(--accent-sage)',
                      }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <div
                        className="text-[10px] font-bold tracking-wider"
                        style={{ color: 'var(--accent-sage)' }}
                      >
                        {step.badge}
                      </div>
                      <h3 className="text-sm font-bold">{step.title}</h3>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-muted)' }}>
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                borderTop: '1px solid var(--border-soft)',
              }}
              className="px-5 py-3 flex justify-end rounded-b-2xl"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  backgroundColor: 'var(--accent-sage)',
                  color: '#111827',
                }}
                className="rounded-xl px-4 py-2 text-xs font-bold cursor-pointer focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                Anladım
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
