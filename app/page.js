'use client';

import { useState } from 'react';
import Screener from './components/Screener';
import Analyzer from './components/Analyzer';
import Insiders from './components/Insiders';
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
  // Set from the Insiders tab's "Open in Screener" cross-link; seq forces the
  // effect to re-fire even for the same ticker.
  const [preset, setPreset] = useState(null);
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
        <button className={tab === 'insiders' ? 'on' : ''} onClick={() => setTab('insiders')}>
          {t('tabInsiders')}
          <span>{t('tabInsidersSub')}</span>
        </button>
      </div>

      {tab === 'screener' ? (
        <Screener preset={preset} />
      ) : tab === 'analyzer' ? (
        <Analyzer />
      ) : (
        <Insiders
          onOpenInScreener={(ticker) => {
            setPreset({ ticker, seq: Date.now() });
            setTab('screener');
          }}
        />
      )}
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
