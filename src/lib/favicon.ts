import { useEffect } from 'react';

const TARGET_PRICE = 3_00_00_000;

function draw(progress: number, pulse: number): string {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  const cx = 32, cy = 32, r = 27;

  // Shadow glow when progress > 0
  if (progress > 0) {
    ctx.shadowColor = progress >= 100 ? '#10b981' : '#3b82f6';
    ctx.shadowBlur = 4 + pulse * 6;
  }

  // Background ring
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(100,116,139,0.25)';
  ctx.lineWidth = 5;
  ctx.stroke();

  ctx.shadowBlur = 0;

  // Progress arc
  if (progress > 0) {
    const endAngle = -Math.PI / 2 + (Math.min(progress, 100) / 100) * Math.PI * 2;
    const grad = ctx.createLinearGradient(cx - r, cy, cx + r, cy);
    if (progress >= 100) {
      grad.addColorStop(0, '#10b981');
      grad.addColorStop(1, '#34d399');
    } else {
      grad.addColorStop(0, '#3b82f6');
      grad.addColorStop(1, '#818cf8');
    }
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, endAngle);
    ctx.strokeStyle = grad;
    ctx.lineWidth = 5 + pulse * 1.5;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // House emoji
  ctx.font = '28px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏠', cx, cy + 1);

  return canvas.toDataURL('image/png');
}

function setFaviconHref(href: string) {
  let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/png';
  link.href = href;
}

export function useDynamicFavicon(totalAssets: number) {
  const progress = Math.min((totalAssets / TARGET_PRICE) * 100, 100);

  useEffect(() => {
    let raf: number;
    let startTs: number | null = null;

    function tick(ts: number) {
      if (!startTs) startTs = ts;
      // Gentle breathing pulse: 0→1→0 every 3 s
      const pulse = (Math.sin(((ts - startTs) / 3000) * Math.PI * 2) + 1) / 2;
      setFaviconHref(draw(progress, pulse));
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [progress]);
}
