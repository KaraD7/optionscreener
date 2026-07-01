// Shared display formatters used by both views.

export const pct = (v, d = 1) =>
  v == null || Number.isNaN(v) ? '—' : (v * 100).toFixed(d) + '%';

export const fix = (v, d = 2) =>
  v == null || Number.isNaN(v) || !Number.isFinite(v) ? '—' : v.toFixed(d);

export const money = (v) =>
  v == null || Number.isNaN(v)
    ? '—'
    : !Number.isFinite(v)
    ? '∞'
    : (v < 0 ? '-$' : '$') + Math.abs(v).toFixed(2);

export const dateStr = (epoch) =>
  new Date(epoch * 1000).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
  });

export function ratioColor(r) {
  if (r == null) return 'var(--muted)';
  if (r < 0.8) return 'var(--cheap)';
  if (r < 1.1) return 'var(--neutral)';
  if (r < 1.4) return 'var(--warm)';
  return 'var(--rich)';
}
