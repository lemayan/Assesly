import { useEffect, useRef } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export default function CloudBackdrop({ opacity = 0.35 }: { opacity?: number }) {
  const { effective } = useTheme();
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (effective !== 'light') return;
    const cnv = ref.current;
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

    const clouds = Array.from({ length: 7 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.7,
      s: Math.random() * 0.5 + 0.6,
      speed: 0.00002 + Math.random() * 0.00003,
    }));

    const draw = (ts: number) => {
      const w = cnv.width, h = cnv.height;
      ctx.clearRect(0, 0, w, h);
      // light sky gradient base
      const g = ctx.createLinearGradient(0,0,0,h);
      g.addColorStop(0, 'rgba(224,242,254,0.7)');
      g.addColorStop(1, 'rgba(255,255,255,0.7)');
      ctx.fillStyle = g;
      ctx.fillRect(0,0,w,h);

      ctx.globalAlpha = opacity;
      clouds.forEach((c, i) => {
        const x = ((c.x + ts * c.speed * (0.4 + i * 0.08)) % 1) * w;
        const y = c.y * h;
        const r = 120 * c.s * DPR;
        ctx.fillStyle = 'white';
        for (let k = 0; k < 5; k++) {
          ctx.beginPath();
          ctx.arc(x + k * r * 0.4, y + (k % 2) * r * 0.2, r * (1 - k * 0.12), 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [effective, opacity]);

  if (effective !== 'light') return null;
  return (
    <canvas
      ref={ref}
      className="pointer-events-none fixed inset-0 -z-10 w-full h-full"
      aria-hidden="true"
    />
  );
}
