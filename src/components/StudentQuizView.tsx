import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Timer, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Award, 
  RotateCcw, 
  Sparkles, 
  ChevronLeft, 
  School, 
  User, 
  Users,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
  Share2,
  Clock,
  Lock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Competition, Question, Participant, ParticipantResult } from '../types';
import { StorageService } from '../services/storageService';
import { CertificateModal } from './CertificateModal';

interface StudentQuizViewProps {
  initialCompetitionIdOrSlug?: string;
  onBackToHome: () => void;
}

export const StudentQuizView: React.FC<StudentQuizViewProps> = ({
  initialCompetitionIdOrSlug,
  onBackToHome,
}) => {
  const [competition, setCompetition] = useState<Competition | null>(null);

  // Screen state
  const [stage, setStage] = useState<'welcome' | 'quiz' | 'completed'>('welcome');

  // Registration Form
  const [studentName, setStudentName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [participant, setParticipant] = useState<Participant | null>(null);

  // Quiz progression
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [antiCheatWarnings, setAntiCheatWarnings] = useState(0);
  const [showWarningAlert, setShowWarningAlert] = useState(false);

  // Results & Certificate
  const [finalResult, setFinalResult] = useState<ParticipantResult | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Single Attempt & Schedule Gate state
  const [priorAttempt, setPriorAttempt] = useState<ParticipantResult | null>(null);
  const [attemptError, setAttemptError] = useState<string | null>(null);

  const questionStartTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<any>(null);

  // Load target competition
  useEffect(() => {
    const all = StorageService.getCompetitions();
    let target: Competition | null = null;
    if (initialCompetitionIdOrSlug) {
      target = StorageService.getCompetitionById(initialCompetitionIdOrSlug) || null;
    }
    if (!target) {
      target = all.find(c => c.status === 'active') || all[0] || null;
    }
    setCompetition(target);

    if (target) {
      const check = StorageService.hasStudentParticipated(target.id);
      if (check.participated && check.participant) {
        setPriorAttempt(check.participant);
      }
    }
  }, [initialCompetitionIdOrSlug]);

  // Anti-cheat tab switch detector
  useEffect(() => {
    if (stage !== 'quiz' || !competition?.antiCheatEnabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setAntiCheatWarnings(prev => prev + 1);
        setShowWarningAlert(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [stage, competition]);

  // Question Timer
  useEffect(() => {
    if (stage !== 'quiz' || !competition) return;

    const currentQ = competition.questions[currentIndex];
    const duration = currentQ?.duration || competition.questionDuration || 30;

    setTimeLeft(duration);
    setIsAnswered(false);
    setSelectedOption(null);
    questionStartTimeRef.current = Date.now();

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeExpire();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, stage, competition]);

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!competition) return;

    setAttemptError(null);

    // 1. Timing Gate Checks
    const now = Date.now();
    const startMs = new Date(competition.startTime).getTime();
    const endMs = new Date(competition.endTime).getTime();

    if (now < startMs) {
      setAttemptError(`هذه المسابقة لم تبدأ بعد. موعد الانطلاق المعتمد هو: ${new Date(competition.startTime).toLocaleString('ar-SA')}`);
      return;
    }

    if (now > endMs) {
      setAttemptError(`انتهت هذه المسابقة رسمياً في: ${new Date(competition.endTime).toLocaleString('ar-SA')}. يمكنك فقط الاطلاع على النتائج الرسمية.`);
      return;
    }

    if (!studentName.trim()) {
      setAttemptError('يرجى إدخال اسمك الكريم الثلاثي للمشاركة.');
      return;
    }

    if (competition.participationType === 'team' && !teamName.trim()) {
      setAttemptError('هذه مسابقة فرق جماعية، يرجى كتابة اسم فريقك للمشاركة.');
      return;
    }

    // 2. Single Attempt Constraint
    if (competition.singleAttempt) {
      const check = StorageService.hasStudentParticipated(competition.id, studentName.trim());
      if (check.participated) {
        setAttemptError(`عذراً، الاسم "${studentName.trim()}" أو هذا الجهاز مسجل بالفعل كمشارك سابق. نظام هذه المسابقة يسمح بمحاولة واحدة فقط لكل متسابق.`);
        return;
      }
    }

    // Register participant
    const newPart = StorageService.registerParticipant({
      competitionId: competition.id,
      name: studentName.trim(),
      school: schoolName.trim() || 'المملكة العربية السعودية',
      teamName: competition.participationType === 'team' ? teamName.trim() : undefined
    });

    setParticipant(newPart);
    setStage('quiz');
    setCurrentIndex(0);
  };

  const handleSelectAnswer = (optionIndex: number) => {
    if (isAnswered || !competition || !participant) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setIsAnswered(true);
    setSelectedOption(optionIndex);

    const currentQ = competition.questions[currentIndex];
    const timeTaken = Math.max(1, (Date.now() - questionStartTimeRef.current) / 1000);
    const isCorrect = optionIndex === currentQ.correctIndex;

    // Save to database
    StorageService.saveAnswer({
      participantId: participant.id,
      questionId: currentQ.id,
      selectedIndex: optionIndex,
      isCorrect,
      timeTaken
    });

    // Auto-advance after 1.5s delay so the student sees their answer confirmed
    setTimeout(() => {
      advanceToNextQuestion();
    }, 1500);
  };

  const handleTimeExpire = () => {
    if (isAnswered || !competition || !participant) return;

    setIsAnswered(true);
    const currentQ = competition.questions[currentIndex];
    const duration = currentQ?.duration || competition.questionDuration || 30;

    StorageService.saveAnswer({
      participantId: participant.id,
      questionId: currentQ.id,
      selectedIndex: -1, // Expired
      isCorrect: false,
      timeTaken: duration
    });

    setTimeout(() => {
      advanceToNextQuestion();
    }, 1200);
  };

  const advanceToNextQuestion = () => {
    if (!competition || !participant) return;

    if (currentIndex + 1 < competition.questions.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // Finalize and complete
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    if (!competition || !participant) return;

    const res = StorageService.finalizeParticipant(participant.id, competition.questions.length);
    setFinalResult(res);
    setStage('completed');

    // Confetti effect!
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}
  };

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  if (!competition) {
    return (
      <div className="quiz-page max-w-md mx-auto my-16 p-8 bg-white rounded-3xl border border-slate-200 text-center shadow-sm" dir="rtl">
        <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h2 className="text-base font-bold text-slate-800">المسابقة المطلوبة غير متاحة حالياً</h2>
        <p className="text-xs text-slate-500 mt-1 mb-5">تأكد من صحة الرابط أو عد للصفحة الرئيسية لتصفح المسابقات النشطة.</p>
        <button
          onClick={onBackToHome}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 cursor-pointer"
        >
          العودة للصفحة الرئيسية
        </button>
      </div>
    );
  }

  const currentQ = competition.questions[currentIndex];
  const duration = currentQ?.duration || competition.questionDuration || 30;
  const progressPercent = Math.min(100, (timeLeft / duration) * 100);

  return (
    <div className="quiz-page max-w-4xl mx-auto px-4 py-6 sm:py-10" dir="rtl">
      
      {/* 1. WELCOME SCREEN (Direct Entry - No Login!) */}
      {stage === 'welcome' && (
        <div className="quiz-panel bg-white rounded-[2rem] border border-slate-200 p-6 sm:p-9 shadow-lg text-right space-y-6 animate-in fade-in">
          
          <div className="flex items-center justify-between">
            <button
              onClick={onBackToHome}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 rotate-180" />
              <span>الرئيسية</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-teal-700 p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'تم نسخ الرابط' : 'مشاركة المسابقة'}</span>
            </button>
          </div>

          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-[11px] font-bold">
              <span>{competition.source === 'platform' ? 'مسابقة عامة' : 'مسابقة معلم'}</span>
              <span>•</span>
              <span>{competition.participationType === 'team' ? 'فرق جماعية' : 'مشاركة فردية'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {competition.name}
            </h1>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              {competition.description || 'أهلاً بك! اختبر معلوماتك، نافس زملاءك، واحصل على شهادة شكر وتقدير معتمدة فور إنهائك للمسابقة.'}
            </p>
          </div>

          {/* Teacher / School Meta info */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-around text-center text-xs">
            <div>
              <div className="text-[10px] text-slate-500">المعلم المشرف</div>
              <div className="font-black text-slate-900 mt-0.5">{competition.teacherDisplayName}</div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <div className="text-[10px] text-slate-500">عدد الأسئلة</div>
              <div className="font-black text-slate-900 mt-0.5">{competition.questions.length} أسئلة</div>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div>
              <div className="text-[10px] text-slate-500">
                {competition.competitionType === 'live' ? 'مدة المسابقة' : 'مدة السؤال'}
              </div>
              <div className="font-black text-slate-900 mt-0.5">
                {competition.competitionType === 'live'
                  ? `${competition.examDurationMinutes || 20} دقيقة`
                  : `${competition.questionDuration} ثانية`}
              </div>
            </div>
          </div>

          {/* Competition Schedule & Policy Badges */}
          <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                {competition.competitionType === 'live' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                    <span className="text-rose-700">مسابقة مباشرة:</span>
                    <span>موعد الانطلاق {new Date(competition.startTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                  </>
                ) : competition.competitionType === 'windowed' ? (
                  <>
                    <span className="text-teal-700">مسابقة مجدولة:</span>
                    <span>تغلق في {new Date(competition.endTime).toLocaleDateString('ar-SA')} ({new Date(competition.endTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })})</span>
                  </>
                ) : (
                  <>
                    <span className="text-slate-700">مسابقة تدريبية مفتوحة</span>
                  </>
                )}
              </span>

              <div className="flex items-center gap-1 text-[11px] font-bold">
                {competition.singleAttempt && (
                  <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded-md border border-rose-200">
                    محاولة واحدة فقط
                  </span>
                )}
                {competition.hideAnswersUntilEnd && (
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-800 rounded-md border border-teal-200">
                    النتائج بعد نهاية المسابقة
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Error Banner if any */}
          {attemptError && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">تنبيه المشاركة:</span>
                <p className="text-[11px] text-rose-800 mt-0.5">{attemptError}</p>
              </div>
            </div>
          )}

          {/* Prior Attempt Notice for Single Attempt Competitions */}
          {priorAttempt && competition.singleAttempt ? (
            <div className="p-5 bg-teal-50 border border-teal-200 rounded-2xl text-right space-y-3">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>أنت مسجل بالفعل كمشارك سابق باسم: {priorAttempt.name}</span>
              </div>
              <p className="text-[11px] text-teal-800 leading-relaxed">
                نظام هذه المسابقة يتيح محاولة واحدة فقط لكل طالب لضمان النزاهة.
                {competition.hideAnswersUntilEnd && (competition.status !== 'ended' && Date.now() < new Date(competition.endTime).getTime()) ? (
                  <span className="block mt-1 font-bold">
                    * ستُعلن النتائج الرسمية والإجابات الصحيحة للجميع فور انتهاء وقت المسابقة في: {new Date(competition.endTime).toLocaleString('ar-SA')}.
                  </span>
                ) : (
                  <span className="block mt-1 font-bold text-emerald-800">
                    * انتهت المسابقة! يمكنك استعراض نتيجتك وشهادتك ومراجعة الأسئلة الآن.
                  </span>
                )}
              </p>

              {(competition.status === 'ended' || !competition.hideAnswersUntilEnd || Date.now() >= new Date(competition.endTime).getTime()) && (
                <button
                  type="button"
                  onClick={() => {
                    setFinalResult(priorAttempt);
                    setStage('completed');
                  }}
                  className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  استعراض نتيجتي الرسمية والشهادة ومراجعة الأسئلة
                </button>
              )}
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleStartQuiz} className="space-y-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  اسمك الكامل الثلاثي (كما سيظهر في شهادة التقدير) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="مثال: يوسف بن خالد العتيبي"
                    className="w-full pr-9 pl-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-teal-600 focus:bg-white"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  المدرسة أو الصرح التعليمي
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="مثال: مدرسة الإمام الشافعي"
                    className="w-full pr-9 pl-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-teal-600 focus:bg-white"
                  />
                  <School className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                </div>
              </div>

              {/* Team mode requirement */}
              {competition.participationType === 'team' && (
                <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-sky-900">
                    <Users className="w-4 h-4 text-sky-600" />
                    <span>مسابقة فرق جماعية — اكتب اسم فريقك بدقة</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="مثال: فرسان المستقبل، عباقرة الرياضيات..."
                    className="w-full px-3 py-2 bg-white border border-sky-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-sky-600"
                  />
                  <p className="text-[10px] text-sky-700">
                    * سيتم احتساب مجموع درجات جميع أعضاء هذا الفريق للمنافسة على صدارة الفرق!
                  </p>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-[#10233f] hover:bg-cyan-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-slate-900/20 cursor-pointer transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <span>انطلاق المسابقة الآن</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>
            </form>
          )}
        </div>
      )}

      {/* 2. QUIZ SCREEN (Single Question per screen - Anti-Cheat - Timed) */}
      {stage === 'quiz' && currentQ && (
        <div className="space-y-4">
          
          {/* Top Progress & Timer Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                السؤال {currentIndex + 1} من {competition.questions.length}
              </span>
              <span className="text-xs text-slate-500 hidden sm:inline">
                {studentName}
              </span>
            </div>

            {/* Circular Timer Visual */}
            <div className="flex items-center gap-2">
              <Timer className={`w-4 h-4 ${timeLeft <= 5 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
              <span className={`font-mono text-sm font-black ${timeLeft <= 5 ? 'text-rose-600' : 'text-slate-900'}`}>
                {timeLeft} ث
              </span>
            </div>
          </div>

          {/* Time progress bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ${
                timeLeft <= 5 ? 'bg-rose-500' : 'bg-teal-600'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Anti-cheat Alert if triggered */}
          {showWarningAlert && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-center justify-between animate-shake">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  تنبيه نزاهة: تم رصد مغادرة نافذة المسابقة ({antiCheatWarnings} مرات). يرجى التركيز لضمان صحة النتيجة!
                </span>
              </div>
              <button
                onClick={() => setShowWarningAlert(false)}
                className="text-amber-800 font-bold text-[10px] underline cursor-pointer"
              >
                فهمت
              </button>
            </div>
          )}

          {/* Question Card (Disables user text selection to prevent cheating) */}
          <div className="quiz-question bg-white rounded-[2rem] border border-slate-200 p-6 sm:p-9 shadow-sm space-y-6 select-none">
            <h2 className="text-base sm:text-lg font-black text-slate-900 leading-relaxed">
              {currentQ.text}
            </h2>

              {/* Options */}
            <div className="space-y-3">
              {currentQ.options.map((optionText, optIdx) => {
                const isSelected = selectedOption === optIdx;
                const hideFeedback = competition.hideAnswersUntilEnd;
                let btnStyle = 'bg-slate-50 hover:bg-slate-100/80 border-slate-200 text-slate-800';

                if (isAnswered) {
                  if (hideFeedback) {
                    // Confidential mode: do not reveal correctness
                    if (isSelected) {
                      btnStyle = 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-500/20';
                    }
                  } else {
                    // Immediate reveal mode
                    if (isSelected) {
                      btnStyle = optIdx === currentQ.correctIndex
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-500/20';
                    } else if (optIdx === currentQ.correctIndex) {
                      btnStyle = 'bg-emerald-50/50 border-emerald-300 text-emerald-800';
                    }
                  }
                }

                return (
                  <button
                    key={optIdx}
                    disabled={isAnswered}
                    onClick={() => handleSelectAnswer(optIdx)}
                    className={`w-full p-4 rounded-2xl border text-right font-medium text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer disabled:cursor-default ${btnStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shadow-2xs">
                        {['أ', 'ب', 'ج', 'د'][optIdx] || optIdx + 1}
                      </span>
                      <span className="font-bold">{optionText}</span>
                    </div>

                    {isAnswered && isSelected && (
                      competition.hideAnswersUntilEnd ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700">
                          <Check className="w-4 h-4 text-teal-600" />
                          <span>تم تسجيل اختيارك</span>
                        </span>
                      ) : (
                        optIdx === currentQ.correctIndex ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        )
                      )
                    )}
                  </button>
                );
              })}
            </div>

            {/* Explanation card after answering (only shown if hideAnswersUntilEnd is false) */}
            {isAnswered && currentQ.explanation && !competition.hideAnswersUntilEnd && (
              <div className="p-3.5 bg-teal-50/60 border border-teal-200/80 rounded-2xl text-xs text-teal-950 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-teal-800">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>معلومة إثرائية وتفسير:</span>
                </div>
                <p className="text-slate-700">{currentQ.explanation}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. CELEBRATION & COMPLETION SCREEN */}
      {stage === 'completed' && finalResult && (() => {
        const isCompetitionEnded = competition ? (competition.status === 'ended' || Date.now() >= new Date(competition.endTime).getTime()) : true;
        const shouldMaskResults = Boolean(competition?.hideAnswersUntilEnd && !isCompetitionEnded);

        return (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 text-center shadow-xl space-y-6 animate-in fade-in">
            
            {shouldMaskResults ? (
              /* Confidential / Masked Mode Until End Time */
              <div className="space-y-5">
                <div className="w-20 h-20 rounded-full bg-teal-50 border-2 border-teal-200 text-teal-600 flex items-center justify-center mx-auto shadow-sm">
                  <ShieldCheck className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-black text-teal-700 uppercase tracking-wider">
                    تم استلام وحفظ إجاباتك بنجاح ✓
                  </div>
                  <h1 className="text-2xl font-black text-slate-900">
                    أحسنت يا {finalResult.name}!
                  </h1>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    لقد أتممت الإجابة على جميع أسئلة المسابقة ({finalResult.totalQuestions} أسئلة) وتم تدوين وقتك بدقة.
                  </p>
                </div>

                {/* Confidential Policy Card */}
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl text-right space-y-3">
                  <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>ضوابط إعلان النتائج الموحدة (حجب الإجابات حتى النهاية)</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    حرصاً على مبدأ العدالة والنزاهة وتكافؤ الفرص بين كافة الطلاب المتسابقين، <strong>تُعلن النتائج الرسمية، والإجابات الصحيحة وشروحاتها، ولوحة شرف الأوائل، وشهادات التكريم</strong> فور انتهاء موعد المسابقة الرسمي:
                  </p>
                  
                  <div className="p-4 bg-white border border-teal-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-500 font-bold">موعد إعلان النتائج والإجابات</div>
                      <div className="text-sm font-black text-teal-800 mt-0.5">
                        {new Date(competition.endTime).toLocaleDateString('ar-SA')} الساعة {new Date(competition.endTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-teal-50 text-teal-800 text-xs font-bold rounded-full border border-teal-200">
                      محفوظة ومؤمنة
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    * يمكنك العودة إلى هذا الرابط فور حلول موعد النهاية للاطلاع على نتيجتك التفصيلية وتحميل شهادة التكريم الرسمية.
                  </p>
                </div>

                <div className="pt-2 flex justify-center">
                  <button
                    onClick={onBackToHome}
                    className="px-8 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    العودة لصفحة المسابقات
                  </button>
                </div>
              </div>
            ) : (
              /* Full Results & Review Mode (When competition ended or open practice) */
              <>
                <div className="w-20 h-20 rounded-full bg-amber-50 border-2 border-amber-200 text-amber-500 flex items-center justify-center mx-auto shadow-md">
                  <Trophy className="w-10 h-10" />
                </div>

                <div className="space-y-1">
                  <div className="text-xs font-extrabold text-teal-700 uppercase tracking-wider">
                    اكتملت المسابقة وأعلنت النتائج!
                  </div>
                  <h1 className="text-2xl font-black text-slate-900">
                    مبارك، يا {finalResult.name}!
                  </h1>
                  <p className="text-xs text-slate-500">
                    لقد أنهيت جميع أسئلة المسابقة بأداء متميز.
                  </p>
                </div>

                {/* Results Metric Card */}
                <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center">
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold">الدرجة المحققة</div>
                    <div className="text-xl font-black text-emerald-700 mt-0.5">{finalResult.score}</div>
                  </div>
                  <div className="border-x border-slate-200">
                    <div className="text-[10px] text-slate-500 font-bold">الإجابات الصحيحة</div>
                    <div className="text-xl font-black text-slate-900 mt-0.5">
                      {finalResult.correctAnswers} / {finalResult.totalQuestions}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 font-bold">الوقت المستغرق</div>
                    <div className="text-xl font-black text-slate-900 mt-0.5">{finalResult.totalTimeSeconds.toFixed(1)}ث</div>
                  </div>
                </div>

                {/* If team mode, show team badge */}
                {finalResult.teamName && (
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-sky-900 font-black">
                      <Users className="w-4 h-4 text-sky-600" />
                      <span>فريقك: {finalResult.teamName}</span>
                    </div>
                    <span className="text-sky-700 font-bold text-[11px]">
                      تم ضم درجتك ({finalResult.score} نقطة) لمجموع الفريق!
                    </span>
                  </div>
                )}

                {/* The Point of Pride: Certificate Button */}
                {competition.certificateEnabled && (
                  <div className="p-6 bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/15 rounded-3xl border-2 border-amber-400/80 space-y-3 shadow-md">
                    <div className="flex items-center justify-center gap-2 text-amber-950 font-black text-base">
                      <Award className="w-6 h-6 text-amber-600" />
                      <span>شهادة التكريم والتميز الرقمية جاهزة!</span>
                    </div>
                    <p className="text-xs text-amber-900 max-w-md mx-auto leading-relaxed">
                      شهادتك المعتمدة باسم المعلم والصرح التعليمي وموثقة بكود تحقق رسمي جاهزة للمعاينة الفورية والطباعة بدقة A4 Landscape.
                    </p>
                    <button
                      onClick={() => setIsCertModalOpen(true)}
                      className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs sm:text-sm rounded-2xl shadow-lg shadow-amber-950/30 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-2 mx-auto"
                    >
                      <Award className="w-5 h-5" />
                      <span>عرض وتحميل شهادة التكريم (A4 PDF)</span>
                    </button>
                  </div>
                )}

                {/* Educational Answer Review Accordion / List */}
                <div className="text-right space-y-3 pt-2">
                  <h3 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>مراجعة الأسئلة والشروحات التعليمية ({competition.questions.length} أسئلة)</span>
                  </h3>

                  <div className="space-y-3">
                    {competition.questions.map((q, qIndex) => {
                      const ans = finalResult.answers?.find(a => a.questionId === q.id);
                      const isCorrect = ans?.isCorrect ?? false;
                      const studentChoice = ans?.selectedIndex ?? -1;

                      return (
                        <div 
                          key={q.id}
                          className={`p-4 rounded-2xl border text-xs text-right space-y-2 ${
                            isCorrect 
                              ? 'bg-emerald-50/50 border-emerald-200' 
                              : 'bg-rose-50/40 border-rose-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-black text-slate-900">
                              {qIndex + 1}. {q.text}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                              isCorrect ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              {isCorrect ? '✓ إجابة صحيحة' : '✗ إجابة غير دقيقة'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                            <div className="text-slate-600">
                              إجابتك: <strong className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                                {studentChoice >= 0 ? q.options[studentChoice] : 'انتهى الوقت'}
                              </strong>
                            </div>
                            {!isCorrect && (
                              <div className="text-emerald-800 font-bold">
                                الإجابة الصحيحة: {q.options[q.correctIndex]}
                              </div>
                            )}
                          </div>

                          {q.explanation && (
                            <div className="text-[11px] text-slate-600 bg-white/70 p-2.5 rounded-xl border border-slate-200/60 mt-1">
                              <span className="font-bold text-slate-800">الشرح التعليمي: </span>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100">
                  <button
                    onClick={onBackToHome}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs cursor-pointer transition-colors"
                  >
                    العودة للمسابقات العامة
                  </button>
                  {!competition.singleAttempt && (
                    <button
                      onClick={() => {
                        setStage('welcome');
                        setStudentName('');
                      }}
                      className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-bold text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>إعادة المحاولة أو تدريب إضافي</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })()}

      {/* Certificate Modal */}
      {competition && finalResult && (
        <CertificateModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          studentName={finalResult.name}
          teacherName={competition.teacherDisplayName}
          schoolName={finalResult.school || competition.schoolName}
          competitionTitle={competition.name}
          score={finalResult.score}
          rank={1}
          isManual={false}
        />
      )}
    </div>
  );
};
