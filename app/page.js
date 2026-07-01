'use client';

import { useState } from 'react';
import Screener from './components/Screener';
import Analyzer from './components/Analyzer';

export default function Page() {
  const [tab, setTab] = useState('screener');
  return (
    <div className="wrap">
      <div className="mast">
        <div className="mark">IV<b>/</b>HV</div>
        <div className="tagline">Buy options when their volatility is cheap — not when the stock looks exciting.</div>
      </div>

      <div className="tabs">
        <button className={tab === 'screener' ? 'on' : ''} onClick={() => setTab('screener')}>
          Screener
          <span>scan a US ticker’s whole chain</span>
        </button>
        <button className={tab === 'analyzer' ? 'on' : ''} onClick={() => setTab('analyzer')}>
          Trade analyzer
          <span>enter one option, get the verdict</span>
        </button>
      </div>

      {tab === 'screener' ? <Screener /> : <Analyzer />}
    </div>
  );
}
