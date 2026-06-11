import { useState, useEffect, useCallback } from 'react';

export function useTranslation() {
  const [lang, setLang] = useState(() => window.i18n?.lang ?? 'it');

  useEffect(() => {
    const handler = (e) => setLang(e.detail?.lang ?? 'it');
    window.addEventListener('languageChanged', handler);
    return () => window.removeEventListener('languageChanged', handler);
  }, []);

  const t = useCallback(
    (key, ...args) => window.t?.(key, ...args) ?? key,
    [lang], // eslint-disable-line react-hooks/exhaustive-deps
  );

  return { t, lang };
}
