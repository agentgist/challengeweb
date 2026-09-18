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
  Timer
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
    // Adjust to local ISO string
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  const [startTime, setStartTime] = useState(
    editingCompetition?.startTime || getTodayAtTime(15, 0)
  );
  const [endTime, setEndTime] = useState(
    editingCompetition?.endTime || new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 16)
  );

  // When competitionType changes, adjust reasonable defaults
  const handleCompetitionTypeSelect = (type: CompetitionType) => {
    setCompetitionType(type);
    if (type === 'live') {
      // Direct live competition starting at specific time (e.g. 3:00 PM) and ends after exam duration
      const st = startTime || getTodayAtTime(15, 0);
      setStartTime(st);
      const startMs = new Date(st).getTime();
      const endMs = startMs + (examDurationMinutes || 20) * 60 * 1000;
      const offset = new Date().getTimezoneOffset() * 60000;
      setEndTime(new Date(endMs - offset).toISOString().slice(0, 16));
      setSingleAttempt(true);
      setHideAnswersUntilEnd(true);
    } else if (type === 'windowed') {
      // Open for a window (e.g. 3 days), 1 attempt per student, hide answers until window ends
      setSingleAttempt(true);
      setHideAnswersUntilEnd(true);
      const offset = new Date().getTimezoneOffset() * 60000;
      setEndTime(new Date(Date.now() + 3 * 86400000 - offset).toISOString().slice(0, 16));
    } else {
      // Open practice
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
  const [aiReviewNotice, setAiReviewNotice] = useState(false);

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
      alert('يجب أن تحتوي المسابقة على سؤال واحد على الأقل.');
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
        setAiReviewNotice(true);
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

  // Form Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!name.trim()) {
      setValidationError('يرجى إدخال اسم المسابقة.');
      return;
    }

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

    if (new Date(endTime).getTime() <= new Date(startTime).getTime()) {
      setValidationError('تاريخ ووقت النهاية يجب أن يكون بعد تاريخ البداية.');
      return;
    }

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
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-4xl w-full p-6 sm:p-8 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                {editingCompetition ? 'تعديل المسابقة' : 'بناء مسابقة تعليمية جديدة'}
              </h2>
              <p className="text-xs text-slate-500">
                خصص بيانات المسابقة، مصدر الأسئلة، ونمط المشاركة (فردي / فرق)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {validationError && (
          <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{validationError}</span>
          </div>
        )}

        {/* AI Review Notice banner */}
        {aiReviewNotice && (
          <div className="mb-5 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl text-xs text-amber-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>تم توليد الأسئلة بالذكاء الاصطناعي بنجاح!</strong> يمكنك الآن مراجعة نص كل سؤال والإجابة الصحيحة أدناه والضغط على زر الحفظ للاعتماد.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setAiReviewNotice(false)}
              className="text-amber-800 text-[11px] font-bold underline cursor-pointer"
            >
              تمت المراجعة
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section 0: Competition Type Selector (User Requirement #1) */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="text-xs font-black text-slate-900 block">
                  نوع ونظام المسابقة ومواعيدها *
                </label>
                <p className="text-[11px] text-slate-500">
                  اختر نمط جدولة المسابقة وشروط الإعلان والمشاركة
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                محدد بدقة
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Option 1: Live */}
              <div
                onClick={() => handleCompetitionTypeSelect('live')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  competitionType === 'live'
                    ? 'bg-white border-rose-500 shadow-sm ring-2 ring-rose-500/20'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-rose-700">
                    <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
                    مسابقة مباشرة
                  </span>
                  <input
                    type="radio"
                    name="compType"
                    checked={competitionType === 'live'}
                    onChange={() => handleCompetitionTypeSelect('live')}
                    className="accent-rose-600 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                  تبدأ في موعد محدد (مثل الساعة 3:00 تماماً) وتنتهي بانتهاء مدة الامتحان المحددة لجميع الطلاب سوياً.
                </p>
                <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 font-bold">
                  <span className="px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded-md">محاولة واحدة</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">النتائج بعد النهاية</span>
                </div>
              </div>

              {/* Option 2: Windowed */}
              <div
                onClick={() => handleCompetitionTypeSelect('windowed')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  competitionType === 'windowed'
                    ? 'bg-white border-teal-600 shadow-sm ring-2 ring-teal-600/20'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-teal-800">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    بفترة زمنية محددة
                  </span>
                  <input
                    type="radio"
                    name="compType"
                    checked={competitionType === 'windowed'}
                    onChange={() => handleCompetitionTypeSelect('windowed')}
                    className="accent-teal-600 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                  تفتح وتغلق في موعد محدد (ساعات أو أيام)، ويسمح للطالب بالدخول والمشاركة لمرة واحدة فقط خلالها.
                </p>
                <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 font-bold">
                  <span className="px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded-md">محاولة واحدة</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">حجب الإجابات حتى الإغلاق</span>
                </div>
              </div>

              {/* Option 3: Open Practice */}
              <div
                onClick={() => handleCompetitionTypeSelect('open')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                  competitionType === 'open'
                    ? 'bg-white border-slate-800 shadow-sm ring-2 ring-slate-800/20'
                    : 'bg-white/80 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-900">
                    <Timer className="w-3.5 h-3.5 text-slate-700" />
                    تدريب مفتوح فوري
                  </span>
                  <input
                    type="radio"
                    name="compType"
                    checked={competitionType === 'open'}
                    onChange={() => handleCompetitionTypeSelect('open')}
                    className="accent-slate-900 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed mb-2">
                  مفتوحة ومتاحة في أي وقت للتدريب الذاتي، تظهر النتيجة والإجابات الصحيحة وشروحاتها فور الانتهاء.
                </p>
                <div className="flex flex-wrap gap-1 text-[10px] text-slate-500 font-bold">
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">محاولات متعددة</span>
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-md">إظهار الإجابات فوراً</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Classification & Dimensions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            {/* Dimension 1: Source */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                1. جهة المسابقة
              </label>
              {isAdmin ? (
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-teal-600"
                >
                  <option value="platform">مسابقة منصة عامة (تظهر بالرئيسية)</option>
                  <option value="teacher">مسابقة معلم (خاصة بالطلاب)</option>
                </select>
              ) : (
                <div className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                  مسابقة معلم خاصة بطلابي
                </div>
              )}
            </div>

            {/* Dimension 2: Participation Mode */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                2. نمط المشاركة
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setParticipationType('individual')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    participationType === 'individual'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>فردية</span>
                </button>
                <button
                  type="button"
                  onClick={() => setParticipationType('team')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    participationType === 'team'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>فرق جماعية</span>
                </button>
              </div>
            </div>

            {/* Dimension 3: Question Source */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                3. مصدر الأسئلة
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuestionType('manual')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    questionType === 'manual'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>يدوي</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuestionType('ai')}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    questionType === 'ai'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>ذكاء اصطناعي</span>
                </button>
              </div>
            </div>
          </div>

          {/* AI Generator Box if Question Type is AI */}
          {questionType === 'ai' && (
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>محرك توليد الأسئلة الذكي (Gemini AI)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="موضوع المسابقة (مثال: أجهزة جسم الإنسان، علوم الفضاء، بايثون...)"
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-slate-800 focus:outline-amber-600"
                  />
                </div>
                <div>
                  <select
                    value={aiDifficulty}
                    onChange={(e) => setAiDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-slate-800 focus:outline-amber-600"
                  >
                    <option value="سهل">مستوى سهل</option>
                    <option value="متوسط">مستوى متوسط</option>
                    <option value="متقدم">مستوى متقدم</option>
                  </select>
                </div>
                <div>
                  <button
                    type="button"
                    disabled={isGeneratingAI}
                    onClick={handleGenerateAI}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isGeneratingAI ? 'جاري التوليد...' : 'توليد الأسئلة الآن'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section 2: General Details */}
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  اسم المسابقة *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أولمبياد الرياضيات والمنطق الرقمي"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-teal-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  الرابط المباشر للمسابقة (Slug)
                </label>
                <input
                  type="text"
                  required
                  value={webSlug}
                  onChange={(e) => setWebSlug(e.target.value)}
                  placeholder="مثال: math-olympiad-2026"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-teal-600 focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                الوصف والملاحظات التوجيهية للطلاب
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="اكتب نبذة موجزة ومحفزة تظهر للطلاب عند فتح رابط المسابقة..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-teal-600 focus:bg-white"
              />
            </div>

            {/* Dynamic Timing & Restrictions Section */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span className="text-xs font-black text-slate-900">
                    {competitionType === 'live' ? 'إعدادات توقيت المسابقة المباشرة والمدة' :
                     competitionType === 'windowed' ? 'إعدادات فترة فتح وإغلاق المسابقة ومدة الاختبار' :
                     'إعدادات التوقيت العام للمسابقة'}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  {competitionType === 'live' ? 'مباشرة في توقيت محدد' : competitionType === 'windowed' ? 'نافذة زمنية محددة' : 'مفتوحة'}
                </span>
              </div>

              {competitionType === 'live' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        موعد انطلاق المسابقة المباشرة *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={startTime}
                        onChange={(e) => {
                          setStartTime(e.target.value);
                          const startMs = new Date(e.target.value).getTime();
                          const endMs = startMs + (examDurationMinutes || 20) * 60 * 1000;
                          const offset = new Date().getTimezoneOffset() * 60000;
                          setEndTime(new Date(endMs - offset).toISOString().slice(0, 16));
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-rose-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">مثال: اليوم الساعة 3:00 عصراً</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        مدة الامتحان الكلية (بالدقائق) *
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={180}
                        required
                        value={examDurationMinutes}
                        onChange={(e) => {
                          const mins = Number(e.target.value);
                          setExamDurationMinutes(mins);
                          const startMs = new Date(startTime).getTime();
                          const endMs = startMs + mins * 60 * 1000;
                          const offset = new Date().getTimezoneOffset() * 60000;
                          setEndTime(new Date(endMs - offset).toISOString().slice(0, 16));
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-center focus:outline-rose-500"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">تنتهي المسابقة تلقائياً فور انقضاء هذه المدة</span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        مدة كل سؤال (ثواني)
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={120}
                        value={questionDuration}
                        onChange={(e) => setQuestionDuration(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-center"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">عداد الثواني المخصص لكل سؤال</span>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-900">
                    <Radio className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">نظام المسابقة المباشرة مفعل:</span>
                      <p className="text-[11px] text-rose-800 mt-0.5">
                        تبدأ المسابقة الساعة <strong>{new Date(startTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</strong> وتنتهي وتغلق تماماً بعد <strong>{examDurationMinutes} دقيقة</strong>. يسمح للطالب بمحاولة واحدة فقط، وتُعلن النتائج والإجابات الصحيحة للجميع فور انتهاء وقت المسابقة.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {competitionType === 'windowed' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        تاريخ ووقت فتح المسابقة *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-teal-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        تاريخ ووقت إغلاق المسابقة النهائي *
                      </label>
                      <input
                        type="datetime-local"
                        required
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-teal-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        مهلة الطالب عند البدء (دقائق)
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={180}
                        value={examDurationMinutes}
                        onChange={(e) => setExamDurationMinutes(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-center"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-start gap-2.5 text-xs text-teal-900">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">ضوابط المسابقة المحددة بوقت:</span>
                      <p className="text-[11px] text-teal-800 mt-0.5">
                        يسمح لكل طالب بمحاولة واحدة فقط أثناء فترة فتح المسابقة. لن تظهر الإجابات الصحيحة وشروحاتها للطلاب إلا بعد انتهاء تاريخ المسابقة رسمياً ({new Date(endTime).toLocaleDateString('ar-SA')}).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {competitionType === 'open' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      مدة السؤال (ثواني)
                    </label>
                    <input
                      type="number"
                      min={10}
                      max={120}
                      value={questionDuration}
                      onChange={(e) => setQuestionDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      مهلة المحاولة (دقائق)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={120}
                      value={examDurationMinutes}
                      onChange={(e) => setExamDurationMinutes(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      عدد الفائزين باللوحة
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={winnersCount}
                      onChange={(e) => setWinnersCount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-center"
                    />
                  </div>
                </div>
              )}

              {/* Guarantees checkboxes */}
              <div className="pt-2 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={singleAttempt}
                    onChange={(e) => setSingleAttempt(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded accent-teal-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">السماح للطالب بمحاولة واحدة فقط</span>
                    <span className="text-[10px] text-slate-500">منع إعادة الاختبار لنفس المتسابق</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideAnswersUntilEnd}
                    onChange={(e) => setHideAnswersUntilEnd(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded accent-teal-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">حجب الإجابات الصحيحة حتى انتهاء المسابقة</span>
                    <span className="text-[10px] text-slate-500">إعلان النتائج فقط عند انتهاء المسابقة رسمياً</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Reward & Certificate Toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان التكريم أو الجائزة
                </label>
                <input
                  type="text"
                  value={rewardType}
                  onChange={(e) => setRewardType(e.target.value)}
                  placeholder="مثال: وسام التفوق + شهادة شكر معتمدة"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <div className="text-xs font-bold text-slate-800">تفعيل شهادة التقدير الفورية</div>
                  <div className="text-[11px] text-slate-500">تمكين الطالب من تحميل شهادته فور الانتهاء</div>
                </div>
                <input
                  type="checkbox"
                  checked={certificateEnabled}
                  onChange={(e) => setCertificateEnabled(e.target.checked)}
                  className="w-5 h-5 text-teal-600 rounded cursor-pointer accent-teal-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Questions List (One click review & edit) */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">
                  قائمة الأسئلة ({questions.length})
                </span>
                {questionType === 'ai' && (
                  <span className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                    ✓ راجع وعدّل الإجابات قبل النشر
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة سؤال جديد</span>
              </button>
            </div>

            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {questions.map((q, qIndex) => (
                <div
                  key={q.id || qIndex}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black text-slate-700 bg-slate-200/80 px-2.5 py-1 rounded-lg">
                      السؤال #{qIndex + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={10}
                        max={120}
                        value={q.duration || questionDuration}
                        onChange={(e) => handleUpdateQuestion(qIndex, 'duration', Number(e.target.value))}
                        title="وقت السؤال بالثواني"
                        className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-center font-bold"
                      />
                      <span className="text-[11px] text-slate-500">ثانية</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(qIndex)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="حذف السؤال"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      required
                      value={q.text}
                      onChange={(e) => handleUpdateQuestion(qIndex, 'text', e.target.value)}
                      placeholder="اكتب نص السؤال هنا..."
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-teal-600"
                    />
                  </div>

                  {/* 4 Options with Radio to select correct answer */}
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold text-slate-600 mb-1">
                      حدد الخيار الصحيح بالنقر على الدائرة:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIndex) => (
                        <div
                          key={optIndex}
                          className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                            q.correctIndex === optIndex
                              ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-500/20'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`correct-${qIndex}`}
                            checked={q.correctIndex === optIndex}
                            onChange={() => handleUpdateQuestion(qIndex, 'correctIndex', optIndex)}
                            className="w-4 h-4 text-emerald-600 accent-emerald-600 cursor-pointer"
                          />
                          <input
                            type="text"
                            required
                            value={opt}
                            onChange={(e) => handleUpdateOption(qIndex, optIndex, e.target.value)}
                            placeholder={`الخيار ${optIndex + 1}`}
                            className="w-full bg-transparent text-xs font-medium text-slate-800 focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div>
                    <input
                      type="text"
                      value={q.explanation || ''}
                      onChange={(e) => handleUpdateQuestion(qIndex, 'explanation', e.target.value)}
                      placeholder="تفسير الإجابة الصحيحة (يظهر للطالب بعد الإجابة كفائدة إثرائية)..."
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-600 focus:outline-teal-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-7 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editingCompetition ? 'حفظ التعديلات' : 'نشر المسابقة الآن'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
