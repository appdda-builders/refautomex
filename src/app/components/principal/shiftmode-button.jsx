'use client';
import { useTheme } from '@/app/lib/theme-context';
import { MdLightMode } from 'react-icons/md';
import { FaStar } from 'react-icons/fa';

export default function ShiftModeButton() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`
        ${isDark
          ? 'from-indigo-800 via-gray-900 to-slate-800'
          : 'from-stone-100 via-gray-100 to-stone-300'}
        bg-gradient-to-tl hover:bg-gradient-to-br hover:scale-105 cursor-pointer
        opacity-90 font-semibold rounded-full shadow-2xl border-slate-600 border-b
        animate-out transition-all duration-500 ease-in-out
        w-14 h-14 flex items-center justify-center
      `}
    >
      {isDark
        ? <FaStar className="text-amber-400 -rotate-45 w-8 h-8" />
        : <MdLightMode className="text-yellow-500 -rotate-12 w-8 h-8" />
      }
    </button>
  );
}
