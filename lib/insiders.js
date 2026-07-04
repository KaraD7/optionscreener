// Cluster-buy scoring over Form 4 transactions (from lib/edgar.js).
// Pure functions, no I/O — usable from the API route and from tests.
//
// The signal we care about: open-market purchases (transaction code P,
// acquired) by company insiders, ideally several distinct insiders within a
// short window ("cluster buy"). Awards/grants (code A) and sales are not
// entry signals; heavy selling is surfaced as a caution flag.

const EXEC_TITLE = /chief|ceo|cfo|coo|president|chair/i;

export function scoreCluster(transactions, { windowDays = 30 } = {}) {
  const since = new Date(Date.now() - windowDays * 86400e3)
    .toISOString()
    .slice(0, 10);
  const inWindow = transactions.filter((t) => (t.date || t.filingDate) >= since);

  const buys = inWindow.filter((t) => t.code === 'P' && t.acquired !== 'D');
  const sells = inWindow.filter((t) => t.code === 'S');

  const buyers = new Set(buys.map((t) => t.owner));
  const totalBuyValue = buys.reduce((s, t) => s + (t.value || 0), 0);
  const totalSellValue = sells.reduce((s, t) => s + (t.value || 0), 0);
  const execBuy = buys.some(
    (t) => t.isOfficer && t.officerTitle && EXEC_TITLE.test(t.officerTitle)
  );

  // Net heavy selling drowns out a token buy.
  const netSelling = totalSellValue > 0 && totalSellValue > 3 * totalBuyValue;

  let level; // 'strong' | 'moderate' | 'weak' | 'none'
  if (buys.length === 0) {
    level = 'none';
  } else if (netSelling) {
    level = 'weak';
  } else if (
    buyers.size >= 3 ||
    (buyers.size >= 2 && totalBuyValue >= 100_000) ||
    (execBuy && totalBuyValue >= 500_000)
  ) {
    level = 'strong';
  } else if (
    buyers.size >= 2 ||
    totalBuyValue >= 100_000 ||
    (execBuy && totalBuyValue >= 25_000)
  ) {
    level = 'moderate';
  } else {
    level = 'weak';
  }

  return {
    level,
    windowDays,
    buyCount: buys.length,
    distinctBuyers: buyers.size,
    totalBuyValue,
    sellCount: sells.length,
    totalSellValue,
    execBuy,
    netSelling,
  };
}
