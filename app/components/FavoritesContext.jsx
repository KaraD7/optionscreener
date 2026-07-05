'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

const FavoritesContext = createContext(null);

const STORAGE_KEY = 'favorites.v1';
const POLL_MS = 120_000; // Yahoo data is delayed; polling faster is pointless.

// Stable identity for a contract across chain refreshes.
export function optionId(o) {
  return o.contractSymbol || `${o.ticker}|${o.type}|${o.strike}|${o.expiration}`;
}

function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { tickers: [], options: [] };
    const parsed = JSON.parse(raw);
    return {
      tickers: Array.isArray(parsed.tickers) ? parsed.tickers : [],
      options: Array.isArray(parsed.options) ? parsed.options : [],
    };
  } catch {
    return { tickers: [], options: [] };
  }
}

export function FavoritesProvider({ children }) {
  const [tickers, setTickers] = useState([]);
  const [options, setOptions] = useState([]);
  const [notifyEnabled, setNotifyEnabled] = useState(false);
  const [checking, setChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount (client only, avoids SSR mismatch).
  useEffect(() => {
    const s = loadState();
    setTickers(s.tickers);
    setOptions(s.options);
    if (
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
    ) {
      setNotifyEnabled(true);
    }
    setHydrated(true);
  }, []);

  // Persist whenever favorites change (after hydration, so we don't clobber
  // saved state with the initial empty arrays).
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ tickers, options }));
  }, [tickers, options, hydrated]);

  // ---- tickers ----
  const isTickerFav = useCallback((tk) => tickers.includes(tk), [tickers]);
  const toggleTicker = useCallback((tk) => {
    const sym = String(tk || '').trim().toUpperCase();
    if (!sym) return;
    setTickers((cur) =>
      cur.includes(sym) ? cur.filter((x) => x !== sym) : [...cur, sym]
    );
  }, []);
  const removeTicker = useCallback((tk) => {
    setTickers((cur) => cur.filter((x) => x !== tk));
  }, []);

  // ---- option contracts ----
  const favOptionIds = useRef(new Set());
  favOptionIds.current = new Set(options.map(optionId));
  const isOptionFav = useCallback(
    (o) => favOptionIds.current.has(optionId(o)),
    [options]
  );

  const addOption = useCallback((o) => {
    const id = optionId(o);
    setOptions((cur) => {
      if (cur.some((x) => optionId(x) === id)) return cur;
      return [
        ...cur,
        {
          id,
          ticker: o.ticker,
          type: o.type,
          strike: o.strike,
          expiration: o.expiration,
          contractSymbol: o.contractSymbol || null,
          addedPremium: o.premium ?? null,
          lastPrice: o.premium ?? null,
          targetPrice: null,
          alertFired: false,
          lastChecked: null,
        },
      ];
    });
  }, []);

  const removeOption = useCallback((o) => {
    const id = optionId(o);
    setOptions((cur) => cur.filter((x) => x.id !== id));
  }, []);

  const toggleOption = useCallback(
    (o) => {
      if (favOptionIds.current.has(optionId(o))) removeOption(o);
      else addOption(o);
    },
    [addOption, removeOption]
  );

  // Setting a target both stores it and re-arms the alert.
  const setTarget = useCallback((id, target) => {
    const val = target === '' || target == null ? null : +target;
    setOptions((cur) =>
      cur.map((x) =>
        x.id === id
          ? { ...x, targetPrice: Number.isFinite(val) ? val : null, alertFired: false }
          : x
      )
    );
  }, []);

  const enableNotifications = useCallback(async () => {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') {
      setNotifyEnabled(true);
      return true;
    }
    const res = await Notification.requestPermission();
    const ok = res === 'granted';
    setNotifyEnabled(ok);
    return ok;
  }, []);

  // ---- price watcher ----
  // Keep the latest options in a ref so the interval always sees current data
  // without being torn down/recreated on every edit.
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const notifyRef = useRef(notifyEnabled);
  notifyRef.current = notifyEnabled;

  const fireNotification = useCallback((opt, price) => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted' || !notifyRef.current) return;
    const kind = opt.type === 'call' ? 'Call' : 'Put';
    try {
      new Notification(`${opt.ticker} ${kind} ${opt.strike} — target hit`, {
        body: `Now $${price?.toFixed(2)} (target $${opt.targetPrice?.toFixed(2)}).`,
        tag: opt.id,
      });
    } catch {
      /* Notification can throw on some platforms; ignore. */
    }
  }, []);

  const runCheck = useCallback(async () => {
    const watched = optionsRef.current.filter((o) => o.targetPrice != null);
    if (watched.length === 0) return;
    setChecking(true);
    try {
      const byTicker = {};
      for (const o of watched) (byTicker[o.ticker] ||= []).push(o);

      const results = {};
      await Promise.all(
        Object.keys(byTicker).map(async (tk) => {
          try {
            const res = await fetch(
              `/api/options?ticker=${encodeURIComponent(tk)}`
            );
            if (!res.ok) return;
            const json = await res.json();
            results[tk] = json.rows || [];
          } catch {
            /* transient fetch failure — try again next tick */
          }
        })
      );

      const now = new Date().toISOString();
      setOptions((cur) =>
        cur.map((o) => {
          if (o.targetPrice == null) return o;
          const rows = results[o.ticker];
          if (!rows) return o;
          const row =
            rows.find((r) => r.contractSymbol === o.contractSymbol) ||
            rows.find(
              (r) =>
                r.type === o.type &&
                r.strike === o.strike &&
                r.expiration === o.expiration
            );
          if (!row) return { ...o, lastChecked: now };
          const price = row.premium;
          const below = price != null && price <= o.targetPrice;
          let alertFired = o.alertFired;
          if (below && !o.alertFired) {
            fireNotification(o, price);
            alertFired = true;
          } else if (!below && o.alertFired) {
            alertFired = false; // re-arm once it climbs back above target
          }
          return { ...o, lastPrice: price, alertFired, lastChecked: now };
        })
      );
      setLastCheck(now);
    } finally {
      setChecking(false);
    }
  }, [fireNotification]);

  const runCheckRef = useRef(runCheck);
  runCheckRef.current = runCheck;

  useEffect(() => {
    if (!hydrated) return;
    const id = setInterval(() => runCheckRef.current(), POLL_MS);
    return () => clearInterval(id);
  }, [hydrated]);

  // Count of options currently at/under target (for the tab badge).
  const alertCount = options.filter(
    (o) => o.targetPrice != null && o.lastPrice != null && o.lastPrice <= o.targetPrice
  ).length;

  return (
    <FavoritesContext.Provider
      value={{
        tickers,
        options,
        isTickerFav,
        toggleTicker,
        removeTicker,
        isOptionFav,
        addOption,
        removeOption,
        toggleOption,
        setTarget,
        notifyEnabled,
        enableNotifications,
        checkNow: () => runCheckRef.current(),
        checking,
        lastCheck,
        alertCount,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
