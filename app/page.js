'use client';

import { useState } from 'react';
import Screener from './components/Screener';
import Analyzer from './components/Analyzer';
import Insiders from './components/Insiders';
import Favorites from './components/Favorites';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { FavoritesProvider, useFavorites } from './components/FavoritesContext';
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
  // Set from a tab's "Open in Screener" cross-link; seq forces the effect to
  // re-fire even for the same ticker.
  const [preset, setPreset] = useState(null);
  const { t } = useLanguage();
  const { alertCount } = useFavorites();

  const openInScreener = (ticker) => {
    setPreset({ ticker, seq: Date.now() });
    setTab('screener');
  };

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
        <button className={tab === 'favorites' ? 'on' : ''} onClick={() => setTab('favorites')}>
          {t('tabFavorites')}
          {alertCount > 0 && <span className="tabbadge">{alertCount}</span>}
          <span>{t('tabFavoritesSub')}</span>
        </button>
      </div>

      {tab === 'screener' ? (
        <Screener preset={preset} />
      ) : tab === 'analyzer' ? (
        <Analyzer />
      ) : tab === 'insiders' ? (
        <Insiders onOpenInScreener={openInScreener} />
      ) : (
        <Favorites onOpenInScreener={openInScreener} />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <LanguageProvider>
      <FavoritesProvider>
        <AppBody />
      </FavoritesProvider>
    </LanguageProvider>
  );
}
