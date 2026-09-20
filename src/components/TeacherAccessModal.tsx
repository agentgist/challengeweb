import React, { useState, useEffect } from 'react';
import { KeyRound, ShieldAlert, CheckCircle2, User, School, ArrowRight, Lock, Sparkles, X } from 'lucide-react';
import { StorageService } from '../services/storageService';
import { AccessCode } from '../types';

interface TeacherAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (teacher: AccessCode) => void;
}

export const TeacherAccessModal: React.FC<TeacherAccessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState<'enter_code' | 'setup_profile'>('enter_code');
  const [codeStr, setCodeStr] = useState('');
  const [verifiedCodeObj, setVerifiedCodeObj] = useState<AccessCode | null>(null);

  // Profile setup for first-time use
  const [teacherName, setTeacherName] = useState('');
  const [schoolName, setSchoolName] = useState('');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [remainingLockSeconds, setRemainingLockSeconds] = useState<number>(0);

  // Check rate limit timer
  useEffect(() => {
    const rateState = StorageService.getRateLimitState();
    const now = Date.now();
    if (rateState.lockedUntil > now) {
      setRemainingLockSeconds(Math.ceil((rateState.lockedUntil - now) / 1000));
    }
  }, [isOpen]);

  useEffect(() => {
    if (remainingLockSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingLockSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingLockSeconds]);

  if (!isOpen) return null;

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (remainingLockSeconds > 0) {
      setErrorMsg(`النظام مجمد مؤقتاً لحمايته من المحاولات الآلية. يرجى الانتظار ${remainingLockSeconds} ثانية.`);
      return;
    }

    const res = StorageService.verifyAccessCode(codeStr);
    if (!res.valid || !res.codeObj) {
      if (res.isLocked && res.remainingSeconds) {
        setRemainingLockSeconds(res.remainingSeconds);
      }
      setErrorMsg(res.message);
      return;
    }

    setVerifiedCodeObj(res.codeObj);

    if (res.needsProfileSetup) {
      // First time use! Ask for display name and school
      setStep('setup_profile');
    } else {
      // Direct success
      StorageService.setLoggedTeacher(res.codeObj.code);
      onSuccess(res.codeObj);
      onClose();
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedCodeObj) return;

    if (!teacherName.trim()) {
      setErrorMsg('يرجى إدخال اسم المعلم كما ترغب أن يظهر في الشهادات.');
      return;
    }

    const updated = StorageService.updateTeacherProfile(
      verifiedCodeObj.code,
      teacherName,
      schoolName || 'المملكة العربية السعودية'
    );

    if (updated) {
      StorageService.setLoggedTeacher(updated.code);
      onSuccess(updated);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 sm:p-7 shadow-2xl relative text-right animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 left-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {step === 'enter_code' ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-xs">
                <KeyRound className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">دخول المعلم برمز الوصول</h2>
                <p className="text-xs text-slate-500">لا حاجة لتسجيل حساب أو كلمة مرور — رمزك يكفي!</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              أدخل رمز الوصول (Access Code) الخاص بك للبدء في بناء المسابقات ومتابعة تفاعل طلابك وطباعة شهادات التقدير فوراً.
            </p>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  رمز المعلم (Access Code)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    disabled={remainingLockSeconds > 0}
                    value={codeStr}
                    onChange={(e) => setCodeStr(e.target.value)}
                    placeholder="مثال: TCHR-7F2K9X"
                    className="w-full px-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-widest uppercase text-slate-900 focus:outline-teal-600 focus:bg-white transition-all disabled:opacity-50"
                  />
                  {remainingLockSeconds > 0 && (
                    <div className="absolute left-3 top-3 text-rose-500 flex items-center gap-1 text-xs font-bold">
                      <Lock className="w-4 h-4" />
                      <span>{remainingLockSeconds} ث</span>
                    </div>
                  )}
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 font-medium">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Sample Codes for quick evaluation */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>رموز جاهزة للتجربة الفورية:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCodeStr('TCHR-7F2K9X')}
                    className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-mono font-bold hover:border-teal-500 hover:text-teal-700 text-slate-800 cursor-pointer shadow-2xs"
                  >
                    TCHR-7F2K9X (أ. فهد)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeStr('TCHR-9M3L8Q')}
                    className="bg-white px-2 py-1 rounded-lg border border-slate-200 text-[11px] font-mono font-bold hover:border-teal-500 hover:text-teal-700 text-slate-800 cursor-pointer shadow-2xs"
                  >
                    TCHR-9M3L8Q (أ. نورة)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeStr('TCHR-NEW-2026')}
                    className="bg-amber-50 px-2 py-1 rounded-lg border border-amber-300 text-[11px] font-mono font-bold text-amber-900 hover:bg-amber-100 cursor-pointer shadow-2xs"
                    title="رمز جديد لتجربة شاشة أول استخدام"
                  >
                    TCHR-NEW-2026 (أول استخدام)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={remainingLockSeconds > 0}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>التحقق والدخول</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Step 2: First-time profile setup */
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">مرحباً بك لأول مرة!</h2>
                <p className="text-xs text-slate-500">تهيئة ملف المعلم المرتبط برمزك</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-5 bg-amber-50/60 p-3 rounded-xl border border-amber-200/80">
              يُرجى كتابة اسمك وصرحك التعليمي كما ترغب أن يظهرا لطلابك في شهادات التقدير وصفحات المسابقات. <strong className="text-slate-800">يُحفظ هذا تلقائياً ولن يُطلب منك مجدداً.</strong>
            </p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  اسم المعلم / المعلمة (كما سيظهر في الشهادة) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={teacherName}
                    onChange={(e) => setTeacherName(e.target.value)}
                    placeholder="مثال: أ. إبراهيم بن عبدالعزيز المحمد"
                    className="w-full pr-9 pl-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-teal-600 focus:bg-white transition-all"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  اسم المدرسة / الصرح التعليمي
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="مثال: ثانوية الملك فهد النموذجية"
                    className="w-full pr-9 pl-3.5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-teal-600 focus:bg-white transition-all"
                  />
                  <School className="w-4 h-4 text-slate-400 absolute right-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-md cursor-pointer transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>حفظ ومتابعة إلى لوحتي</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
