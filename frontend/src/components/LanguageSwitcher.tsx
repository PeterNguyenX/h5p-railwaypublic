import React from 'react';
import { useTranslation } from 'react-i18next';
const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  return (
    <label htmlFor="language-select">
      Language:
      <select
        id="language-select"
        value={i18n.language}
        onChange={e => i18n.changeLanguage(e.target.value)}
      >
        <option value="en">English</option>
        <option value="vi">Tiếng Việt</option>
      </select>
    </label>
  );
};
export default LanguageSwitcher;
