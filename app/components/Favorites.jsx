'use client';

import { useState } from 'react';
import { money, dateStr } from '../../lib/format';
import { useLanguage } from './LanguageContext';
import { useFavorites } from './FavoritesContext';

function timeStr(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function OptionRow({ o, t, onScan }) {
  const { removeOption, setTarget } = useFavorites();
  const below = o.targetPrice != null && o.lastPrice != null && o.lastPrice <= o.targetPrice;
  const status =
    o.targetPrice == null
      ? { cls: 'muted', text: t('favAlertNoTarget') }
      : below
      ? { cls: 'hit', text: t('favAlertHit') }
      : { cls: 'watch', text: t('favAlertWatching') };
  return (
    <div className={`favopt ${below ? 'below' : ''}`}>
      <div className="favopt-main">
        <span className={`tag ${o.type}`}>{o.type === 'call' ? 'C' : 'P'}</span>
        <button className="favlink" onClick={() => onScan(o.ticker)}>{o.ticker}</button>
        <span className="favcontract">
          {t('favContract', {
            type: o.type === 'call' ? t('call') : t('put'),
            strike: money(o.strike),
            expiry: dateStr(o.expiration),
          })}
        </span>
      </div>
      <div className="favopt-grid">
        <div className="cell"><div className="k">{t('favAdded')}</div><div className="v">{money(o.addedPremium)}</div></div>
        <div className="cell"><div className="k">{t('favCurrent')}</div><div className="v" style={{ color: below ? 'var(--cheap)' : 'var(--text)' }}>{money(o.lastPrice)}</div></div>
        <div className="cell target">
          <div className="k">{t('favTarget')}</div>
          <input
            inputMode="decimal"
            placeholder={t('favTargetPlaceholder')}
            defaultValue={o.targetPrice ?? ''}
            onBlur={(e) => setTarget(o.id, e.target.value.trim())}
            onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
          />
        </div>
      </div>
      <div className="favopt-foot">
        <span className={`favstatus ${status.cls}`}>{status.text}</span>
        <span className="favchecked">
          {o.lastChecked ? t('favLastChecked', { time: timeStr(o.lastChecked) }) : t('favNeverChecked')}
        </span>
        <button className="favx" onClick={() => removeOption(o)} aria-label={t('favRemove')}>×</button>
      </div>
    </div>
  );
}

export default function Favorites({ onOpenInScreener }) {
  const { t } = useLanguage();
  const {
    tickers,
    options,
    removeTicker,
    notifyEnabled,
    enableNotifications,
    checkNow,
    checking,
  } = useFavorites();
  const [sub, setSub] = useState('tickers');
  const [notifyBlocked, setNotifyBlocked] = useState(false);

  const scan = (tk) => onOpenInScreener && onOpenInScreener(tk);

  async function onEnableNotifications() {
    const ok = await enableNotifications();
    setNotifyBlocked(!ok);
  }

  return (
    <>
      <div className="tablehead">
        <div className="filters" style={{ marginLeft: 0 }}>
          <button className={sub === 'tickers' ? 'on' : ''} onClick={() => setSub('tickers')}>
            {t('favTickers')} ({tickers.length})
          </button>
          <button className={sub === 'options' ? 'on' : ''} onClick={() => setSub('options')}>
            {t('favOptions')} ({options.length})
          </button>
        </div>
        <div className="filters">
          <button className={notifyEnabled ? 'on' : ''} onClick={onEnableNotifications}>
            {notifyEnabled ? t('favNotifyOn') : t('favNotifyEnable')}
          </button>
          {options.some((o) => o.targetPrice != null) && (
            <button onClick={checkNow} disabled={checking}>
              {checking ? t('favChecking') : t('favCheckNow')}
            </button>
          )}
        </div>
      </div>

      {notifyBlocked && <div className="msg err">{t('favNotifyBlocked')}</div>}

      {sub === 'tickers' ? (
        tickers.length === 0 ? (
          <div className="hint">{t('favEmptyTickers')}</div>
        ) : (
          <div className="favtickers">
            {tickers.map((tk) => (
              <div key={tk} className="favchip">
                <span className="favsym">{tk}</span>
                <button className="favscan" onClick={() => scan(tk)}>{t('favTickerScan')}</button>
                <button className="favx" onClick={() => removeTicker(tk)} aria-label={t('favRemove')}>×</button>
              </div>
            ))}
          </div>
        )
      ) : options.length === 0 ? (
        <div className="hint">{t('favEmptyOptions')}</div>
      ) : (
        <>
          <div className="favlist">
            {options.map((o) => (
              <OptionRow key={o.id} o={o} t={t} onScan={scan} />
            ))}
          </div>
          <div className="foot">{t('favNotifyHint')}</div>
        </>
      )}
    </>
  );
}
