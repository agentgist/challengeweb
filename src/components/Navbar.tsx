import React from 'react';
import {
  Award,
  ChevronLeft,
  KeyRound,
  LogOut,
  Moon,
  ShieldCheck,
  Sun,
  Trophy,
  UserCheck,
} from 'lucide-react';
import { AccessCode } from '../types';

export type ActivePage = 'home' | 'student_quiz' | 'teacher_dashboard' | 'admin_panel' | 'verify_certificate';

interface NavbarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  currentTeacher: AccessCode | null;
  onOpenTeacherLogin: () => void;
  onLogoutTeacher: () => void;
  darkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  setActivePage,
  currentTeacher,
  onOpenTeacherLogin,
  onLogoutTeacher,
  darkMode = false,
  onToggleDarkMode,
}) => (
  <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/85 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/85" dir="rtl">
    <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
      <button onClick={() => setActivePage('home')} className="group flex items-center gap-3 text-right">
        <span className="relative flex h-10 w-10 items-center justify-center rounded-[1rem] bg-[#10233f] text-cyan-300 shadow-lg shadow-slate-900/10 transition group-hover:-rotate-3 group-hover:scale-105">
          <Trophy className="h-5 w-5" strokeWidth={1.7} />
          <span className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full border-2 border-white bg-amber-400 dark:border-slate-950" />
        </span>
        <span className="hidden sm:block">
          <span className="block text-[17px] font-black tracking-tight text-[#10233f] dark:text-white">تَنَافُسْ</span>
          <span className="block text-[9px] font-bold text-slate-400">منصة تصنع الفرق</span>
        </span>
      </button>

      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => setActivePage('verify_certificate')}
          className={`hidden items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-black transition sm:flex ${
            activePage === 'verify_certificate'
              ? 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
          }`}
        >
          <Award className="h-4 w-4 text-amber-500" /> التحقق من شهادة
        </button>
        <button
          onClick={() => setActivePage('verify_certificate')}
          aria-label="التحقق من شهادة"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 sm:hidden"
        >
          <Award className="h-4 w-4 text-amber-500" />
        </button>
        {onToggleDarkMode && (
          <button
            onClick={onToggleDarkMode}
            aria-label="تبديل الوضع الليلي"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
          </button>
        )}
        {currentTeacher ? (
          <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 p-1 dark:border-emerald-900 dark:bg-emerald-950/40">
            <span className="hidden items-center gap-1 px-2 text-[10px] font-black text-emerald-800 dark:text-emerald-300 sm:flex">
              <UserCheck className="h-3.5 w-3.5" /> {currentTeacher.teacherDisplayName || 'المعلم'}
            </span>
            <button onClick={() => setActivePage('teacher_dashboard')} className="rounded-lg bg-emerald-600 px-2.5 py-1.5 text-[10px] font-black text-white transition hover:bg-emerald-700">لوحتي</button>
            <button onClick={onLogoutTeacher} aria-label="تسجيل الخروج" className="p-1.5 text-emerald-700 hover:text-rose-600 dark:text-emerald-300">
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setActivePage('home'); window.dispatchEvent(new CustomEvent('switch_home_tab', { detail: 'teacher' })); }}
            className="flex items-center gap-1.5 rounded-xl bg-[#10233f] px-3 py-2 text-[11px] font-black text-white transition hover:bg-cyan-700"
          >
            <KeyRound className="h-3.5 w-3.5 text-amber-300" /> <span className="hidden sm:inline">بوابة المعلم</span><span className="sm:hidden">دخول</span>
          </button>
        )}
      </div>
    </div>
    {activePage === 'student_quiz' && (
      <div className="border-t border-slate-100 bg-slate-50/70 px-4 py-2 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-[10px] font-bold text-slate-400">
          <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> جلسة آمنة ومشفرة</span>
          <button onClick={() => setActivePage('home')} className="flex items-center gap-1 text-cyan-700 dark:text-cyan-400">العودة للمسابقات <ChevronLeft className="h-3.5 w-3.5" /></button>
        </div>
      </div>
    )}
  </header>
);