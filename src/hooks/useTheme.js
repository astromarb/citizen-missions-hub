import { useEffect, useState } from 'react';

export function useTheme() {
  const [dark, setDark] = useState(() => localStorage.getItem('cmh_theme') === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('cmh_theme', dark ? 'dark' : 'light');
  }, [dark]);

  // Apply on mount immediately
  useEffect(() => {
    const saved = localStorage.getItem('cmh_theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  }, []);

  return [dark, setDark];
}
