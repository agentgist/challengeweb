import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  KeyRound,
  Layers3,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  UsersRound,
  Zap,
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

const categories = ['الكل', 'العلوم', 'الرياضيات', 'التقنية', 'اللغة العربية', 'الثقافة الوطنية'];

const categoryTone = (competition: Competition) => {
  const value = `${competition.name} ${competition.questions.map((q) => q.category).join(' ')}`;
  if (value.includes('رياض')) return { label: 'رياضيات', className: 'from-violet-500 to-indigo-600', soft: 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300' };
  if (value.includes('أحياء') || value.includes('علوم')) return { label: 'علوم', className: 'from-cyan-500 to-blue-600', soft: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300' };
  if (value.includes('تقنية') || value.includes('ذكاء') || value.includes('روبوت')) return { label: 'تقنية', className: 'from-emerald-500 to-teal-600', soft: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' };
  return { label: 'معرفة عامة', className: 'from-amber-400 to-orange-500', soft: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' };
};

const statusCopy = (status: ReturnType<typeof StorageService.getCompetitionStatus>) => {
  if (status === 'active') return { label: 'متاح الآن', action: 'ابدأ التحدي', tone: 'active' };
  if (status === 'upcoming') return { label: 'يبدأ قريباً', action: 'استكشف المسابقة', tone: 'upcoming' };
  return { label: 'انتهت', action: 'عرض النتائج', tone: 'ended' };
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' });

export const HomeView: React.FC<HomeViewProps> = ({
  competitions,
  currentTeacher,
  onOpenCompetition,
  onTeacherLoginSuccess,
  onGoToTeacherDashboard,
}) => {
  const [activeRole, setActiveRole] = useState<'student' | 'teacher'>('student');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [teacherCodeInput, setTeacherCodeInput] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    const handleSwitch = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail === 'teacher' || detail === 'student') setActiveRole(detail);
    };
    window.addEventListener('switch_home_tab', handleSwitch);
    return () => window.removeEventListener('switch_home_tab', handleSwitch);
  }, []);

  const filteredCompetitions = useMemo(() => competitions.filter((competition) => {
    const query = searchQuery.trim().toLowerCase();
    const haystack = `${competition.name} ${competition.webSlug} ${competition.schoolName} ${competition.description}`.toLowerCase();
    const categoryMatch = selectedCategory === 'الكل'
      || (selectedCategory === 'العلوم' && haystack.includes('علوم'))
      || (selectedCategory === 'الرياضيات' && haystack.includes('رياض'))
      || (selectedCategory === 'التقنية' && (haystack.includes('تقنية') || haystack.includes('ذكاء') || haystack.includes('روبوت')))
      || (selectedCategory === 'اللغة العربية' && haystack.includes('عربي'))
      || (selectedCategory === 'الثقافة الوطنية' && haystack.includes('وطن'));
    return categoryMatch && (!query || haystack.includes(query));
  }), [competitions, searchQuery, selectedCategory]);

  const activeCompetitions = filteredCompetitions.filter((competition) => StorageService.getCompetitionStatus(competition) === 'active');
  const featuredCompetition = activeCompetitions[0] || filteredCompetitions[0];
  const otherCompetitions = filteredCompetitions.filter((competition) => competition.id !== featuredCompetition?.id);

  const handleTeacherCodeSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setCodeError(null);
    const raw = teacherCodeInput.trim();
    if (!raw) {
      setCodeError('اكتب كود المعلم للمتابعة');
      return;
    }
    setIsVerifying(true);
    const result = StorageService.verifyAccessCode(raw);
    setIsVerifying(false);
    if (result.valid && result.codeObj) onTeacherLoginSuccess(result.codeObj);
    else setCodeError(result.message || 'الكود غير صحيح أو تم إيقافه.');
  };

  const handleQuickDemoCode = () => {
    setTeacherCodeInput('TCHR-7F2K9X');
    setCodeError(null);
    const result = StorageService.verifyAccessCode('TCHR-7F2K9X');
    if (result.valid && result.codeObj) onTeacherLoginSuccess(result.codeObj);
  };

  return (
    <div className="space-y-10 pb-8" dir="rtl">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#10233f] px-6 py-10 text-white shadow-2xl shadow-slate-900/10 sm:px-10 sm:py-12 lg:px-14">
        <div className="hero-orb hero-orb-one" />
        <div className="hero-orb hero-orb-two" />
        <div className="relative z-10 grid items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold text-cyan-100 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              مساحة واحدة لكل إنجاز جديد
            </div>
            <h1 className="text-4xl font-black leading-[1.2] tracking-tight sm:text-6xl">
              نافس بذكاء،<br />
              <span className="text-cyan-300">وتعلّم بلا حدود.</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm leading-8 text-slate-300 sm:text-base">
              مسابقات تعليمية ممتعة، نتائج فورية، وشهادات تقدير تخلّي كل خطوة في رحلة التعلم محسوبة.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={() => document.getElementById('competitions')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 text-xs font-black text-[#10233f] shadow-lg shadow-cyan-400/20 transition hover:-translate-y-0.5 hover:bg-cyan-300"
              >
                استكشف المسابقات <ArrowLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setActiveRole('teacher')}
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-xs font-bold text-white transition hover:bg-white/15"
              >
                بوابة المعلم <KeyRound className="h-4 w-4 text-amber-300" />
              </button>
            </div>
          </div>
          <div className="hidden justify-end lg:flex">
            <div className="relative flex h-64 w-64 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] shadow-2xl shadow-cyan-950/30">
              <div className="absolute inset-5 rounded-full border border-cyan-300/20" />
              <div className="absolute inset-11 rounded-full border border-dashed border-amber-300/30" />
              <div className="flex h-28 w-28 items-center justify-center rounded-[2rem] bg-gradient-to-br from-cyan-300 to-blue-500 text-[#10233f] shadow-xl shadow-cyan-500/25">
                <Trophy className="h-14 w-14" strokeWidth={1.5} />
              </div>
              <div className="absolute right-2 top-12 flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-bold backdrop-blur">
                <Zap className="h-3.5 w-3.5 text-amber-300" /> نتائج فورية
              </div>
              <div className="absolute bottom-10 left-0 flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-[10px] font-bold backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" /> تجربة موثوقة
              </div>
            </div>
          </div>
        </div>
        <div className="relative z-10 mt-10 grid max-w-2xl grid-cols-3 gap-3 border-t border-white/10 pt-6">
          {[
            { value: competitions.length || 0, label: 'مسابقة متاحة', icon: Layers3 },
            { value: competitions.reduce((total, item) => total + item.questions.length, 0), label: 'سؤال تفاعلي', icon: BookOpen },
            { value: '100%', label: 'مجاني للطلاب', icon: Award },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="flex items-center gap-2.5">
              <Icon className="hidden h-4 w-4 text-cyan-300 sm:block" />
              <div>
                <p className="text-lg font-black">{value}</p>
                <p className="text-[10px] text-slate-400">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-1 text-[11px] font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">ابدأ من هنا</p>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">ماذا تريد أن تفعل اليوم؟</h2>
        </div>
        <div className="flex w-full rounded-xl bg-slate-200/70 p-1 dark:bg-slate-800 sm:w-auto">
          {[
            { value: 'student' as const, label: 'أبحث عن مسابقة', icon: Play },
            { value: 'teacher' as const, label: 'أدير مسابقاتي', icon: UsersRound },
          ].map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => { setActiveRole(value); setCodeError(null); }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-black transition sm:flex-none ${
                activeRole === value ? 'bg-white text-[#10233f] shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {activeRole === 'student' ? (
        <section id="competitions" className="space-y-6">
          <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="ابحث عن مسابقة أو مدرسة..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pe-10 ps-4 text-xs font-bold text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`whitespace-nowrap rounded-lg px-3 py-2 text-[11px] font-bold transition ${
                    selectedCategory === category ? 'bg-[#10233f] text-white dark:bg-cyan-500 dark:text-slate-950' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {featuredCompetition && (
            <FeaturedCompetition competition={featuredCompetition} onOpenCompetition={onOpenCompetition} />
          )}

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">كل المسابقات</h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{filteredCompetitions.length} تجربة جاهزة لتبدأها</p>
            </div>
            <span className="hidden items-center gap-1.5 text-[11px] font-bold text-slate-400 sm:flex"><ShieldCheck className="h-4 w-4 text-emerald-500" /> دخول بلا تسجيل</span>
          </div>

          {otherCompetitions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {otherCompetitions.map((competition) => (
                <CompetitionCard key={competition.id} competition={competition} onOpenCompetition={onOpenCompetition} />
              ))}
            </div>
          ) : !featuredCompetition ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <Search className="mx-auto mb-3 h-8 w-8 text-slate-300" />
              <p className="text-sm font-black text-slate-700 dark:text-slate-200">لم نجد مسابقة مطابقة</p>
              <p className="mt-1 text-xs text-slate-400">جرّب كلمة بحث أخرى أو اختر تصنيفاً مختلفاً.</p>
            </div>
          ) : null}
        </section>
      ) : (
        <section className="mx-auto max-w-xl">
          {currentTeacher ? (
            <div className="overflow-hidden rounded-3xl border border-emerald-200 bg-white shadow-xl shadow-emerald-900/5 dark:border-emerald-900 dark:bg-slate-900">
              <div className="bg-gradient-to-l from-emerald-500 to-teal-600 p-7 text-white">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15"><CheckCircle2 className="h-6 w-6" /></div>
                <p className="text-xs font-bold text-emerald-100">تم تسجيل الدخول بنجاح</p>
                <h2 className="mt-1 text-2xl font-black">{currentTeacher.teacherDisplayName || 'مرحباً بك'}</h2>
                <p className="mt-2 text-xs text-emerald-50/80">{currentTeacher.school || 'مساحة إدارة المسابقات'}</p>
              </div>
              <div className="p-6">
                <button onClick={onGoToTeacherDashboard} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10233f] py-3.5 text-xs font-black text-white transition hover:bg-cyan-700">
                  فتح لوحة التحكم <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 sm:p-8">
              <div className="mb-7 flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300"><KeyRound className="h-5 w-5" /></div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">مساحتك لإدارة التميز</h2>
                  <p className="mt-1 text-xs leading-6 text-slate-500 dark:text-slate-400">أنشئ مسابقاتك، تابع أداء الطلاب، وامنحهم شهادات تليق بإنجازهم.</p>
                </div>
              </div>
              <form onSubmit={handleTeacherCodeSubmit} className="space-y-3">
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300">كود الدخول الخاص بك</label>
                <input
                  type="text"
                  required
                  value={teacherCodeInput}
                  onChange={(event) => { setTeacherCodeInput(event.target.value.toUpperCase()); if (codeError) setCodeError(null); }}
                  placeholder="TCHR-7F2K9X"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center font-mono text-sm font-black tracking-widest text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                {codeError && <p className="flex items-center gap-1.5 text-xs font-bold text-rose-600"><AlertCircle className="h-3.5 w-3.5" /> {codeError}</p>}
                <button type="submit" disabled={isVerifying} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#10233f] py-3.5 text-xs font-black text-white transition hover:bg-cyan-700 disabled:opacity-50">
                  {isVerifying ? 'جارٍ التحقق...' : 'دخول إلى لوحة المعلم'} <ArrowLeft className="h-4 w-4" />
                </button>
              </form>
              <button type="button" onClick={handleQuickDemoCode} className="mt-5 w-full text-center text-[11px] font-bold text-cyan-700 hover:underline dark:text-cyan-400">تجربة المنصة بكود تجريبي</button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

const FeaturedCompetition: React.FC<{ competition: Competition; onOpenCompetition: (id: string) => void }> = ({ competition, onOpenCompetition }) => {
  const status = statusCopy(StorageService.getCompetitionStatus(competition));
  const tone = categoryTone(competition);
  return (
    <article className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${tone.className} p-6 text-white shadow-xl shadow-cyan-900/10 sm:p-8`}>
      <div className="absolute -left-16 -top-20 h-64 w-64 rounded-full border border-white/10" />
      <div className="absolute -bottom-28 right-1/3 h-72 w-72 rounded-full border border-white/10" />
      <div className="relative z-10 grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black backdrop-blur">{status.label}</span>
            <span className="rounded-full bg-black/10 px-3 py-1.5 text-[10px] font-bold">{tone.label}</span>
            {competition.certificateEnabled && <span className="flex items-center gap-1 rounded-full bg-amber-300/20 px-3 py-1.5 text-[10px] font-bold text-amber-50"><Award className="h-3 w-3" /> شهادة إنجاز</span>}
          </div>
          <p className="mb-2 text-[11px] font-bold text-white/70">المسابقة المميزة لهذا الأسبوع</p>
          <h3 className="max-w-2xl text-2xl font-black leading-snug sm:text-3xl">{competition.name}</h3>
          <p className="mt-3 max-w-2xl text-xs leading-7 text-white/75">{competition.description}</p>
          <div className="mt-6 flex flex-wrap gap-4 text-[11px] font-bold text-white/80">
            <span className="flex items-center gap-1.5"><BookOpen className="h-4 w-4" /> {competition.questions.length} أسئلة</span>
            <span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4" /> {competition.examDurationMinutes || competition.questionDuration} دقيقة</span>
            <span className="flex items-center gap-1.5"><UsersRound className="h-4 w-4" /> {competition.participationType === 'team' ? 'فرق' : 'فردي'}</span>
          </div>
        </div>
        <button onClick={() => onOpenCompetition(competition.webSlug)} className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-xs font-black text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-50">
          {status.action} <ArrowLeft className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
};

const CompetitionCard: React.FC<{ competition: Competition; onOpenCompetition: (id: string) => void }> = ({ competition, onOpenCompetition }) => {
  const tone = categoryTone(competition);
  const status = statusCopy(StorageService.getCompetitionStatus(competition));
  return (
    <article className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-300 hover:shadow-xl hover:shadow-cyan-900/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-800">
      <div className="mb-5 flex items-start justify-between gap-3">
        <span className={`inline-flex rounded-lg px-2.5 py-1 text-[10px] font-black ${tone.soft}`}>{tone.label}</span>
        <span className={`flex items-center gap-1.5 text-[10px] font-black ${status.tone === 'active' ? 'text-emerald-600 dark:text-emerald-400' : status.tone === 'upcoming' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${status.tone === 'active' ? 'bg-emerald-500' : status.tone === 'upcoming' ? 'bg-amber-500' : 'bg-slate-300'}`} /> {status.label}
        </span>
      </div>
      <h3 className="line-clamp-2 min-h-[3.5rem] text-base font-black leading-7 text-slate-900 dark:text-white">{competition.name}</h3>
      <p className="mt-2 line-clamp-2 min-h-[2.8rem] text-xs leading-6 text-slate-500 dark:text-slate-400">{competition.description}</p>
      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-[10px] font-bold text-slate-400 dark:border-slate-800">
        <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" /> {competition.questions.length} أسئلة</span>
        <span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {competition.examDurationMinutes || competition.questionDuration} دقيقة</span>
        {competition.endTime && <span className="flex items-center gap-1"><ChevronLeft className="h-3.5 w-3.5" /> حتى {formatDate(competition.endTime)}</span>}
      </div>
      <button onClick={() => onOpenCompetition(competition.webSlug)} className="mt-5 flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3 text-[11px] font-black text-slate-700 transition group-hover:bg-[#10233f] group-hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-cyan-500 dark:group-hover:text-slate-950">
        {status.action} <ArrowLeft className="h-4 w-4 transition group-hover:-translate-x-1" />
      </button>
    </article>
  );
};