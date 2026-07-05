// Holding-period comparison: given the screener's analyzed rows (each row
// already carries pop + verdict score from lib/analysis.js) and the insider
// cluster read, score the four entry horizons against each other and pick one.
//
// Pure functions, no I/O. Reason entries are returned as { key, vars, tone }
// codes so the component can render them through i18n.

export const PERIODS = [
  { id: 'p7', dteMin: 2, dteMax: 10 },      // ~7 days
  { id: 'p50', dteMin: 40, dteMax: 70 },    // 50-60 days
  { id: 'p90', dteMin: 71, dteMax: 130 },   // ~90 days
  { id: 'p3m', dteMin: 131, dteMax: 3650 }, // 3+ months (LEAPS territory)
];

// How well an insider cluster's typical payoff horizon (1-6 months) lines up
// with each bucket. Short-dated options expire before the thesis plays out.
const INSIDER_ALIGN = {
  p7: 0,
  p50: 0.5,
  p90: 2,
  p3m: 1.5,
};

function thetaDragPerDay(row) {
  if (!(row.premium > 0) || row.theta == null) return null;
  return Math.abs(row.theta) / row.premium;
}

export function comparePeriods(analyzedRows, cluster) {
  const clusterWeight =
    cluster?.level === 'strong' ? 1 : cluster?.level === 'moderate' ? 0.5 : 0;

  const out = PERIODS.map((p) => {
    const rows = analyzedRows.filter((r) => r.dte >= p.dteMin && r.dte <= p.dteMax);
    // Best contract in the bucket: verdict score first, chance as tiebreak.
    const best =
      [...rows].sort(
        (a, b) => b.dealScore - a.dealScore || b.pop - a.pop
      )[0] || null;

    const reasons = [];
    let score = null;

    if (!best) {
      reasons.push({ key: 'periodNoContracts', tone: 'bad' });
    } else {
      const drag = thetaDragPerDay(best);
      const dragPenalty = drag != null ? Math.min(3, drag * 100) : 0;
      const insiderBonus = INSIDER_ALIGN[p.id] * clusterWeight;

      score = best.dealScore + best.pop * 2 - dragPenalty + insiderBonus;

      reasons.push({
        key: 'periodBestContract',
        vars: { pop: (best.pop * 100).toFixed(0), ivHv: best.ivHv != null ? best.ivHv.toFixed(2) : '—' },
        tone: best.dealTone,
      });
      if (drag != null) {
        reasons.push({
          key: 'periodThetaNote',
          vars: { pct: (drag * 100).toFixed(1) },
          tone: drag < 0.02 ? 'good' : drag < 0.04 ? 'ok' : 'bad',
        });
      }
      if (insiderBonus > 0) {
        reasons.push({ key: 'periodInsiderAlign', tone: 'good' });
      } else if (clusterWeight > 0 && p.id === 'p7') {
        reasons.push({ key: 'periodInsiderTooShort', tone: 'bad' });
      }
      if (p.id === 'p7') {
        reasons.push({ key: 'periodLotteryWarn', tone: 'bad' });
      } else {
        reasons.push({ key: 'periodExitRule', tone: 'ok' });
      }
    }

    return { ...p, best, score, reasons };
  });

  const scored = out.filter((p) => p.score != null);
  const recommendedId = scored.length
    ? scored.reduce((a, b) => (b.score > a.score ? b : a)).id
    : null;

  return { periods: out, recommendedId };
}
