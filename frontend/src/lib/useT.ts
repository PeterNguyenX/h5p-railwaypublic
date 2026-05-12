import { useTranslation } from 'react-i18next';

/**
 * Drop-in replacement for the old `const t = (key, fallback) => i18n.t(key) || fallback` pattern.
 * Using the hook makes the component subscribe to language changes and re-render automatically.
 */
export function useT() {
  const { t } = useTranslation();
  return (key: string, fallback: string): string => {
    const result = t(key, { defaultValue: fallback });
    return result || fallback;
  };
}
