import { useEffect, useMemo, useRef, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button, Card } from '../components/UI';
import { Link } from 'react-router-dom';
import { ShieldCheck, Upload, Timer, BarChart3, Sparkles } from 'lucide-react';
import Logo from '../components/Logo';
import { useTheme } from '../contexts/ThemeContext';

export default function LandingPage() {
  const { effective, toggle } = useTheme();
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const darkImages = useMemo(
    () => [
      'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?q=80&w=1600&auto=format&fit=crop', // Milky Way over road
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=1600&auto=format&fit=crop', // Galaxy sky
      'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1600&auto=format&fit=crop', // Star field
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1600&auto=format&fit=crop', // Space abstract
    ],
    []
  );
  const lightImages = useMemo(
    () => [
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1600&auto=format&fit=crop', // bright workspace
      'https://images.unsplash.com/photo-1550439062-609e1531270e?q=80&w=1600&auto=format&fit=crop', // modern study
      'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop', // collaboration
      'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?q=80&w=1600&auto=format&fit=crop', // clean desk
    ],
    []
  );
  const [topics, setTopics] = useState<Array<{ topic: string; percentage: number }>>([
    { topic: 'Math', percentage: 75 },
    { topic: 'Science', percentage: 62 },
    { topic: 'History', percentage: 81 },
    { topic: 'Geography', percentage: 70 },
  ]);

  // Swap hero image on theme change with curated high-quality images
  useEffect(() => {
    const arr = effective === 'dark' ? darkImages : lightImages;
    const url = arr[Math.floor(Math.random() * arr.length)];
    setImgUrl(url);
  }, [effective, darkImages, lightImages]);

  // Animated background layers
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const cnv = canvasRef.current;
    if (!cnv) return;
    const ctx = cnv.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const resize = () => {
      cnv.width = cnv.clientWidth * DPR;
      cnv.height = cnv.clientHeight * DPR;
    };
    resize();
    // Pointer for parallax
    const pointer = { x: 0, y: 0 };
    const onMove = (e: MouseEvent | TouchEvent) => {
      const cx = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const cy = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const rect = cnv.getBoundingClientRect();
      pointer.x = (cx - rect.left) / rect.width - 0.5; // -0.5..0.5
      pointer.y = (cy - rect.top) / rect.height - 0.5;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });

    // General stars
    const stars = Array.from({ length: 300 }, () => ({
      x: Math.random(), y: Math.random(), r: Math.random() * 0.9 + 0.2, d: Math.random() * 0.8 + 0.2, t: Math.random() * Math.PI * 2,
    }));
    // Milky Way band parameters
    const bandAngle = (Math.random() * 0.6 + 0.2) * Math.PI; // ~11°-45°
    const bandCx = 0.5, bandCy = 0.5, bandWidth = 0.18; // normalized
    const bandStars = Array.from({ length: 600 }, () => {
      // Sample points along a diagonal band using Gaussian offset
      const u = Math.random() - 0.5;
      const v = (Math.random() - 0.5) * bandWidth;
      const cos = Math.cos(bandAngle), sin = Math.sin(bandAngle);
      const x = bandCx + u * cos - v * sin;
      const y = bandCy + u * sin + v * cos;
      return { x, y, r: Math.random() * 1.3 + 0.3, d: Math.random() * 1.2 + 0.6, t: Math.random() * Math.PI * 2 };
    }).filter(s => s.x >= 0 && s.x <= 1 && s.y >= 0 && s.y <= 1);

    const clouds = Array.from({ length: 6 }, () => ({
      x: Math.random(), y: Math.random(), s: Math.random() * 0.5 + 0.6, t: Math.random() * 1000,
    }));
    const draw = (ts: number) => {
      const w = cnv.width, h = cnv.height;
      ctx.clearRect(0, 0, w, h);
      if (effective === 'dark') {
        // Deep night gradient
        const g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#030712');
        g.addColorStop(1, '#00010a');
        ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
        // Parallax and twinkle helpers
        const drawStars = (arr: typeof stars, color = '#e5e7eb', twSpeed = 0.002) => {
          ctx.fillStyle = color;
          for (const s of arr) {
            const parX = pointer.x * s.d * 20 * DPR;
            const parY = pointer.y * s.d * 10 * DPR;
            const tw = (Math.sin(ts*twSpeed + s.t) + 1)/2;
            const rr = (s.r + tw*0.6) * DPR;
            ctx.globalAlpha = 0.5 + tw*0.5;
            const x = (s.x * w + parX + ts*0.003*s.d) % w;
            const y = (s.y * h + parY) % h;
            ctx.beginPath(); ctx.arc(x<0?x+w:x, y<0?y+h:y, rr, 0, Math.PI*2); ctx.fill();
          }
          ctx.globalAlpha = 1;
        };
        drawStars(stars, '#cbd5e1', 0.002);
        drawStars(bandStars, '#f8fafc', 0.003);
      } else {
        // light mode sky
        const g = ctx.createLinearGradient(0,0,0,h);
        g.addColorStop(0, '#e0f2fe');
        g.addColorStop(1, '#ffffff');
        ctx.fillStyle = g; ctx.fillRect(0,0,w,h);
        // soft clouds
        clouds.forEach((c, i) => {
          const x = ((c.x + (ts*0.00003)*(0.2 + i*0.05)) % 1) * w;
          const y = c.y * h * 0.6;
          const r = 120 * c.s * DPR;
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          for (let k=0;k<5;k++) {
            ctx.beginPath(); ctx.arc(x + k*r*0.4, y + (k%2)*r*0.2, r*(1 - k*0.12), 0, Math.PI*2); ctx.fill();
          }
        });
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); window.removeEventListener('mousemove', onMove); window.removeEventListener('touchmove', onMove as any); };
  }, [effective]);

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />

      {/* Minimal Nav */}
    <nav className="relative z-10">
        <div className="container h-16 flex items-center justify-between">
      <Logo />
          <div className="flex items-center gap-3">
            <ThemeToggle onClick={toggle} current={effective} />
            <Link to="/login"><Button>Sign In</Button></Link>
          </div>
        </div>
      </nav>

      {/* Minimal Hero */}
      <section className="relative z-10 container py-20 grid md:grid-cols-12 gap-10 items-center">
        <div className="md:col-span-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs glass mb-5"><Sparkles className="w-4 h-4 text-blue-400" /> Minimal • Fast • Beautiful</div>
          <h1 className="text-5xl font-extrabold leading-tight mb-3">Assessly</h1>
          <p className="text-2xl text-gradient font-semibold mb-4">Exams without the clutter.</p>
          <p className="text-gray-600 dark:text-gray-300 mb-8">Create, take, and analyze exams with a clean, focused experience. Nothing extra—just what you need, done well.</p>
          <div className="flex gap-3">
            <Link to="/login"><Button>Get Started</Button></Link>
            <a href="#features" className="px-4 py-2 text-sm">See features</a>
          </div>
        </div>
        <div className="md:col-span-6">
          <div className="rounded-xl overflow-hidden glass aspect-video flex items-center justify-center animate-float">
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img
              src={imgUrl || (effective === 'dark' ? darkImages[0] : lightImages[0])}
              onError={(e) => {
                const el = e.currentTarget as HTMLImageElement;
                const arr = effective === 'dark' ? darkImages : lightImages;
                const idx = arr.findIndex((u) => u === el.src);
                const next = arr[(Math.max(idx, 0) + 1) % arr.length];
                if (el.src !== next) el.src = next;
              }}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Compact Features */}
      <section id="features" className="relative z-10 container pb-16">
        <div className="grid md:grid-cols-3 gap-4">
          <Feature icon={<Upload className="w-5 h-5" />} title="Import fast" desc="CSV/XLSX in, ready to use." />
          <Feature icon={<Timer className="w-5 h-5" />} title="Focused flow" desc="Timer, progress, flags—no noise." />
          <Feature icon={<ShieldCheck className="w-5 h-5" />} title="Roles" desc="Clear admin and student spaces." />
          <Feature icon={<BarChart3 className="w-5 h-5" />} title="Clarity" desc="Topic insights at a glance." />
          <Feature icon={<Sparkles className="w-5 h-5" />} title="AI visuals" desc="Subtle, bespoke imagery." />
        </div>
      </section>

      {/* Subtle Analytics Demo */}
      <section className="relative z-10 container pb-20">
        <Card className="glass">
          <div className="font-medium mb-2">Topic snapshot</div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={topics}>
                <defs>
                  <linearGradient id="lpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="topic" />
                <YAxis domain={[0,100]} />
                <Tooltip />
                <Area type="monotone" dataKey="percentage" stroke="#3b82f6" fillOpacity={1} fill="url(#lpGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      {/* Minimal Footer */}
  <footer className="relative z-10 border-t border-gray-200 dark:border-gray-800">
        <div className="container h-16 flex items-center justify-between text-sm">
          <div className="text-gray-500">© {new Date().getFullYear()} Assessly</div>
          <a href="#features" className="text-gray-500">Features</a>
        </div>
      </footer>
    </div>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="glass">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded bg-blue-600/10 text-blue-700 dark:text-blue-300 flex items-center justify-center">{icon}</div>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-sm text-gray-600 dark:text-gray-300">{desc}</div>
        </div>
      </div>
    </Card>
  );
}

function Testimonial({ name, role, quote }: { name: string; role: string; quote: string }) {
  return (
    <Card className="glass">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500" />
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-500 mb-2">{role}</div>
          <div className="text-sm">“{quote}”</div>
        </div>
      </div>
    </Card>
  );
}

// Pricing removed for minimalist design

function ThemeToggle({ onClick, current }: { onClick: () => void; current: 'light' | 'dark' }) {
  return (
    <button
      onClick={onClick}
      aria-label="Toggle theme"
      title={`Switch to ${current === 'dark' ? 'light' : 'dark'} mode`}
      className="relative w-10 h-10 rounded-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {/* Animated icon: stars for dark, sun/cloud for light */}
      <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-500" style={{ opacity: current === 'dark' ? 1 : 0 }}>
        {/* Starry icon */}
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-blue-300 animate-pulse">
          <path d="M12 2l1.5 3 3 .5-2.25 2.2.55 3.2L12 9.8 9.2 10.9l.55-3.2L7.5 5.5l3-.5L12 2z" />
          <circle cx="18" cy="6" r="1" />
          <circle cx="5" cy="8" r="1" />
          <circle cx="16" cy="14" r="1" />
        </svg>
      </div>
      <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-500" style={{ opacity: current === 'light' ? 1 : 0 }}>
        {/* Sun behind cloud */}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-blue-600">
          <circle cx="12" cy="10" r="3" fill="#fde68a" stroke="none" />
          <path d="M6 15a3 3 0 0 1 2.8-2 4 4 0 0 1 7.2 1h.5a2.5 2.5 0 1 1 0 5H7a3 3 0 0 1-1-4z" fill="#e5f0ff" stroke="none" />
        </svg>
      </div>
      {/* subtle background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-cyan-500/20 dark:from-blue-400/10 dark:to-cyan-400/10" />
    </button>
  );
}
