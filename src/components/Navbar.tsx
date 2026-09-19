import React from 'react';
import { 
   Trophy, 
   KeyRound, 
   LogOut, 
   CheckCircle2, 
   UserCheck,
   ShieldCheck,
   Search,
   Moon,
   Sun,
   Sparkles,
   Award
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
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo - Luxury EdTech */}
        <div 
          onClick={() => setActivePage('home')}
          className="flex items-center gap-3 cursor-pointer select-none group"
        >
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 dark:from-slate-800 dark:to-teal-900 text-amber-400 flex items-center justify-center font-black shadow-md shadow-slate-950/10 group-hover:scale-105 transition-all border border-amber-500/20">
            <Trophy className="w-5 h-5 drop-shadow-[0_2px_4px_rgba(245,158,11,0.3)]" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-teal-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight font-sans">
                تَنَافُسْ
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800">
                منصة المسابقات
              </span>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 hidden sm:block">
              المسابقات المدرسية والشهادات الفورية
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Certificate Check Link */}
          <button
            onClick={() => setActivePage('verify_certificate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePage === 'verify_certificate'
                ? 'bg-teal-50 dark:bg-teal-950 text-teal-800 dark:text-teal-200 border border-teal-200 dark:border-teal-800'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>فحص شهادة</span>
          </button>

          {/* Dark Mode Toggle */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              title={darkMode ? 'التحويل للوضع النهاري' : 'التحويل للوضع الليلي'}
              className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
              aria-label="تبديل الوضع الليلي"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>
          )}

          {/* Teacher Active State or Quick Button */}
          {currentTeacher ? (
            <div className="flex items-center gap-1.5 bg-teal-50/90 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800/80 py-1 px-2.5 rounded-xl text-xs">
              <span className="font-bold text-teal-900 dark:text-teal-200 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span className="max-w-[100px] truncate">{currentTeacher.teacherDisplayName || 'معلم'}</span>
              </span>
              <button
                onClick={() => setActivePage('teacher_dashboard')}
                className="px-2.5 py-1 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-lg text-[11px] font-bold cursor-pointer transition-colors shadow-2xs"
              >
                لوحتي
              </button>
              <button
                onClick={onLogoutTeacher}
                title="تسجيل الخروج"
                className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setActivePage('home');
                window.dispatchEvent(new CustomEvent('switch_home_tab', { detail: 'teacher' }));
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-teal-700 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer border border-slate-200/60 dark:border-slate-800"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500" />
              <span>بوابة المعلم</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
