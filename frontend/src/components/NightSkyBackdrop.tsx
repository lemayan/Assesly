import { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

type Props = {
  density?: number; // approximate star count per megapixel
  opacity?: number; // overall opacity of stars layer
  aurora?: boolean; // show subtle aurora gradients
};

export default function NightSkyBackdrop({ density = 140, opacity = 0.6, aurora = true }: Props) {
  const { effective } = useTheme();
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (effective !== 'dark') return;
    const cnv = ref.current;
    if (!cnv) return;
    const ctx = cnv.getContext('2d');
    if (!ctx) return;

    const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const resize = () => {
      cnv.width = cnv.clientWidth * DPR;
      cnv.height = cnv.clientHeight * DPR;
    };
    resize();

    type Star = { x: number; y: number; r: number; d: number; t: number };
    let stars: Star[] = [];
    const seedStars = () => {
      const w = cnv.width, h = cnv.height;
      const megaPixels = (w * h) / 1_000_000;
      const count = Math.max(80, Math.floor(density * megaPixels));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: (Math.random() * 0.9 + 0.3) * DPR,
        d: Math.random() * 0.8 + 0.2, // depth/parallax factor 0..1
        t: Math.random() * Math.PI * 2,
      }));
    };
    seedStars();

    const drawAurora = () => {
      if (!aurora) return;
      const w = cnv.width, h = cnv.height;
      // top-right cyan/blue
      const g1 = ctx.createRadialGradient(w * 0.8, h * 0.1, 0, w * 0.8, h * 0.1, Math.max(w, h) * 0.6);
      g1.addColorStop(0, 'rgba(34,211,238,0.10)');
      g1.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.fillStyle = g1; ctx.fillRect(0, 0, w, h);
      // top-left violet
      const g2 = ctx.createRadialGradient(w * 0.2, h * 0.05, 0, w * 0.2, h * 0.05, Math.max(w, h) * 0.55);
      g2.addColorStop(0, 'rgba(139,92,246,0.08)');
      g2.addColorStop(1, 'rgba(139,92,246,0)');
      ctx.fillStyle = g2; ctx.fillRect(0, 0, w, h);
      // bottom emerald glow
      const g3 = ctx.createLinearGradient(0, h * 0.8, 0, h);
      g3.addColorStop(0, 'rgba(16,185,129,0)');
      g3.addColorStop(1, 'rgba(16,185,129,0.07)');
      ctx.fillStyle = g3; ctx.fillRect(0, 0, w, h);
    };

    const pointer = { x: 0, y: 0 };
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (reduceMotion) return;
      const cx = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const cy = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const rect = cnv.getBoundingClientRect();
      pointer.x = (cx - rect.left) / rect.width - 0.5;
      pointer.y = (cy - rect.top) / rect.height - 0.5;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove, { passive: true });

    const draw = (ts: number) => {
      const w = cnv.width, h = cnv.height;
      ctx.clearRect(0, 0, w, h);
      // base deep gradient to blend with CSS bg
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(3,7,18,0.9)');
      g.addColorStop(1, 'rgba(0,1,10,0.9)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);

      // stars
      ctx.globalAlpha = opacity;
      ctx.fillStyle = '#cbd5e1';
      for (const s of stars) {
        const parX = reduceMotion ? 0 : pointer.x * s.d * 16 * DPR;
        const parY = reduceMotion ? 0 : pointer.y * s.d * 8 * DPR;
        const tw = reduceMotion ? 0.3 : (Math.sin(ts * 0.002 + s.t) + 1) / 2; // 0..1
        const rr = (s.r + tw * 0.5);
        const x = (s.x + (reduceMotion ? 0 : ts * 0.02 * s.d)) % w;
        const y = s.y;
        ctx.beginPath();
        ctx.arc(x < 0 ? x + w : x + parX, y < 0 ? y + h : y + parY, rr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // aurora overlays
      drawAurora();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    const onResize = () => { resize(); seedStars(); };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove as any);
    };
  }, [effective, density, opacity, aurora]);

  if (effective !== 'dark') return null;
  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 -z-10 w-full h-full"
      aria-hidden="true"
    />
  );
}
