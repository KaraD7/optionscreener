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
