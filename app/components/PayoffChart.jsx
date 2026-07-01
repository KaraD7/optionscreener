'use client';

import { money } from '../../lib/format';

export default function PayoffChart({ curve, spot, breakeven }) {
  if (!curve || curve.length < 2) return null;
  const W = 600;
  const H = 260;
  const padL = 8;
  const padR = 8;
  const padT = 14;
  const padB = 26;
  const iw = W - padL - padR;
  const ih = H - padT - padB;

  const prices = curve.map((c) => c.price);
  const pnls = curve.map((c) => c.pnl);
  const pMin = Math.min(...prices);
  const pMax = Math.max(...prices);
  let vMin = Math.min(...pnls, 0);
  let vMax = Math.max(...pnls, 0);
  const padV = (vMax - vMin) * 0.08 || 1;
  vMin -= padV;
  vMax += padV;

  const x = (p) => padL + ((p - pMin) / (pMax - pMin)) * iw;
  const y = (v) => padT + (1 - (v - vMin) / (vMax - vMin)) * ih;
  const zeroY = y(0);
  const zeroFrac = zeroY / H;

  const line = curve.map((c, i) => `${i ? 'L' : 'M'}${x(c.price).toFixed(1)},${y(c.pnl).toFixed(1)}`).join(' ');
  const area =
    `M${x(curve[0].price).toFixed(1)},${zeroY.toFixed(1)} ` +
    curve.map((c) => `L${x(c.price).toFixed(1)},${y(c.pnl).toFixed(1)}`).join(' ') +
    ` L${x(curve[curve.length - 1].price).toFixed(1)},${zeroY.toFixed(1)} Z`;

  return (
    <svg className="payoff" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Payoff diagram">
      <defs>
        <linearGradient id="pnlfill" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={H}>
          <stop offset="0" stopColor="var(--cheap)" stopOpacity="0.32" />
          <stop offset={Math.max(0, zeroFrac - 0.001)} stopColor="var(--cheap)" stopOpacity="0.32" />
          <stop offset={Math.min(1, zeroFrac + 0.001)} stopColor="var(--rich)" stopOpacity="0.30" />
          <stop offset="1" stopColor="var(--rich)" stopOpacity="0.30" />
        </linearGradient>
      </defs>

      <path d={area} fill="url(#pnlfill)" />
      <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY} stroke="var(--line)" strokeWidth="1" />
      <path d={line} fill="none" stroke="var(--text)" strokeWidth="2" />

      {/* spot marker */}
      <line x1={x(spot)} y1={padT} x2={x(spot)} y2={H - padB} stroke="var(--neutral)" strokeWidth="1" strokeDasharray="3 3" />
      <text x={x(spot)} y={H - 8} fill="var(--neutral)" fontSize="11" fontFamily="var(--mono)" textAnchor="middle">spot {money(spot)}</text>

      {/* breakeven marker */}
      {breakeven > pMin && breakeven < pMax && (
        <>
          <line x1={x(breakeven)} y1={padT} x2={x(breakeven)} y2={H - padB} stroke="var(--muted)" strokeWidth="1" strokeDasharray="2 4" />
          <text x={x(breakeven)} y={padT + 4} fill="var(--muted)" fontSize="11" fontFamily="var(--mono)" textAnchor="middle">B/E {money(breakeven)}</text>
        </>
      )}
    </svg>
  );
}
