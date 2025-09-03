import { useEffect, useRef } from 'react';

export default function ConfettiBurst({ show = false, duration = 2500, onEnd }: { show?: boolean; duration?: number; onEnd?: () => void }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!show) return;
    const cnv = ref.current; if (!cnv) return;
    const ctx = cnv.getContext('2d'); if (!ctx) return;
    let raf = 0; let ended = false;
    const DPR = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    const resize = () => { cnv.width = cnv.clientWidth * DPR; cnv.height = cnv.clientHeight * DPR; };
    resize();
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#a855f7', '#22d3ee'];
    type P = { x:number; y:number; vx:number; vy:number; r:number; c:string; a:number; s:number };
    const parts: P[] = [];
    const spawn = (n: number) => {
      for (let i=0;i<n;i++) {
        parts.push({
          x: cnv.width/2, y: cnv.height*0.15,
          vx: (Math.random()-0.5) * 8 * DPR,
          vy: (Math.random()*-4 - 6) * DPR,
          r: Math.random()*3 + 2,
          c: colors[Math.floor(Math.random()*colors.length)],
          a: 1,
          s: Math.random()*0.02 + 0.01,
        });
      }
    };
    spawn(220);
    const start = performance.now();
    const tick = (t: number) => {
      const w = cnv.width, h = cnv.height;
      ctx.clearRect(0,0,w,h);
      const dt = 16; // ms approx
      for (const p of parts) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.25 * DPR; // gravity
        p.a -= p.s; if (p.a < 0) p.a = 0;
        ctx.globalAlpha = p.a; ctx.fillStyle = p.c;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (t - start < duration) {
        raf = requestAnimationFrame(tick);
      } else if (!ended) {
        ended = true; onEnd?.();
      }
    };
    raf = requestAnimationFrame(tick);
    const onResize = () => resize();
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [show, duration, onEnd]);

  if (!show) return null;
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-50 w-full h-full" aria-hidden="true" />;
}
