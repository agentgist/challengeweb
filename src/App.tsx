import React, { useState, useEffect } from 'react';
import { Navbar, ActivePage } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { StudentQuizView } from './components/StudentQuizView';
import { TeacherDashboard } from './components/TeacherDashboard';
import { AdminPanel } from './components/AdminPanel';
import { CertificateVerifierView } from './components/CertificateVerifierView';
import { TeacherAccessModal } from './components/TeacherAccessModal';
import { AccessCode, Competition } from './types';
import { StorageService } from './services/storageService';
import { Shield, Award, KeyRound } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('home');
  const [currentTeacher, setCurrentTeacher] = useState<AccessCode | null>(null);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [selectedQuizSlug, setSelectedQuizSlug] = useState<string>('');
  const [initialVerifyCode, setInitialVerifyCode] = useState<string>('');
  const [competitions, setCompetitions] = useState<Competition[]>([]);

  // Load competitions and logged-in teacher
  const loadData = () => {
    setCompetitions(StorageService.getCompetitions());
    const teacher = StorageService.getLoggedTeacher();
    if (teacher) {
      setCurrentTeacher(teacher);
    }
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage_update', loadData);

    // Check direct URL params:
    // 1. ?portal=admin or ?admin=... -> Dedicated Admin Link
    // 2. ?quiz=... or ?comp=... -> Student Quiz Link
    // 3. ?verify=... or ?cert=... -> Certificate Verification Link
    const params = new URLSearchParams(window.location.search);
    const hasAdminParam = params.get('portal') === 'admin' || params.get('admin') === 'true' || params.get('admin') === '1' || window.location.hash === '#admin';
    const quizParam = params.get('quiz') || params.get('comp');
    const verifyParam = params.get('verify') || params.get('cert');

    if (hasAdminParam) {
      setActivePage('admin_panel');
    } else if (quizParam) {
      setSelectedQuizSlug(quizParam);
      setActivePage('student_quiz');
    } else if (verifyParam) {
      setInitialVerifyCode(verifyParam);
      setActivePage('verify_certificate');
    }

    return () => window.removeEventListener('storage_update', loadData);
  }, []);

  const handleOpenCompetition = (slugOrId: string) => {
    setSelectedQuizSlug(slugOrId);
    setActivePage('student_quiz');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleTeacherLoginSuccess = (teacher: AccessCode) => {
    StorageService.setLoggedTeacher(teacher.code);
    setCurrentTeacher(teacher);
    setActivePage('teacher_dashboard');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLoginAsTeacherCode = (code: string) => {
    const result = StorageService.verifyAccessCode(code);
    if (result.valid && result.codeObj) {
      handleTeacherLoginSuccess(result.codeObj);
    }
  };

  const handleTeacherLogout = () => {
    StorageService.setLoggedTeacher(null);
    setCurrentTeacher(null);
    setActivePage('home');
  };

  const handleOpenAdmin = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('portal', 'admin');
    window.history.pushState({}, '', url.toString());
    setActivePage('admin_panel');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToPublicHome = () => {
    const url = new URL(window.location.href);
    url.searchParams.delete('portal');
    url.searchParams.delete('admin');
    window.history.pushState({}, '', url.pathname);
    setActivePage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col font-sans text-slate-900 selection:bg-teal-100 selection:text-teal-900" dir="rtl">
      
      {/* Clean Minimal Navbar */}
      <Navbar
        activePage={activePage}
        setActivePage={(page) => {
          if (page === 'home') handleBackToPublicHome();
          else setActivePage(page);
        }}
        currentTeacher={currentTeacher}
        onOpenTeacherLogin={() => setIsTeacherModalOpen(true)}
        onLogoutTeacher={handleTeacherLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
        
        {/* PUBLIC HOME: Google Minimalist 2-Choice Layout (Student vs Teacher) */}
        {activePage === 'home' && (
          <HomeView
            competitions={competitions}
            currentTeacher={currentTeacher}
            onOpenCompetition={handleOpenCompetition}
            onTeacherLoginSuccess={handleTeacherLoginSuccess}
            onGoToTeacherDashboard={() => setActivePage('teacher_dashboard')}
          />
        )}

        {/* STUDENT QUIZ: Focused quiz answering experience */}
        {activePage === 'student_quiz' && (
          <StudentQuizView
            initialCompetitionIdOrSlug={selectedQuizSlug}
            onBackToHome={handleBackToPublicHome}
          />
        )}

        {/* TEACHER DASHBOARD: Questions, Results & Certificate Printing */}
        {activePage === 'teacher_dashboard' && (
          currentTeacher ? (
            <TeacherDashboard
              currentTeacher={currentTeacher}
              onLogout={handleTeacherLogout}
              onOpenStudentView={handleOpenCompetition}
            />
          ) : (
            <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <Award className="w-6 h-6" />
              </div>
              <h2 className="text-base font-black text-slate-900">يلزم إدخال كود المعلم</h2>
              <p className="text-xs text-slate-500">
                يرجى إدخال رمز المعلم الخاص بك للوصول للوحة وإصدار الشهادات.
              </p>
              <button
                onClick={() => {
                  setActivePage('home');
                  window.dispatchEvent(new CustomEvent('switch_home_tab', { detail: 'teacher' }));
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                إدخال كود المعلم في الصفحة الرئيسية
              </button>
            </div>
          )
        )}

        {/* DEDICATED ADMIN PORTAL: Full platform control */}
        {activePage === 'admin_panel' && (
          <AdminPanel
            onBackToHome={handleBackToPublicHome}
            onLoginAsTeacher={handleLoginAsTeacherCode}
          />
        )}

        {/* CERTIFICATE VERIFIER */}
        {activePage === 'verify_certificate' && (
          <CertificateVerifierView
            onBackToHome={handleBackToPublicHome}
            initialCode={initialVerifyCode}
          />
        )}
      </main>

      {/* Ultra-Clean Google-style Footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-xs text-slate-400 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-slate-500 font-medium">
            تَنَافُسْ • منصة المسابقات المدرسية والشهادات الفورية
          </div>

          <div className="flex items-center gap-5 text-[11px]">
            <button
              onClick={() => setActivePage('verify_certificate')}
              className="text-slate-500 hover:text-slate-800 cursor-pointer transition-colors"
            >
              التحقق من الشهادات
            </button>

            {/* Dedicated Admin Portal Link */}
            <button
              onClick={handleOpenAdmin}
              className="flex items-center gap-1 text-slate-400 hover:text-rose-700 cursor-pointer transition-colors"
              title="رابط المدير المخصص للتحكم الكامل بالمنصة"
            >
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              <span>رابط المدير المخصص (?portal=admin)</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Teacher Access Code Modal */}
      <TeacherAccessModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        onSuccess={handleTeacherLoginSuccess}
      />
    </div>
  );
}
