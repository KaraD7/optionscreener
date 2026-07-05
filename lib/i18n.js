// Central EN/BG dictionary. Flat string keys, {var} interpolation.
// Used both from React components (via the LanguageContext hook) and from
// plain modules like lib/analysis.js (via the exported t() directly).

const dict = {
  en: {
    // ---- header ----
    tagline: 'Buy options when their volatility is cheap — not when the stock looks exciting.',
    tabScreener: 'Screener',
    tabScreenerSub: "scan a US ticker's whole chain",
    tabAnalyzer: 'Trade analyzer',
    tabAnalyzerSub: 'enter one option, get the verdict',

    // ---- screener: controls ----
    tickerLabel: 'US ticker',
    riskFreeLabel: 'Risk-free %',
    riskFreeInfo:
      "Risk-free interest rate (e.g. US Treasury yield). Used in the option pricing model. Low impact — usually left at ~4-4.5%.",
    commissionLabel: 'Commission /contract',
    commissionInfo:
      "The fee your broker charges per contract (not the bid/ask price). Feeds into the breakeven calculation.",
    analyze: 'Analyze',
    loading: 'Loading…',

    // ---- screener: empty / hint / error ----
    screenerHint:
      'Enter a US stock symbol. The screener pulls the live option chain, computes Black-Scholes Greeks, and ranks contracts by <b>IV/HV</b> — implied volatility divided by the stock\'s realized volatility. A low ratio means the option is pricing in less movement than the stock has actually delivered, i.e. comparatively cheap to buy.',
    noReliableIv:
      "No contracts with a reliable IV solve right now. Yahoo's free feed occasionally falls back to placeholder volatility values it can't honestly price — those are filtered out rather than shown as fake Greeks. Try again shortly or a different ticker.",

    // ---- screener: summary strip ----
    price: 'Price',
    atmIv: 'ATM IV',
    hv20: 'HV 20d',
    hv30: 'HV 30d',
    hvBand: 'HV 52w range',

    // ---- best/selected card ----
    cheapestVol: 'Cheapest volatility',
    selectedContract: 'Selected contract',
    bestCall: 'BEST CALL',
    bestPut: 'BEST PUT',
    call: 'CALL',
    put: 'PUT',
    ivHvLabel: 'IV / HV',
    gaugeNoRange: 'No 52-week HV range available.',
    gaugeCaption:
      "Marker = this option's IV against the stock's 52-week realized-vol range. Left is cheap.",
    strike: 'Strike',
    expiryDte: 'Expiry · DTE',
    ivLast: 'IV last',
    premium: 'Premium',
    delta: 'Delta',
    gamma: 'Gamma',
    thetaDay: 'Theta /day',
    breakeven: 'Breakeven',

    // ---- table ----
    liquidContracts: '{n} liquid contracts',
    all: 'All',
    calls: 'Calls',
    puts: 'Puts',
    expiry: 'Expiry',
    allDates: 'All dates',
    minStrike: 'Min strike',
    maxStrike: 'Max strike',
    minVolume: 'Min volume',
    colType: 'Type',
    colStrike: 'Strike',
    colExpiry: 'Expiry',
    colDte: 'DTE',
    colIv: 'IV',
    colIvHv: 'IV/HV',
    colDelta: 'Delta',
    colGamma: 'Gamma',
    colTheta: 'Theta',
    colPremium: 'Premium',
    colBE: 'B/E',
    colVol: 'Vol',
    colOI: 'OI',
    colChance: 'Chance',
    colDeal: 'Deal',
    sortBy: 'Sort by',
    bestChance: 'Best chance',
    bestDeal: 'Best deal',

    screenerFoot:
      '<b>How to read it.</b> IV/HV below ~0.8 (green) = the option is pricing in less movement than the stock recently delivered — relatively cheap for a buyer. Above ~1.4 (red) = expensive. Greeks are Black-Scholes estimates; HV is realized volatility, a free stand-in for true historical implied volatility. Data is delayed and unofficial (Yahoo Finance). This is an analysis tool, <b>not financial advice</b>.',

    // ---- selected contract mini-analysis ----
    overallRec: 'Overall recommendation',
    popInline: '{pop}% chance of profit',
    goodReasons: "Why it's a good pick",
    badReasons: "Why it's a risky pick",

    // ---- analyzer: form ----
    call_: 'Call',
    put_: 'Put',
    underlyingPrice: 'Underlying price',
    strikeField: 'Strike',
    premiumShare: 'Premium / share',
    premiumShareInfo:
      'Last / mid price of the option per share (not per contract). IBKR shows it as Last, Bid, or Ask.',
    daysToExpiry: 'Days to expiry',
    ivLastPct: 'IV last %',
    ivLastInfo: "The specific contract's implied volatility, exactly as shown in IBKR (IV last).",
    ivHistVol: 'IV Hist Vol % (optional)',
    ivHistVolInfo:
      "The stock's historical (realized) volatility, as shown in IBKR (IV Hist Vol). Used to compare IV/HV.",
    ivRank: '52w IV Rank (optional)',
    ivRankInfo:
      "0-100 percentile: where current IV sits within its 52-week range. IBKR shows this directly.",
    targetPrice: 'Target price (optional)',
    targetPriceInfo:
      'Price you expect the stock to reach — used for the reward:risk calculation.',
    contracts: 'Contracts',
    riskFreeInfoAnalyzer:
      'Risk-free interest rate (e.g. US Treasury yield). Feeds into the option pricing model. Low impact — usually left at ~4-4.5%.',
    commissionInfoAnalyzer:
      "Your broker's fee per contract — not the bid/ask price. Feeds into the breakeven calculation.",
    driftAssumption: 'Drift assumption',
    driftInfo:
      "What average annual return you're assuming for the stock when computing the odds of success. 'Risk-free' is a neutral model assumption, not a forecast.",
    driftRf: 'Risk-free',
    driftZero: 'Zero (conservative)',
    driftCustom: 'Custom %',
    expectedAnnual: 'Expected annual %',

    addManualGreeks: '+ Add manual Greeks (paste from broker)',
    hideManualGreeks: '− Hide manual Greeks (paste from broker)',
    valuesAre: 'Values are',
    perContract: 'per-contract (IBKR ×100)',
    perShare: 'per-share',
    vegaOptional: 'Vega (optional)',
    vegaInfo: 'How much the option price changes for a +1 percentage point change in IV.',
    manualGreeksHint:
      "These values only replace the Greeks panel display (to match your broker exactly). The probability of profit and P&L table still derive from the IV you entered above.",

    calculate: 'Calculate',

    notReadyHint:
      'Fill in price, strike, premium, days to expiry and IV last. Everything else is optional — HV and IV Rank improve the estimate, target price gives a reward:risk. The analyzer uses no internet — pure math on your numbers.',
    readyNotSubmittedHint: 'Press "Calculate" to see P&L, chance of success and a verdict.',

    modelRead: 'Model read',
    chanceOfProfit: 'chance of profit\nat expiration',

    move: 'Move',
    moveToBE: 'Move to B/E',
    maxLoss: 'Max loss',
    maxProfit: 'Max profit',
    unlimited: 'Unlimited',
    pFinishItm: 'P(finish ITM)',
    exp1Sigma: 'Exp. 1σ range',

    greeksNow: 'Greeks (now)',
    vega1pct: 'Vega /1%',
    totalCost: 'Total cost',

    payoffAtExpiration: 'at expiration',
    payoffHeld: '{held}d held, {left}d left',
    today: 'today',
    expiration: 'expiration',

    pnlHeading: 'P&L at expiration by stock move',
    stockPrice: 'Stock price',
    pnlPerContract: 'P&L /contract',
    pnlTotal: 'P&L total ({qty})',

    analyzerFoot:
      '<b>How the verdict works.</b> The "chance of profit" is the probability the stock finishes past your breakeven, modeled as a lognormal distribution using your IV as the volatility and a {drift} drift — it is a model assumption, not a forecast. The badge sums the factors above, capped to "Expensive" when IV is rich versus HV or IV Rank is very high. Greeks are Black-Scholes unless you supplied your own above. This is an analysis tool, <b>not financial advice</b>.',
    driftZeroWord: 'zero',
    driftRfWord: 'risk-free',
    driftCustomWord: 'custom',

    // ---- lib/analysis.js verdict/factor strings ----
    factorIvHv: 'Volatility value (IV/HV)',
    factorIvHvCheap: 'IV is cheap vs the stock’s realized vol — good for a buyer.',
    factorIvHvNeutral: 'IV is roughly in line with realized vol.',
    factorIvHvRich: 'IV is rich vs realized vol — you’re overpaying for movement.',
    factorIvRank: '52w IV Rank',
    factorIvRankLow: 'IV sits in the low end of its 52-week range — comparatively cheap.',
    factorIvRankMid: 'IV sits near the middle of its 52-week range.',
    factorIvRankHigh: 'IV sits in the high end of its 52-week range — comparatively expensive.',
    factorPop: 'Probability of profit',
    factorPopNote: 'Model chance of finishing past breakeven ({drift}% drift, IV vol).',
    factorBreakeven: 'Move needed to breakeven',
    factorBreakevenNote: 'Breakeven sits at {ratio}× the expected 1σ move ({expected}%).',
    factorRewardRisk: 'Reward : risk at target',
    factorRewardRiskLoss: 'loss at target',
    factorRewardRiskNote: 'Profit at ${target} is {sign}${profit} vs max loss ${maxLoss}.',
    factorTheta: 'Time decay (theta)',
    factorThetaNote: 'Daily theta as a share of the premium you paid.',

    badgeExpensive: 'Expensive',
    badgeExpensiveSummary:
      'You’re paying a rich implied vol relative to how the stock actually moves. Even a correct direction call can lose if IV reverts. Hard to justify as a buy.',
    badgeLongShot: 'Long-shot',
    badgeLongShotSummary:
      'Cheap volatility alone doesn’t offset this: the model gives the stock a low chance of reaching your breakeven by expiration. Cheap vol makes a bad bet cheaper, not a good one.',
    badgeReasonable: 'Reasonable buy',
    badgeReasonableSummary:
      'On these inputs the trade screens well: the volatility isn’t overpriced, the breakeven is reachable, and the odds/payoff are acceptable. Still a probabilistic bet, not a sure thing.',
    badgeMarginal: 'Marginal',
    badgeMarginalSummary:
      'Mixed. Some factors are fine, others are stretched. Tighten the entry (lower premium / different strike or expiry) or wait for cheaper vol before committing.',
    badgePoor: 'Poor',
    badgePoorSummary:
      'The factors line up against the buyer here — the move needed, the cost, or the odds are working against you. Look for a better structure.',

    // ---- payoff chart ----
    spotLabel: 'spot {price}',
    beLabel: 'B/E {price}',

    // ---- insiders tab ----
    tabInsiders: 'Insiders',
    tabInsidersSub: 'cluster buys → entry horizon',
    insidersHint:
      'Enter a US ticker. The tab pulls the company\'s <b>SEC Form 4 filings</b> (official, free EDGAR data), looks for <b>cluster buys</b> — several insiders buying with their own money within days — and then compares four entry horizons (7d, 50–60d, ~90d, 3+ months) against the live option chain to recommend where the odds stack up best.',
    clusterEyebrow: 'Insider signal · last {window} days',
    clusterStrong: 'Strong cluster buy',
    clusterModerate: 'Moderate buying',
    clusterWeak: 'Weak / mixed',
    clusterNone: 'No open-market buys',
    clusterStrongSummary:
      'Multiple insiders (or a large executive purchase) bought on the open market recently. Historically the strongest insider signal — the edge tends to play out over the following 1–6 months.',
    clusterModerateSummary:
      'Some genuine open-market buying, but not a broad cluster. A supportive signal, not a table-pounding one.',
    clusterWeakSummary:
      'Only token buying, or buying drowned out by sales. Treat as noise.',
    clusterNoneSummary:
      'No insider bought stock on the open market in this window. Awards and grants don\'t count — only purchases with their own money do.',
    clusterNetSelling: 'Caution: insider sales heavily outweigh purchases in this window.',
    statBuyers: 'Distinct buyers',
    statBuys: 'Open-market buys',
    statBuyValue: 'Bought',
    statSells: 'Sales',
    statSellValue: 'Sold',
    txHeading: 'Form 4 buys & sales — last {days} days',
    txDate: 'Date',
    txInsider: 'Insider',
    txRole: 'Role',
    txType: 'Type',
    txShares: 'Shares',
    txPrice: 'Price',
    txValue: 'Value',
    txBuy: 'Buy',
    txSell: 'Sell',
    roleDirector: 'Director',
    roleTenPct: '10% owner',
    roleInsider: 'Insider',
    noTransactions: 'No open-market insider buys or sales filed in this window.',
    periodsHeading: 'Entry horizon — where do the odds stack up best?',
    periodP7: '7 days',
    periodP50: '50–60 days',
    periodP90: '~90 days',
    periodP3m: '3+ months',
    periodDte: 'DTE {min}–{max}',
    periodRecommended: 'Recommended',
    periodScore: 'combined score',
    periodNoContracts: 'No liquid contracts with a reliable IV in this DTE range right now.',
    periodBestContract: 'Best contract here: {pop}% chance of profit, IV/HV {ivHv}.',
    periodThetaNote: 'Time decay costs ~{pct}% of the premium per day.',
    periodInsiderAlign:
      'Insider cluster buys typically play out over 1–6 months — this horizon captures that edge.',
    periodInsiderTooShort: 'Expires before an insider-buy thesis typically plays out.',
    periodLotteryWarn:
      'Biggest % swings live here, but decay is fastest and most buyers lose — a lottery ticket, not a systematic entry.',
    periodExitRule: 'Plan the exit before the final 30 days, when decay accelerates sharply.',
    bestInPeriod: 'Best contract in this horizon',
    openInScreener: 'Open {ticker} in the Screener →',
    insidersFoot:
      '<b>How to read it.</b> Data is official SEC EDGAR Form 4 (insider trades must be filed within 2 business days). Only open-market purchases (code P) and sales (code S) are shown — awards, grants and option exercises are excluded. The horizon comparison combines each bucket\'s best contract verdict, its chance of profit, daily theta drag, and how well the horizon matches the 1–6 month window over which insider-buy signals historically resolve. 13F institutional holdings are quarterly with a 45-day lag and are deliberately not used for "recent days" signals. This is an analysis tool, <b>not financial advice</b>.',

    // ---- favorites tab ----
    tabFavorites: 'Favorites',
    tabFavoritesSub: 'saved tickers & option alerts',
    favTickers: 'Tickers',
    favOptions: 'Options',
    favEmptyTickers:
      'No saved tickers yet. Star a ticker from the Screener or Insiders tab to pin it here for one-click scanning.',
    favEmptyOptions:
      'No saved options yet. Star any contract row in the Screener to track it here and set a target buy price for alerts.',
    favTickerScan: 'Scan',
    favRemove: 'Remove',
    favAdded: 'Added at',
    favCurrent: 'Current',
    favTarget: 'Target buy price',
    favTargetPlaceholder: 'e.g. 3.50',
    favLastChecked: 'Checked {time}',
    favNeverChecked: 'not checked yet',
    favAlertHit: 'Below target — good to buy',
    favAlertWatching: 'Watching',
    favAlertNoTarget: 'Set a target to arm the alert',
    favNotifyOn: '🔔 Notifications on',
    favNotifyEnable: '🔕 Enable price notifications',
    favNotifyBlocked:
      'Notifications are blocked in your browser settings — the visual badge below still works. Re-enable them for this site to get pop-ups.',
    favCheckNow: 'Check prices now',
    favChecking: 'Checking…',
    favNotifyHint:
      'Alerts run while this tab is open in your browser. Prices are re-checked every couple of minutes (and on "Check prices now"); when a saved option trades at or below your target buy price you get a browser notification and the badge below turns green.',
    favContract: '{type} {strike} · {expiry}',
    favColContract: 'Contract',
    favColAdded: 'Added',
    favColCurrent: 'Current',
    favColTarget: 'Target',
    favColStatus: 'Status',
    favColActions: '',
  },

  bg: {
    tagline: 'Купувай опции, когато волатилността им е евтина — не когато акцията изглежда вълнуваща.',
    tabScreener: 'Скенер',
    tabScreenerSub: 'сканирай целия option chain на тикър',
    tabAnalyzer: 'Анализатор на сделки',
    tabAnalyzerSub: 'въведи една опция, получи оценка',

    tickerLabel: 'US тикър',
    riskFreeLabel: 'Безрисков %',
    riskFreeInfo:
      'Безрисков лихвен процент (напр. доходност на US Treasury). Използва се в модела за цена на опциите. Малко влияние — обикновено не се пипа, ~4-4.5%.',
    commissionLabel: 'Комисиона /контракт',
    commissionInfo:
      'Таксата, която твоят брокер взима за 1 контракт (не bid/ask цена). Влиза в сметката за breakeven.',
    analyze: 'Анализирай',
    loading: 'Зареждане…',

    screenerHint:
      'Въведи символ на US акция. Скенерът тегли текущия option chain, смята Black-Scholes Greeks и подрежда контрактите по <b>IV/HV</b> — implied volatility, разделена на реализираната волатилност на акцията. Ниско съотношение означава, че опцията залага на по-малко движение, отколкото акцията реално е показвала — т.е. сравнително евтина за купуване.',
    noReliableIv:
      'В момента няма контракти с надежден IV. Безплатният поток на Yahoo понякога връща плейсхолдър стойности за волатилност, които не може честно да изчисли — те се филтрират, вместо да се показват като фалшиви Greeks. Опитай отново след малко или с друг тикър.',

    price: 'Цена',
    atmIv: 'ATM IV',
    hv20: 'HV 20д',
    hv30: 'HV 30д',
    hvBand: 'HV 52седм. диапазон',

    cheapestVol: 'Най-евтина волатилност',
    selectedContract: 'Избран контракт',
    bestCall: 'НАЙ-ДОБЪР CALL',
    bestPut: 'НАЙ-ДОБЪР PUT',
    call: 'CALL',
    put: 'PUT',
    ivHvLabel: 'IV / HV',
    gaugeNoRange: 'Няма наличен 52-седмичен HV диапазон.',
    gaugeCaption:
      'Маркер = IV на тази опция спрямо 52-седмичния реализиран vol диапазон на акцията. Ляво е евтино.',
    strike: 'Strike',
    expiryDte: 'Падеж · DTE',
    ivLast: 'IV last',
    premium: 'Премия',
    delta: 'Delta',
    gamma: 'Gamma',
    thetaDay: 'Theta /ден',
    breakeven: 'Breakeven',

    liquidContracts: '{n} ликвидни контракта',
    all: 'Всички',
    calls: 'Calls',
    puts: 'Puts',
    expiry: 'Падеж',
    allDates: 'Всички дати',
    minStrike: 'Мин. strike',
    maxStrike: 'Макс. strike',
    minVolume: 'Мин. обем',
    colType: 'Тип',
    colStrike: 'Strike',
    colExpiry: 'Падеж',
    colDte: 'DTE',
    colIv: 'IV',
    colIvHv: 'IV/HV',
    colDelta: 'Delta',
    colGamma: 'Gamma',
    colTheta: 'Theta',
    colPremium: 'Премия',
    colBE: 'B/E',
    colVol: 'Обем',
    colOI: 'OI',
    colChance: 'Шанс',
    colDeal: 'Сделка',
    sortBy: 'Подреди по',
    bestChance: 'Най-добър шанс',
    bestDeal: 'Най-добра сделка',

    screenerFoot:
      '<b>Как се чете.</b> IV/HV под ~0.8 (зелено) = опцията залага на по-малко движение, отколкото акцията реално е показвала напоследно — сравнително евтино за купувач. Над ~1.4 (червено) = скъпо. Greeks са Black-Scholes оценки; HV е реализирана волатилност — безплатен заместител на истинската историческа implied volatility. Данните са забавени и неофициални (Yahoo Finance). Това е аналитичен инструмент, <b>не финансов съвет</b>.',

    // ---- selected contract mini-analysis ----
    overallRec: 'Обща препоръка',
    popInline: '{pop}% шанс за печалба',
    goodReasons: 'Защо е добър избор',
    badReasons: 'Защо е лош избор',

    call_: 'Call',
    put_: 'Put',
    underlyingPrice: 'Цена на акцията',
    strikeField: 'Strike',
    premiumShare: 'Премия / акция',
    premiumShareInfo:
      'Last / mid цена на опцията за 1 акция (не за целия контракт). IBKR я показва като Last, Bid или Ask.',
    daysToExpiry: 'Дни до падеж',
    ivLastPct: 'IV last %',
    ivLastInfo: 'Implied Volatility на конкретния контракт точно както е показана в IBKR (IV last).',
    ivHistVol: 'IV Hist Vol % (по избор)',
    ivHistVolInfo:
      'Историческата (реализирана) волатилност на акцията, както я показва IBKR (IV Hist Vol). Използва се за сравнение IV/HV.',
    ivRank: '52-седм. IV Rank (по избор)',
    ivRankInfo:
      'Процентил 0-100: къде е текущото IV спрямо диапазона си за последните 52 седмици. IBKR го показва директно.',
    targetPrice: 'Целева цена (по избор)',
    targetPriceInfo:
      'Цена, до която очакваш акцията да стигне — използва се за reward:risk сметката.',
    contracts: 'Контракти',
    riskFreeInfoAnalyzer:
      'Безрисков лихвен процент (напр. доходност на US Treasury). Влиза в модела за цена на опции. Малко влияние — обикновено се оставя ~4-4.5%.',
    commissionInfoAnalyzer:
      'Таксата на брокера ти за 1 контракт — не bid/ask цена. Влиза в breakeven сметката.',
    driftAssumption: 'Допускане за drift',
    driftInfo:
      "Каква средногодишна доходност приемаш за акцията при смятане на шанса за успех. 'Risk-free' е неутрално моделно допускане, не прогноза.",
    driftRf: 'Risk-free',
    driftZero: 'Нула (консервативно)',
    driftCustom: 'Custom %',
    expectedAnnual: 'Очаквана годишна %',

    addManualGreeks: '+ Добави ръчни Greeks (от брокера)',
    hideManualGreeks: '− Скрий ръчните Greeks (от брокера)',
    valuesAre: 'Стойностите са',
    perContract: 'за контракт (IBKR ×100)',
    perShare: 'за акция',
    vegaOptional: 'Vega (по избор)',
    vegaInfo: 'С колко се променя цената на опцията при промяна на IV с 1 процентен пункт.',
    manualGreeksHint:
      'Тези стойности само заменят Greeks панела за показване (за да съвпада точно с брокера ти). Шансът за успех и P&L таблицата продължават да се смятат от IV, което си въвел горе.',

    calculate: 'Изчисли — оцени сделката',

    notReadyHint:
      'Попълни цена, strike, премия, дни до падеж и IV last. Всичко останало е по желание — HV и IV Rank подобряват оценката, target price дава reward:risk. Анализаторът не ползва интернет — чиста математика върху твоите числа.',
    readyNotSubmittedHint: 'Натисни „Изчисли", за да видиш P&L, шанс за успех и оценка.',

    modelRead: 'Моделна оценка',
    chanceOfProfit: 'шанс за печалба\nна падежа',

    move: 'Движение',
    moveToBE: 'Движение до B/E',
    maxLoss: 'Макс. загуба',
    maxProfit: 'Макс. печалба',
    unlimited: 'Неограничена',
    pFinishItm: 'P(завършва ITM)',
    exp1Sigma: 'Очакван 1σ диапазон',

    greeksNow: 'Greeks (сега)',
    vega1pct: 'Vega /1%',
    totalCost: 'Обща цена',

    payoffAtExpiration: 'на падежа',
    payoffHeld: '{held}д държани, {left}д остават',
    today: 'днес',
    expiration: 'падеж',

    pnlHeading: 'P&L на падежа по движение на акцията',
    stockPrice: 'Цена на акцията',
    pnlPerContract: 'P&L /контракт',
    pnlTotal: 'P&L общо ({qty})',

    analyzerFoot:
      '<b>Как работи оценката.</b> „Шансът за печалба" е вероятността акцията да завърши над breakeven, моделирана като лог-нормално разпределение с твоето IV като волатилност и {drift} drift — това е моделно допускане, не прогноза. Значката сумира факторите по-горе, ограничена до „Скъпо", когато IV е скъпо спрямо HV или IV Rank е много висок. Greeks са Black-Scholes, освен ако не си въвел свои по-горе. Това е аналитичен инструмент, <b>не финансов съвет</b>.',
    driftZeroWord: 'нулев',
    driftRfWord: 'risk-free',
    driftCustomWord: 'custom',

    factorIvHv: 'Стойност на волатилността (IV/HV)',
    factorIvHvCheap: 'IV е евтино спрямо реализираната волатилност на акцията — добре за купувач.',
    factorIvHvNeutral: 'IV е горе-долу в синхрон с реализираната волатилност.',
    factorIvHvRich: 'IV е скъпо спрямо реализираната волатилност — плащаш повече за движение.',
    factorIvRank: '52-седм. IV Rank',
    factorIvRankLow: 'IV е в ниския край на 52-седмичния си диапазон — сравнително евтино.',
    factorIvRankMid: 'IV е около средата на 52-седмичния си диапазон.',
    factorIvRankHigh: 'IV е във високия край на 52-седмичния си диапазон — сравнително скъпо.',
    factorPop: 'Вероятност за печалба',
    factorPopNote: 'Моделен шанс да завърши над breakeven ({drift}% drift, IV vol).',
    factorBreakeven: 'Движение нужно до breakeven',
    factorBreakevenNote: 'Breakeven е на {ratio}× очакваното 1σ движение ({expected}%).',
    factorRewardRisk: 'Reward : risk при целта',
    factorRewardRiskLoss: 'загуба при целта',
    factorRewardRiskNote: 'Печалбата при ${target} е {sign}${profit} срещу макс. загуба ${maxLoss}.',
    factorTheta: 'Времеви разпад (theta)',
    factorThetaNote: 'Дневна theta като дял от платената премия.',

    badgeExpensive: 'Скъпо',
    badgeExpensiveSummary:
      'Плащаш скъпо implied vol спрямо реалното движение на акцията. Дори правилна посока може да донесе загуба, ако IV се върне надолу. Трудно оправдаваема покупка.',
    badgeLongShot: 'Дълъг изстрел',
    badgeLongShotSummary:
      'Само евтината волатилност не компенсира това: моделът дава нисък шанс акцията да стигне breakeven до падежа. Евтиното vol прави лошия залог по-евтин, не по-добър.',
    badgeReasonable: 'Разумна покупка',
    badgeReasonableSummary:
      'При тези входни данни сделката изглежда добре: волатилността не е надценена, breakeven е достижим, а шансовете/изплащането са приемливи. Все пак е вероятностен залог, не сигурна печалба.',
    badgeMarginal: 'Гранична',
    badgeMarginalSummary:
      'Смесено. Някои фактори са наред, други са опънати. Стегни входа (по-ниска премия / друг strike или падеж) или изчакай по-евтино vol.',
    badgePoor: 'Слаба',
    badgePoorSummary:
      'Факторите са срещу купувача тук — нужното движение, цената или шансовете работят против теб. Търси по-добра структура.',

    spotLabel: 'spot {price}',
    beLabel: 'B/E {price}',

    // ---- insiders tab ----
    tabInsiders: 'Инсайдъри',
    tabInsidersSub: 'клъстерни покупки → хоризонт за вход',
    insidersHint:
      'Въведи US тикър. Табът тегли <b>SEC Form 4 декларациите</b> на компанията (официални, безплатни данни от EDGAR), търси <b>клъстерни покупки</b> — няколко инсайдъри купуват със собствени пари в рамките на дни — и после сравнява четири хоризонта за вход (7д, 50–60д, ~90д, 3+ месеца) спрямо живия option chain, за да препоръча къде шансовете са най-добри.',
    clusterEyebrow: 'Инсайдър сигнал · последните {window} дни',
    clusterStrong: 'Силна клъстерна покупка',
    clusterModerate: 'Умерено купуване',
    clusterWeak: 'Слабо / смесено',
    clusterNone: 'Няма покупки на пазара',
    clusterStrongSummary:
      'Няколко инсайдъри (или голяма покупка от изпълнителен директор) са купували на открития пазар наскоро. Исторически най-силният инсайдър сигнал — предимството обикновено се разгръща през следващите 1–6 месеца.',
    clusterModerateSummary:
      'Има истинско купуване на пазара, но не е широк клъстер. Подкрепящ сигнал, не категоричен.',
    clusterWeakSummary:
      'Само символично купуване, или купуване, удавено от продажби. Третирай като шум.',
    clusterNoneSummary:
      'Никой инсайдър не е купувал акции на открития пазар в този прозорец. Наградите и грантовете не се броят — само покупки със собствени пари.',
    clusterNetSelling: 'Внимание: продажбите на инсайдъри значително надвишават покупките в този прозорец.',
    statBuyers: 'Отделни купувачи',
    statBuys: 'Покупки на пазара',
    statBuyValue: 'Купено за',
    statSells: 'Продажби',
    statSellValue: 'Продадено за',
    txHeading: 'Form 4 покупки и продажби — последните {days} дни',
    txDate: 'Дата',
    txInsider: 'Инсайдър',
    txRole: 'Роля',
    txType: 'Тип',
    txShares: 'Акции',
    txPrice: 'Цена',
    txValue: 'Стойност',
    txBuy: 'Покупка',
    txSell: 'Продажба',
    roleDirector: 'Директор',
    roleTenPct: '10% акционер',
    roleInsider: 'Инсайдър',
    noTransactions: 'Няма декларирани покупки/продажби на открития пазар в този прозорец.',
    periodsHeading: 'Хоризонт за вход — къде шансовете са най-добри?',
    periodP7: '7 дни',
    periodP50: '50–60 дни',
    periodP90: '~90 дни',
    periodP3m: '3+ месеца',
    periodDte: 'DTE {min}–{max}',
    periodRecommended: 'Препоръчан',
    periodScore: 'комбиниран резултат',
    periodNoContracts: 'В момента няма ликвидни контракти с надежден IV в този DTE диапазон.',
    periodBestContract: 'Най-добър контракт тук: {pop}% шанс за печалба, IV/HV {ivHv}.',
    periodThetaNote: 'Времевият разпад струва ~{pct}% от премията на ден.',
    periodInsiderAlign:
      'Клъстерните инсайдър покупки обикновено се разгръщат за 1–6 месеца — този хоризонт улавя предимството.',
    periodInsiderTooShort: 'Изтича преди инсайдър тезата обикновено да се разгърне.',
    periodLotteryWarn:
      'Тук са най-големите % движения, но разпадът е най-бърз и повечето купувачи губят — лотариен билет, не системен вход.',
    periodExitRule: 'Планирай изхода преди последните 30 дни, когато разпадът рязко се ускорява.',
    bestInPeriod: 'Най-добър контракт в този хоризонт',
    openInScreener: 'Отвори {ticker} в Скенера →',
    insidersFoot:
      '<b>Как се чете.</b> Данните са официални SEC EDGAR Form 4 (инсайдър сделките се декларират до 2 работни дни). Показват се само покупки на открития пазар (код P) и продажби (код S) — награди, грантове и упражняване на опции са изключени. Сравнението на хоризонтите комбинира оценката на най-добрия контракт във всеки диапазон, шанса му за печалба, дневния theta разход и доколко хоризонтът съвпада с прозореца от 1–6 месеца, в който инсайдър сигналите исторически се реализират. 13F институционалните позиции са тримесечни с 45 дни закъснение и нарочно не се ползват за сигнали „от последните дни". Това е аналитичен инструмент, <b>не финансов съвет</b>.',

    // ---- favorites tab ----
    tabFavorites: 'Любими',
    tabFavoritesSub: 'запазени тикъри и ценови аларми',
    favTickers: 'Тикъри',
    favOptions: 'Опции',
    favEmptyTickers:
      'Още няма запазени тикъри. Отбележи тикър със звезда от Скенера или Инсайдъри, за да го закачиш тук за сканиране с едно кликване.',
    favEmptyOptions:
      'Още няма запазени опции. Отбележи със звезда контракт в Скенера, за да го следиш тук и да зададеш целева цена за покупка с аларма.',
    favTickerScan: 'Сканирай',
    favRemove: 'Премахни',
    favAdded: 'Добавен на',
    favCurrent: 'Текуща',
    favTarget: 'Целева цена за покупка',
    favTargetPlaceholder: 'напр. 3.50',
    favLastChecked: 'Проверено {time}',
    favNeverChecked: 'още непроверено',
    favAlertHit: 'Под целта — добре за покупка',
    favAlertWatching: 'Следи се',
    favAlertNoTarget: 'Задай цел, за да активираш алармата',
    favNotifyOn: '🔔 Нотификациите са включени',
    favNotifyEnable: '🔕 Включи ценови нотификации',
    favNotifyBlocked:
      'Нотификациите са блокирани в настройките на браузъра ти — визуалният знак долу пак работи. Разреши ги за този сайт, за да получаваш изскачащи известия.',
    favCheckNow: 'Провери цените сега',
    favChecking: 'Проверявам…',
    favNotifyHint:
      'Алармите работят, докато този таб е отворен в браузъра ти. Цените се проверяват на всеки няколко минути (и при „Провери цените сега"); когато запазена опция се търгува на или под целевата ти цена, получаваш браузър нотификация и знакът долу става зелен.',
    favContract: '{type} {strike} · {expiry}',
    favColContract: 'Контракт',
    favColAdded: 'Добавена',
    favColCurrent: 'Текуща',
    favColTarget: 'Цел',
    favColStatus: 'Статус',
    favColActions: '',
  },
};

export function t(lang, key, vars) {
  const str = dict[lang]?.[key] ?? dict.en[key] ?? key;
  if (!vars) return str;
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, v),
    str
  );
}
