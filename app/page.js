'use client';

import { useState } from 'react';
import Screener from './components/Screener';
import Analyzer from './components/Analyzer';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import pkg from '../package.json';

function LangSwitcher() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="langswitch">
      <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
      <button className={lang === 'bg' ? 'on' : ''} onClick={() => setLang('bg')}>BG</button>
    </div>
  );
}

function AppBody() {
  const [tab, setTab] = useState('screener');
  const { t } = useLanguage();
  return (
    <div className="wrap">
      <div className="mast">
        <div className="mark">IV<b>/</b>HV<span className="ver">v{pkg.version}</span></div>
        <div className="tagline">{t('tagline')}</div>
        <LangSwitcher />
      </div>

      <div className="tabs">
        <button className={tab === 'screener' ? 'on' : ''} onClick={() => setTab('screener')}>
          {t('tabScreener')}
          <span>{t('tabScreenerSub')}</span>
        </button>
        <button className={tab === 'analyzer' ? 'on' : ''} onClick={() => setTab('analyzer')}>
          {t('tabAnalyzer')}
          <span>{t('tabAnalyzerSub')}</span>
        </button>
      </div>

      {tab === 'screener' ? <Screener /> : <Analyzer />}
    </div>
  );
}

export default function Page() {
  return (
    <LanguageProvider>
      <AppBody />
    </LanguageProvider>
  );
}
