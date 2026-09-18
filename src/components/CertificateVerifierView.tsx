import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Search, 
  Award, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  Calendar, 
  School, 
  User, 
  Trophy, 
  Sparkles,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { VerificationRecord } from '../types';
import { CertificateModal } from './CertificateModal';

interface CertificateVerifierViewProps {
  onBackToHome: () => void;
  initialCode?: string;
}

export const CertificateVerifierView: React.FC<CertificateVerifierViewProps> = ({
  onBackToHome,
  initialCode = ''
}) => {
  const [queryCode, setQueryCode] = useState(initialCode);
  const [result, setResult] = useState<VerificationRecord | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);

  const handleVerify = (codeToSearch?: string) => {
    const target = (codeToSearch ?? queryCode).trim();
    if (!target) return;
    setHasSearched(true);
    const res = StorageService.verifyCertificate(target);
    setResult(res);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8" dir="rtl">
      
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 p-8 text-white shadow-xl border border-slate-800">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>بوابة التحقق الرقمي المعتمد للشهادات</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white">
            التحقق من صحة وموثوقية شهادات التميز
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            أدخل رمز التحقق المطبوع أسفل الشهادة للتأكد الفوري من بيانات الطالب، المسابقة، والصرح التعليمي المصدر للشهادة من سجلات المنصة الرسمية.
          </p>
        </div>
      </div>

      {/* Verification Search Box */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }} 
          className="space-y-4"
        >
          <label className="block text-xs font-bold text-slate-700">
            رمز التحقق الرقمي المعتمد (Verification Code)
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={queryCode}
                onChange={(e) => setQueryCode(e.target.value)}
                placeholder="مثال: CERT-7F2K-2026 أو CERT-MANUAL-8821"
                className="w-full pr-10 pl-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-mono font-bold text-slate-900 focus:outline-teal-600 focus:bg-white transition-all shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-4" />
            </div>

            <button
              type="submit"
              className="px-8 py-3.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md shadow-teal-900/20 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>التحقق من الشهادة</span>
            </button>
          </div>

          {/* Quick Demo Code Samples */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
            <span className="font-semibold">أكواد تجريبية للتحقق السريع:</span>
            <button
              type="button"
              onClick={() => {
                setQueryCode('CERT-7F2K-2026');
                handleVerify('CERT-7F2K-2026');
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono text-[11px] font-bold border border-slate-200 cursor-pointer"
            >
              CERT-7F2K-2026 (أولمبياد وطني)
            </button>
            <button
              type="button"
              onClick={() => {
                setQueryCode('CERT-MANUAL-8821');
                handleVerify('CERT-MANUAL-8821');
              }}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-mono text-[11px] font-bold border border-slate-200 cursor-pointer"
            >
              CERT-MANUAL-8821 (تكريم معلم)
            </button>
          </div>
        </form>

        {/* Verification Result Card */}
        {hasSearched && (
          <div className="pt-6 border-t border-slate-100">
            {result ? (
              <div className="rounded-3xl border-2 border-emerald-500/40 bg-emerald-50/40 p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-700/30">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>شهادة رسمية معتمدة ومسجلة في المنظومة</span>
                      </div>
                      <h2 className="text-base sm:text-lg font-black text-slate-900 mt-1">
                        وثيقة التحقق: {result.verificationCode}
                      </h2>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsCertModalOpen(true)}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95"
                  >
                    <Award className="w-4 h-4" />
                    <span>معاينة وطباعة الشهادة الأصلية</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                      <User className="w-3.5 h-3.5 text-teal-600" />
                      <span>اسم الطالب المكرم</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-slate-900">
                      {result.studentName}
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                      <School className="w-3.5 h-3.5 text-teal-600" />
                      <span>الصرح التعليمي / المدرسة</span>
                    </div>
                    <div className="text-sm sm:text-base font-black text-slate-900">
                      {result.schoolName}
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                      <Trophy className="w-3.5 h-3.5 text-amber-500" />
                      <span>عنوان المسابقة أو مناسبة التكريم</span>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800">
                      {result.competitionOrTitle}
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-2xs space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                      <Award className="w-3.5 h-3.5 text-indigo-600" />
                      <span>الجهة المانحة / المشرف</span>
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-800">
                      {result.issuerName}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 pt-2 border-t border-emerald-200/80">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>تاريخ الإصدار: {result.date}</span>
                  </div>
                  {result.score !== undefined && (
                    <div className="font-bold text-emerald-800">
                      النتيجة المسجلة: {result.score} نقطة {result.rank ? `(المركز ${result.rank})` : ''}
                    </div>
                  )}
                  <span className="text-emerald-700 font-bold">
                    ✓ الاعتماد الرقمي سارٍ ولا يتطلب أي ختم ورقي إضافي
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border-2 border-rose-200 bg-rose-50/50 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                  <XCircle className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-rose-900">لم يتم العثور على شهادة بهذا الرمز</h3>
                <p className="text-xs text-rose-700 max-w-md mx-auto leading-relaxed">
                  تأكد من كتابة كود التحقق الرقمي كما هو موضح بالشهادة بدقة (مثال: CERT-XXXX-XXXX). إذا كانت الشهادة صادرة حديثاً يرجى مراجعة المعلم المشرف.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Back button */}
      <div className="text-center pt-2">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>العودة إلى الصفحة الرئيسية</span>
        </button>
      </div>

      {/* Modal for certificate view if verified */}
      {result && (
        <CertificateModal
          isOpen={isCertModalOpen}
          onClose={() => setIsCertModalOpen(false)}
          studentName={result.studentName}
          teacherName={result.issuerName}
          schoolName={result.schoolName}
          competitionTitle={result.competitionOrTitle}
          score={result.score}
          rank={result.rank}
          verificationCode={result.verificationCode}
          dateStr={result.date}
          isManual={result.type === 'manual'}
        />
      )}
    </div>
  );
};
