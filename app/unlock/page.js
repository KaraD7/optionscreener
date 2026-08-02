'use client';

import { useEffect, useState } from 'react';
import { t as translate } from '../../lib/i18n';

export default function Unlock() {
  const [lang, setLang] = useState('en');
  const [passcode, setPasscode] = useState('');
  const [status, setStatus] = useState('idle'); // idle | checking | wrong | error
  const t = (k) => translate(lang, k);

  useEffect(() => {
    const saved = window.localStorage.getItem('lang');
    if (saved === 'en' || saved === 'bg') setLang(saved);
  }, []);

  async function submit(e) {
    e.preventDefault();
    if (!passcode || status === 'checking') return;
    setStatus('checking');
    try {
      const res = await fetch('/api/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      if (res.ok) {
        const params = new URLSearchParams(window.location.search);
        const next = params.get('next') || '/';
        // Same-origin, absolute-path only — never follow an off-site next.
        window.location.href = next.startsWith('/') ? next : '/';
        return;
      }
      setStatus(res.status === 401 ? 'wrong' : 'error');
    } catch {
      setStatus('error');
    }
  }

  return (
    <div className="unlockwrap">
      <form className="unlockcard" onSubmit={submit}>
        <div className="mark">IV<b>/</b>HV</div>
        <h1>{t('unlockTitle')}</h1>
        <p>{t('unlockSub')}</p>
        <input
          type="password"
          autoFocus
          value={passcode}
          placeholder={t('unlockPlaceholder')}
          onChange={(e) => {
            setPasscode(e.target.value);
            if (status === 'wrong' || status === 'error') setStatus('idle');
          }}
        />
        <button type="submit" disabled={status === 'checking' || !passcode}>
          {status === 'checking' ? t('unlockChecking') : t('unlockButton')}
        </button>
        {status === 'wrong' && <div className="unlockmsg">{t('unlockWrong')}</div>}
        {status === 'error' && <div className="unlockmsg">{t('unlockError')}</div>}
      </form>
    </div>
  );
}
