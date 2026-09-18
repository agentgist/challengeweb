import React from 'react';
import { 
  Trophy, 
  KeyRound, 
  LogOut, 
  CheckCircle2, 
  UserCheck,
  ShieldCheck,
  Search
} from 'lucide-react';
import { AccessCode } from '../types';

export type ActivePage = 'home' | 'student_quiz' | 'teacher_dashboard' | 'admin_panel' | 'verify_certificate';

interface NavbarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  currentTeacher: AccessCode | null;
  onOpenTeacherLogin: () => void;
  onLogoutTeacher: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  setActivePage,
  currentTeacher,
  onOpenTeacherLogin,
  onLogoutTeacher,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-100" dir="rtl">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo - Google-like Minimalist */}
        <div 
          onClick={() => setActivePage('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-black shadow-xs group-hover:bg-teal-700 transition-colors">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 tracking-tight font-sans">
              تَنَافُسْ
            </span>
          </div>
        </div>

        {/* Minimal Actions */}
        <div className="flex items-center gap-2">
          {/* Certificate Check Link */}
          <button
            onClick={() => setActivePage('verify_certificate')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePage === 'verify_certificate'
                ? 'bg-slate-100 text-slate-900'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            فحص شهادة
          </button>

          {/* Teacher Active State or Quick Button */}
          {currentTeacher ? (
            <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200/80 py-1 px-2.5 rounded-xl text-xs">
              <span className="font-bold text-teal-900 flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-teal-600" />
                <span>{currentTeacher.teacherDisplayName || 'معلم'}</span>
              </span>
              <button
                onClick={() => setActivePage('teacher_dashboard')}
                className="px-2 py-0.5 bg-teal-700 text-white rounded-lg text-[11px] font-bold hover:bg-teal-800 cursor-pointer"
              >
                لوحتي
              </button>
              <button
                onClick={onLogoutTeacher}
                title="تسجيل الخروج"
                className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
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
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            >
              بوابة المعلم
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
