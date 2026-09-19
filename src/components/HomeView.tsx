import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Search, 
  KeyRound, 
  ArrowRight, 
  Clock, 
  BookOpen, 
  School, 
  User, 
  Users, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Competition, AccessCode } from '../types';
import { StorageService } from '../services/storageService';

interface HomeViewProps {
  competitions: Competition[];
  currentTeacher: AccessCode | null;
  onOpenCompetition: (competitionIdOrSlug: string) => void;
  onTeacherLoginSuccess: (teacher: AccessCode) => void;
  onGoToTeacherDashboard: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  competitions,
  currentTeacher,
  onOpenCompetition,
  onTeacherLoginSuccess,
  onGoToTeacherDashboard,
}) => {
  // Mode: 'student' (only competitions) | 'teacher' (ask for teacher code)
  const [activeRole, setActiveRole] = useState<'student' | 'teacher'>('student');

  // Student Search & Category
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');

  // Teacher Code Form
  const [teacherCodeInput, setTeacherCodeInput] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Listen for navigation requests to switch tab
  useEffect(() => {
    const handleSwitch = (e: any) => {
      if (e.detail === 'teacher') {
        setActiveRole('teacher');
      } else if (e.detail === 'student') {
        setActiveRole('student');
      }
    };
    window.addEventListener('switch_home_tab', handleSwitch);
    return () => window.removeEventListener('switch_home_tab', handleSwitch);
  }, []);

  const categories = ['الكل', 'العلوم العامة', 'الرياضيات', 'التقنية والذكاء الاصطناعي', 'اللغة العربية', 'الثقافة الوطنية'];

  // Filter competitions for Student view
  const filteredCompetitions = competitions.filter(c => {
    const query = searchQuery.trim().toLowerCase();
    const matchesCategory = selectedCategory === 'الكل' || 
      c.questions.some(q => q.category?.toLowerCase().includes(selectedCategory.toLowerCase())) ||
      c.name.toLowerCase().includes(selectedCategory.toLowerCase());

    if (!matchesCategory) return false;
    if (!query) return true;

    return (
      c.name.toLowerCase().includes(query) ||
      c.webSlug.toLowerCase().includes(query) ||
      c.schoolName.toLowerCase().includes(query)
    );
  });

  // Handle Teacher Code Submission
  const handleTeacherCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);
    const raw = teacherCodeInput.trim();
    if (!raw) {
      setCodeError('يرجى كتابة كود المعلم');
      return;
    }

    setIsVerifying(true);
    const result = StorageService.verifyAccessCode(raw);
    setIsVerifying(false);

    if (result.valid && result.codeObj) {
      onTeacherLoginSuccess(result.codeObj);
    } else {
      setCodeError(result.message || 'كود المعلم غير صحيح أو تم إيقافه.');
    }
  };

  const handleQuickDemoCode = () => {
    setTeacherCodeInput('TCHR-7F2K9X');
    setCodeError(null);
    const result = StorageService.verifyAccessCode('TCHR-7F2K9X');
    if (result.valid && result.codeObj) {
      onTeacherLoginSuccess(result.codeObj);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-14 space-y-9 text-center transition-colors" dir="rtl">
      
      {/* Centered Brand Header - Modern EdTech Minimalist */}
      <div className="space-y-3.5 select-none">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/70 border border-teal-200/80 dark:border-teal-800 text-teal-800 dark:text-teal-300 text-xs font-bold shadow-2xs">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>منصة المسابقات المدرسية والشهادات الفورية</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
          تَنَافُسْ
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
          تحديات تعليمية حية، تقييم نزيه، وشهادات تفوق رسمية تصدر فور انتهاء المسابقة
        </p>
      </div>

      {/* The Two Main Options: Student vs Teacher */}
      <div className="inline-flex p-1.5 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl border border-slate-300/70 dark:border-slate-700 shadow-2xs backdrop-blur-xs">
        <button
          onClick={() => {
            setActiveRole('student');
            setCodeError(null);
          }}
          className={`px-7 sm:px-9 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
            activeRole === 'student'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>🎓</span>
          <span>أنا طالب</span>
        </button>

        <button
          onClick={() => {
            setActiveRole('teacher');
            setCodeError(null);
          }}
          className={`px-7 sm:px-9 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer flex items-center gap-2 ${
            activeRole === 'teacher'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span>👨‍🏫</span>
          <span>أنا معلم</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* CASE 1: STUDENT VIEW — ONLY COMPETITIONS APPEAR                */}
      {/* ============================================================== */}
      {activeRole === 'student' && (
        <div className="space-y-6 animate-in fade-in duration-200 text-right">
          
          {/* Centered Search Bar */}
          <div className="max-w-2xl mx-auto space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم المسابقة، رمزها، أو مدرستك..."
                className="w-full pr-11 pl-4 py-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 shadow-xs focus:outline-none focus:ring-2 focus:ring-teal-600/30 transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-4 top-4" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-4 top-3.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 text-xs font-bold"
                >
                  مسح
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Competitions Grid */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-bold px-1">
              <span>المسابقات المتاحة ({filteredCompetitions.length})</span>
              <span>اختر مسابقة للبدء فوراً دون تسجيل</span>
            </div>

            {filteredCompetitions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCompetitions.map((comp) => {
                  const isTeam = comp.participationType === 'team';
                  const compStatus = StorageService.getCompetitionStatus(comp);

                  return (
                    <div
                      key={comp.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 hover:border-teal-600/40 dark:hover:border-teal-500/40"
                    >
                      <div className="space-y-2.5">
                        {/* Badges Bar */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <School className="w-3.5 h-3.5 text-teal-600" />
                            <span>{comp.schoolName}</span>
                          </span>

                          <div className="flex items-center gap-1.5">
                            {/* Live/Windowed/Open Type Badge */}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              comp.competitionType === 'live'
                                ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                                : comp.competitionType === 'windowed'
                                ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-900'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}>
                              {comp.competitionType === 'live' ? '🔴 مباشرة' : comp.competitionType === 'windowed' ? '📅 مجدولة' : '⚡ مفتوحة'}
                            </span>

                            {/* Status Badge */}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              compStatus === 'active'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                                : compStatus === 'upcoming'
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                            }`}>
                              {compStatus === 'active' ? 'نشطة الآن' : compStatus === 'upcoming' ? 'تبدأ قريباً' : 'انتهت'}
                            </span>
                          </div>
                        </div>

                        <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white leading-snug">
                          {comp.name}
                        </h3>

                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                            <span>{comp.questions.length} أسئلة</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>
                              {comp.competitionType === 'live'
                                ? `${comp.examDurationMinutes || 20} دقيقة`
                                : `${comp.questionDuration}ث لكل سؤال`}
                            </span>
                          </span>
                          {comp.singleAttempt && (
                            <>
                              <span>•</span>
                              <span className="text-rose-600 dark:text-rose-400 font-bold">محاولة واحدة</span>
                            </>
                          )}
                          {comp.certificateEnabled && (
                            <>
                              <span>•</span>
                              <span className="text-amber-600 dark:text-amber-400 font-bold">شهادة معتمدة</span>
                            </>
                          )}
                        </div>

                        {/* Timing Note */}
                        {comp.competitionType === 'live' && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                            موعد المسابقة المباشرة: {new Date(comp.startTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                        {comp.competitionType === 'windowed' && (
                          <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                            متاحة حتى: {new Date(comp.endTime).toLocaleDateString('ar-SA')} ({new Date(comp.endTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })})
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => onOpenCompetition(comp.webSlug)}
                        className={`w-full py-2.5 rounded-xl text-xs font-black shadow-xs cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-1.5 ${
                          compStatus === 'active'
                            ? 'bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white'
                            : compStatus === 'upcoming'
                            ? 'bg-amber-600 hover:bg-amber-700 text-white'
                            : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        <span>
                          {compStatus === 'active'
                            ? 'بدء المسابقة الآن'
                            : compStatus === 'upcoming'
                            ? 'معاينة المسابقة والموعد'
                            : 'عرض النتائج الرسمية'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
                لا توجد مسابقات مطابقة لبحثك في هذا القسم.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* CASE 2: TEACHER VIEW — ASKS FOR TEACHER CODE                   */}
      {/* ============================================================== */}
      {activeRole === 'teacher' && (
        <div className="max-w-md mx-auto animate-in fade-in duration-200">
          {currentTeacher ? (
            /* Teacher Already Logged In */
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-center space-y-4 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center mx-auto border border-teal-200 dark:border-teal-800">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  مرحباً، {currentTeacher.teacherDisplayName}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {currentTeacher.school} • الرمز: {currentTeacher.code}
                </p>
              </div>

              <button
                onClick={onGoToTeacherDashboard}
                className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <span>فتح لوحة المسابقات والشهادات</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </div>
          ) : (
            /* Prompt for Teacher Access Code */
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-right space-y-5 shadow-sm">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                  أدخل كود المعلم
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  لإنشاء مسابقات لطلابك ومتابعة النتائج وطباعة الشهادات المعتمدة
                </p>
              </div>

              <form onSubmit={handleTeacherCodeSubmit} className="space-y-3 pt-1">
                <div>
                  <input
                    type="text"
                    required
                    value={teacherCodeInput}
                    onChange={(e) => {
                      setTeacherCodeInput(e.target.value.toUpperCase());
                      if (codeError) setCodeError(null);
                    }}
                    placeholder="مثال: TCHR-7F2K9X"
                    className="w-full text-center tracking-widest font-mono text-sm sm:text-base font-black px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-600/30 transition-all uppercase"
                  />
                  {codeError && (
                    <div className="flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 font-bold mt-2 pr-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{codeError}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isVerifying}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-xl text-xs sm:text-sm font-black shadow-md cursor-pointer transition-all active:scale-98 disabled:opacity-50"
                >
                  {isVerifying ? 'جارٍ التحقق...' : 'دخول'}
                </button>
              </form>

              {/* One-click Demo Code Helper */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={handleQuickDemoCode}
                  className="text-xs text-teal-700 dark:text-teal-400 hover:underline font-bold cursor-pointer transition-colors"
                >
                  تجربة فورية بكود معلم تجريبي (TCHR-7F2K9X)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
