import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  AlertCircle, 
  Clock, 
  Award, 
  Users, 
  User, 
  X, 
  Layers, 
  Edit3,
  Bot,
  Radio,
  Calendar,
  Lock,
  EyeOff,
  Timer,
  ArrowRight,
  ArrowLeft,
  School,
  Check,
  Zap,
  BookOpen
} from 'lucide-react';
import { Competition, Question, QuestionType, ParticipationType, AccessCode, CompetitionType } from '../types';
import { AIService } from '../services/aiService';

interface CompetitionBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (competition: Competition) => void;
  currentTeacher: AccessCode | null;
  isAdmin?: boolean;
  editingCompetition?: Competition | null;
}

export const CompetitionBuilderModal: React.FC<CompetitionBuilderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentTeacher,
  isAdmin = false,
  editingCompetition,
}) => {
  // Wizard current step: 1: Type & Settings, 2: Questions & AI, 3: Review & Publish
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [name, setName] = useState(editingCompetition?.name || '');
  const [description, setDescription] = useState(editingCompetition?.description || '');
  const [webSlug, setWebSlug] = useState(editingCompetition?.webSlug || `comp-${Date.now().toString().slice(-5)}`);
  const [source, setSource] = useState<'platform' | 'teacher'>(editingCompetition?.source || (isAdmin ? 'platform' : 'teacher'));
  const [competitionType, setCompetitionType] = useState<CompetitionType>(editingCompetition?.competitionType || 'windowed');
  const [questionType, setQuestionType] = useState<QuestionType>(editingCompetition?.questionType || 'manual');
  const [participationType, setParticipationType] = useState<ParticipationType>(editingCompetition?.participationType || 'individual');
  const [examDurationMinutes, setExamDurationMinutes] = useState(editingCompetition?.examDurationMinutes || 20);
  const [questionDuration, setQuestionDuration] = useState(editingCompetition?.questionDuration || 30);
  const [winnersCount, setWinnersCount] = useState(editingCompetition?.winnersCount || 3);
  const [rewardType, setRewardType] = useState(editingCompetition?.rewardType || 'شهادة شكر وتقدير رسمية');
  const [certificateEnabled, setCertificateEnabled] = useState(editingCompetition?.certificateEnabled ?? true);
  const [singleAttempt, setSingleAttempt] = useState(editingCompetition?.singleAttempt ?? true);
  const [hideAnswersUntilEnd, setHideAnswersUntilEnd] = useState(editingCompetition?.hideAnswersUntilEnd ?? true);
  
  // Format current ISO local string
  const getTodayAtTime = (hours: number, minutes: number = 0) => {
    const d = new Date();
    d.setHours(hours, minutes, 0, 0);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  const [startTime, setStartTime] = useState(
    editingCompetition?.startTime || getTodayAtTime(15, 0)
  );
  const [endTime, setEndTime] = useState(
    editingCompetition?.endTime || new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 16)
  );

  // Adjust timing and rules when competition type changes
  const handleCompetitionTypeSelect = (type: CompetitionType) => {
    setCompetitionType(type);
    if (type === 'live') {
      const st = startTime || getTodayAtTime(15, 0);
      setStartTime(st);
      const startMs = new Date(st).getTime();
      const endMs = startMs + (examDurationMinutes || 20) * 60 * 1000;
      const offset = new Date().getTimezoneOffset() * 60000;
      setEndTime(new Date(endMs - offset).toISOString().slice(0, 16));
      setSingleAttempt(true);
      setHideAnswersUntilEnd(true);
    } else if (type === 'windowed') {
      setSingleAttempt(true);
      setHideAnswersUntilEnd(true);
      const offset = new Date().getTimezoneOffset() * 60000;
      setEndTime(new Date(Date.now() + 3 * 86400000 - offset).toISOString().slice(0, 16));
    } else {
      setSingleAttempt(false);
      setHideAnswersUntilEnd(false);
    }
  };

  // Questions State
  const [questions, setQuestions] = useState<Question[]>(
    editingCompetition?.questions || [
      {
        id: `q-${Date.now()}-1`,
        text: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        duration: 30,
        explanation: ''
      }
    ]
  );

  // AI Generator Panel state
  const [aiTopic, setAiTopic] = useState('');
  const [aiCategory, setAiCategory] = useState('العلوم العامة');
  const [aiDifficulty, setAiDifficulty] = useState<'سهل' | 'متوسط' | 'متقدم'>('متوسط');
  const [aiCount, setAiCount] = useState(5);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [activeQuestionTab, setActiveQuestionTab] = useState<'ai' | 'manual'>('ai');

  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Add Question
  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        id: `q-${Date.now()}-${prev.length + 1}`,
        text: '',
        options: ['', '', '', ''],
        correctIndex: 0,
        duration: questionDuration,
        explanation: ''
      }
    ]);
  };

  // Remove Question
  const handleRemoveQuestion = (idx: number) => {
    if (questions.length <= 1) {
      setValidationError('يجب أن تحتوي المسابقة على سؤال واحد على الأقل.');
      return;
    }
    setQuestions(prev => prev.filter((_, i) => i !== idx));
  };

  // Update Question field
  const handleUpdateQuestion = (idx: number, field: keyof Question, value: any) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  // Update option text
  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    setQuestions(prev => {
      const copy = [...prev];
      const opts = [...copy[qIdx].options];
      opts[optIdx] = val;
      copy[qIdx].options = opts;
      return copy;
    });
  };

  // Handle AI generation
  const handleGenerateAI = async () => {
    if (!aiTopic.trim()) {
      setValidationError('يرجى كتابة موضوع المسابقة لتوليد الأسئلة بدقة.');
      return;
    }
    setValidationError(null);
    setIsGeneratingAI(true);

    try {
      const generated = await AIService.generateQuestions({
        topic: aiTopic,
        category: aiCategory,
        difficulty: aiDifficulty,
        count: aiCount,
        audience: 'students'
      });

      if (generated && generated.length > 0) {
        setQuestions(generated);
        setQuestionType('ai');
        if (!name) {
          setName(`تحدي ${aiTopic}`);
        }
        if (!description) {
          setDescription(`مسابقة ذكية في ${aiTopic} تم توليدها بالذكاء الاصطناعي لمراجعة وتعزيز الفهم.`);
        }
      }
    } catch (err: any) {
      setValidationError('حدث خطأ أثناء توليد الأسئلة، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Step 1 Validation
  const handleNextFromStep1 = () => {
    setValidationError(null);
    if (!name.trim()) {
      setValidationError('يرجى إدخال اسم المسابقة.');
      return;
    }
    if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
      setValidationError('تاريخ ووقت النهاية يجب أن يكون بعد تاريخ البداية.');
      return;
    }
    setCurrentStep(2);
  };

  // Step 2 Validation
  const handleNextFromStep2 = () => {
    setValidationError(null);
    if (questions.length === 0) {
      setValidationError('يرجى إضافة سؤال واحد على الأقل للمسابقة.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.text.trim()) {
        setValidationError(`السؤال رقم (${i + 1}) لا يحتوي على نص.`);
        return;
      }
      const validOptions = q.options.filter(o => o.trim().length > 0);
      if (validOptions.length < 2) {
        setValidationError(`السؤال رقم (${i + 1}) يجب أن يحتوي على خيارين على الأقل.`);
        return;
      }
    }
    setCurrentStep(3);
  };

  // Final Form Submit
  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanSlug = webSlug.trim().toLowerCase().replace(/[\s\/#?]+/g, '-');
    const teacherName = currentTeacher?.teacherDisplayName || (isAdmin ? 'إدارة المنصة التعليمية' : 'المعلم المشرف');
    const school = currentTeacher?.school || (isAdmin ? 'المنصة التعليمية المركزية' : 'المملكة العربية السعودية');

    const newComp: Competition = {
      id: editingCompetition?.id || `comp-${Date.now()}`,
      webSlug: cleanSlug || `comp-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      description: description.trim(),
      source,
      teacherCodeId: source === 'teacher' ? currentTeacher?.code : undefined,
      teacherDisplayName: teacherName,
      schoolName: school,
      questionType,
      participationType,
      competitionType,
      examDurationMinutes: Number(examDurationMinutes) || 20,
      startTime,
      endTime,
      singleAttempt,
      hideAnswersUntilEnd,
      questionDuration: Number(questionDuration),
      winnersCount: Number(winnersCount),
      rewardType: rewardType.trim(),
      certificateEnabled,
      status: 'active',
      questions,
      createdAt: editingCompetition?.createdAt || new Date().toISOString(),
      antiCheatEnabled: true,
      showLeaderboardToStudents: true
    };

    onSave(newComp);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150 text-slate-900 dark:text-slate-100">
        
        {/* Header with Close */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/80 border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                {editingCompetition ? 'تعديل المسابقة' : 'إنشاء مسابقة جديدة'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                معالج إنشاء المسابقات المدرسية الذكية في 3 خطوات
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Stepper Bar */}
        <div className="py-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between max-w-xl mx-auto">
            
            {/* Step 1 */}
            <div 
              onClick={() => setCurrentStep(1)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                currentStep === 1 
                  ? 'bg-teal-700 text-white shadow-md ring-4 ring-teal-100 dark:ring-teal-950' 
                  : currentStep > 1 
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {currentStep > 1 ? <Check className="w-4 h-4" /> : '1'}
              </div>
              <div className="hidden sm:block text-right">
                <span className={`text-xs font-bold block ${currentStep === 1 ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  النوع والوقت
                </span>
                <span className="text-[10px] text-slate-400">إعدادات الامتحان</span>
              </div>
            </div>

            <div className={`flex-1 h-0.5 mx-3 ${currentStep >= 2 ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-800'}`} />

            {/* Step 2 */}
            <div 
              onClick={() => currentStep > 1 && setCurrentStep(2)}
              className={`flex items-center gap-2 ${currentStep >= 2 ? 'cursor-pointer' : 'opacity-60'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                currentStep === 2 
                  ? 'bg-teal-700 text-white shadow-md ring-4 ring-teal-100 dark:ring-teal-950' 
                  : currentStep > 2 
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {currentStep > 2 ? <Check className="w-4 h-4" /> : '2'}
              </div>
              <div className="hidden sm:block text-right">
                <span className={`text-xs font-bold block ${currentStep === 2 ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  بنك الأسئلة والذكاء
                </span>
                <span className="text-[10px] text-slate-400">{questions.length} أسئلة</span>
              </div>
            </div>

            <div className={`flex-1 h-0.5 mx-3 ${currentStep === 3 ? 'bg-teal-600' : 'bg-slate-200 dark:bg-slate-800'}`} />

            {/* Step 3 */}
            <div 
              onClick={() => currentStep === 3 && setCurrentStep(3)}
              className={`flex items-center gap-2 ${currentStep === 3 ? 'cursor-pointer' : 'opacity-60'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                currentStep === 3 
                  ? 'bg-teal-700 text-white shadow-md ring-4 ring-teal-100 dark:ring-teal-950' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                3
              </div>
              <div className="hidden sm:block text-right">
                <span className={`text-xs font-bold block ${currentStep === 3 ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500 dark:text-slate-400'}`}>
                  المراجعة والنشر
                </span>
                <span className="text-[10px] text-slate-400">تأكيد الإطلاق</span>
              </div>
            </div>

          </div>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="my-4 p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded-2xl flex items-center gap-2 text-xs font-bold text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 1: TYPE & TIMING SETTINGS                                 */}
        {/* ============================================================== */}
        {currentStep === 1 && (
          <div className="py-6 space-y-6 animate-in fade-in duration-150">
            
            {/* 3 Competition Types Selector */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                حدد نوع المسابقة:
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* 1. Direct Live Competition */}
                <div
                  onClick={() => handleCompetitionTypeSelect('live')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
                    competitionType === 'live'
                      ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/30 text-rose-950 dark:text-rose-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300">
                        <Radio className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full">
                        مباشرة متزامنة
                      </span>
                    </div>
                    <h4 className="font-black text-sm">مسابقة مباشرة</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      موعد محدد (مثلاً الساعة 3:00) وتنتهي بانتهاء مدة الامتحان المحددة فوراً.
                    </p>
                  </div>
                  <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                    <Timer className="w-3.5 h-3.5" />
                    <span>مدة محددة للامتحان</span>
                  </div>
                </div>

                {/* 2. Windowed Competition */}
                <div
                  onClick={() => handleCompetitionTypeSelect('windowed')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
                    competitionType === 'windowed'
                      ? 'border-teal-600 bg-teal-50/40 dark:bg-teal-950/30 text-teal-950 dark:text-teal-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="p-2 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-600 dark:text-teal-300">
                        <Calendar className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-black bg-teal-600 text-white px-2 py-0.5 rounded-full">
                        نافذة زمنية
                      </span>
                    </div>
                    <h4 className="font-black text-sm">مسابقة بمدة محددة</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      تفتح في ساعة وتغلق في موعد محدد (ساعات أو أيام). محاولة واحدة وإعلان النتائج عند الإغلاق.
                    </p>
                  </div>
                  <div className="text-[10px] font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>محاولة واحدة + حجب الحلول</span>
                  </div>
                </div>

                {/* 3. Open Practice */}
                <div
                  onClick={() => handleCompetitionTypeSelect('open')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between space-y-3 ${
                    competitionType === 'open'
                      ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-800/60'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300">
                        <Zap className="w-4 h-4" />
                      </span>
                      <span className="text-[10px] font-black bg-amber-600 text-white px-2 py-0.5 rounded-full">
                        تدريب مفتوح
                      </span>
                    </div>
                    <h4 className="font-black text-sm">مسابقة مفتوحة</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      متاحة باستمرار بدون قيود، للتجربة والتعلم الذاتي مع إظهار الإجابات الفورية.
                    </p>
                  </div>
                  <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>نتائج فورية وشهادات سريعة</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Info Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  اسم المسابقة *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أولمبياد العلوم للمرحلة المتوسطة"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 focus:ring-teal-600/30"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  المدرسة أو الجهة المنظمة
                </label>
                <input
                  type="text"
                  value={currentTeacher?.school || 'مدارس التعليم العام'}
                  readOnly
                  className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-500 font-bold"
                />
              </div>
            </div>

            {/* Time Controls */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>إعدادات التوقيت والمواعيد</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    {competitionType === 'live' ? 'موعد بدء المسابقة المباشرة' : 'تاريخ ووقت فتح المسابقة'}
                  </label>
                  <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    {competitionType === 'live' ? 'موعد إغلاق المسابقة' : 'تاريخ ووقت انتهاء المسابقة'}
                  </label>
                  <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {competitionType === 'live' && (
                <div className="pt-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                    مدة الامتحان الإجمالية للطالب (بالدقائق):
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={examDurationMinutes}
                      onChange={(e) => setExamDurationMinutes(Number(e.target.value))}
                      className="w-28 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-center"
                    />
                    <span className="text-xs text-slate-500">دقيقة (تغلق المسابقة فوراً بعد انتهاء هذه المدة)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Strict Exam Rules Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={singleAttempt}
                  onChange={(e) => setSingleAttempt(e.target.checked)}
                  className="rounded text-teal-600 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold block">محاولة واحدة للطالب</span>
                  <span className="text-[10px] text-slate-400">منع تكرار المحاولات لنفس الطالب</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hideAnswersUntilEnd}
                  onChange={(e) => setHideAnswersUntilEnd(e.target.checked)}
                  className="rounded text-teal-600 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold block">حجب الإجابات الصحيحة</span>
                  <span className="text-[10px] text-slate-400">تظهر فقط عند نهاية المسابقة</span>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={certificateEnabled}
                  onChange={(e) => setCertificateEnabled(e.target.checked)}
                  className="rounded text-teal-600 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold block">شهادة إلكترونية معتمدة</span>
                  <span className="text-[10px] text-slate-400">تمنح للطالب المتفوق برمز فحص QR</span>
                </div>
              </label>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: QUESTIONS & AI GENERATION                             */}
        {/* ============================================================== */}
        {currentStep === 2 && (
          <div className="py-6 space-y-6 animate-in fade-in duration-150">
            
            {/* Tabs: AI Smart Generator vs Manual Question Builder */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveQuestionTab('ai')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeQuestionTab === 'ai'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Bot className="w-4 h-4 text-amber-300" />
                  <span>توليد ذكي بالذكاء الاصطناعي (Gemini)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveQuestionTab('manual')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeQuestionTab === 'manual'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Edit3 className="w-4 h-4" />
                  <span>إدخال الأسئلة يدوياً</span>
                </button>
              </div>

              <span className="text-xs font-bold text-slate-500">
                إجمالي الأسئلة المضافة: <strong className="text-teal-700 dark:text-teal-400 font-black">{questions.length}</strong>
              </span>
            </div>

            {/* AI Generator Panel */}
            {activeQuestionTab === 'ai' && (
              <div className="bg-gradient-to-br from-teal-50/60 to-emerald-50/40 dark:from-slate-800/80 dark:to-teal-950/40 border border-teal-200/80 dark:border-teal-800/80 p-5 rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500 animate-spin-slow" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      مساعد الذكاء الاصطناعي لإنشاء أسئلة المناهج
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 bg-teal-100 dark:bg-teal-900/60 px-2.5 py-0.5 rounded-full">
                    نموذج تعليمي متقدم
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      موضوع المسابقة أو الدرس:
                    </label>
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="مثال: دورة الماء في الطبيعة، أو قواعد كان وأخواتها"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      التصنيف:
                    </label>
                    <select
                      value={aiCategory}
                      onChange={(e) => setAiCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-bold"
                    >
                      <option value="العلوم العامة">العلوم العامة</option>
                      <option value="الرياضيات">الرياضيات</option>
                      <option value="اللغة العربية">اللغة العربية</option>
                      <option value="التقنية والذكاء الاصطناعي">التقنية والذكاء الاصطناعي</option>
                      <option value="الثقافة الوطنية والتاريخ">الثقافة الوطنية والتاريخ</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      عدد الأسئلة:
                    </label>
                    <select
                      value={aiCount}
                      onChange={(e) => setAiCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-teal-200 dark:border-teal-800 rounded-xl text-xs font-bold"
                    >
                      <option value={3}>3 أسئلة</option>
                      <option value={5}>5 أسئلة (موصى به)</option>
                      <option value={10}>10 أسئلة</option>
                    </select>
                  </div>
                </div>

                {/* Quick Topic Chips */}
                <div className="flex items-center gap-1.5 flex-wrap text-xs pt-1">
                  <span className="text-[11px] text-slate-500 font-bold">مواضيع مقترحة:</span>
                  {[
                    'الذكاء الاصطناعي ورؤية 2030',
                    'الجهاز الدوري في جسم الإنسان',
                    'المعادلات الخطية والهندسة',
                    'كان وأخواتها في النحو',
                    'تاريخ المملكة وتأسيسها'
                  ].map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setAiTopic(topic)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-teal-200 dark:border-teal-800 rounded-lg text-[10px] font-bold text-teal-800 dark:text-teal-300 hover:bg-teal-50 cursor-pointer transition-colors"
                    >
                      {topic}
                    </button>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    disabled={isGeneratingAI}
                    onClick={handleGenerateAI}
                    className="w-full py-2.5 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{isGeneratingAI ? 'جارٍ توليد الأسئلة والخيارات والحلول...' : 'توليد الأسئلة فورياً بالذكاء الاصطناعي'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Questions List & Editor */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
              {questions.map((q, qIdx) => (
                <div 
                  key={q.id || qIdx}
                  className="bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3 relative shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 flex items-center justify-center text-[10px]">
                        {qIdx + 1}
                      </span>
                      <span>السؤال {qIdx + 1}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 p-1 cursor-pointer transition-colors"
                      title="حذف هذا السؤال"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Question Text */}
                  <input
                    type="text"
                    value={q.text}
                    onChange={(e) => handleUpdateQuestion(qIdx, 'text', e.target.value)}
                    placeholder="اكتب نص السؤال هنا..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
                  />

                  {/* 4 Options with Radio */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {q.options.map((opt, optIdx) => (
                      <div 
                        key={optIdx}
                        className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                          q.correctIndex === optIdx
                            ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40'
                            : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`correct-${qIdx}`}
                          checked={q.correctIndex === optIdx}
                          onChange={() => handleUpdateQuestion(qIdx, 'correctIndex', optIdx)}
                          className="text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                          placeholder={`الخيار ${optIdx + 1}`}
                          className="flex-1 bg-transparent border-none text-xs font-bold focus:outline-none"
                        />
                        {q.correctIndex === optIdx && (
                          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                            صحيح ✓
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddQuestion}
                className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-teal-500 text-slate-600 dark:text-slate-400 hover:text-teal-700 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>إضافة سؤال جديد يدوياً</span>
              </button>
            </div>

          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 3: REVIEW & PUBLISH CONFIRMATION                          */}
        {/* ============================================================== */}
        {currentStep === 3 && (
          <div className="py-6 space-y-6 animate-in fade-in duration-150">
            
            {/* Summary Card */}
            <div className="bg-slate-50 dark:bg-slate-800/70 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    competitionType === 'live' 
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                      : competitionType === 'windowed'
                      ? 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                  }`}>
                    {competitionType === 'live' ? '🔴 مسابقة مباشرة' : competitionType === 'windowed' ? '📅 مسابقة بنافذة زمنية' : '⚡ تدريب مفتوح'}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
                    {name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    الرابط المباشر للمسابقة: <code className="font-mono text-teal-700 dark:text-teal-400 font-bold">?quiz={webSlug}</code>
                  </p>
                </div>

                <div className="text-center p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <span className="text-xl font-black text-teal-700 dark:text-teal-400 block">{questions.length}</span>
                  <span className="text-[10px] text-slate-400 font-bold">أسئلة</span>
                </div>
              </div>

              {/* Rules Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>الموعد: {new Date(startTime).toLocaleDateString('ar-SA')} ({new Date(startTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })})</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    {competitionType === 'live' 
                      ? `مدة الامتحان المباشر: ${examDurationMinutes} دقيقة` 
                      : `نهاية الموعد: ${new Date(endTime).toLocaleDateString('ar-SA')}`}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{singleAttempt ? 'محاولة واحدة فقط لكل طالب' : 'محاولات متعددة مسموحة'}</span>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{certificateEnabled ? 'شهادة إلكترونية معتمدة للمتفوقين' : 'بدون شهادات'}</span>
                </div>
              </div>
            </div>

            {/* Questions Quick Preview Accordion */}
            <div className="space-y-2">
              <span className="text-xs font-black text-slate-800 dark:text-slate-200 block">
                معاينة بنك الأسئلة قبل النشر ({questions.length}):
              </span>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                {questions.map((q, idx) => (
                  <div key={idx} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white">س{idx + 1}: {q.text}</span>
                    <span className="block text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-bold">
                      الإجابة الصحيحة: {q.options[q.correctIndex]}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Wizard Footer Controls */}
        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-5 mt-2">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-xs cursor-pointer flex items-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span>الخطوة السابقة</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-bold text-xs cursor-pointer"
            >
              إلغاء
            </button>
          )}

          {currentStep < 3 ? (
            <button
              type="button"
              onClick={currentStep === 1 ? handleNextFromStep1 : handleNextFromStep2}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs cursor-pointer shadow-md flex items-center gap-2"
            >
              <span>الخطوة التالية</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="px-8 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-black text-xs cursor-pointer shadow-lg shadow-teal-700/20 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>حفظ ونشر المسابقة الآن</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
