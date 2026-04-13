import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button className="theme-toggle" onClick={toggleTheme} type="button" aria-label="Trocar tema">
      <span className="theme-toggle__icon">{theme === 'light' ? '☀' : '☾'}</span>
      <span>{theme === 'light' ? 'Modo escuro' : 'Modo claro'}</span>
    </button>
  );
}
