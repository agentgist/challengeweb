import React, { useState } from 'react';
import { Award, Printer, Copy, Check, X, ShieldCheck, Calendar, Sparkles } from 'lucide-react';
import { ExportService } from '../services/exportService';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  teacherName: string;
  schoolName: string;
  competitionTitle: string;
  score?: number;
  rank?: number;
  isManual?: boolean;
  reason?: string;
  verificationCode?: string;
  dateStr?: string;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  studentName,
  teacherName,
  schoolName,
  competitionTitle,
  score,
  rank,
  isManual = false,
  reason,
  verificationCode,
  dateStr,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const verCode = verificationCode || `CERT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
  const displayDate = dateStr || new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

  const handlePrint = () => {
    ExportService.printCertificateHTML({
      studentName,
      teacherName,
      schoolName,
      competitionTitle,
      score,
      rank,
      isManual,
      reason,
      verificationCode: verCode,
      dateStr: displayDate
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(verCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-4xl w-full p-4 sm:p-8 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>شهادة التميز والتكريم المعتمدة</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-bold">
                  جاهزة للطباعة فوراً
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                توليد فوري بجودة طباعة A4 Landscape مع كود التحقق الرقمي المعتمد
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-amber-900/30 cursor-pointer transition-all active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة / حفظ PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Visual Canvas Preview */}
        <div className="bg-white rounded-2xl p-6 sm:p-10 border-4 border-amber-600/60 shadow-2xl relative overflow-hidden text-slate-900 select-none">
          {/* Inner Golden Border */}
          <div className="absolute inset-2 border-2 border-amber-400/80 pointer-events-none rounded-xl" />
          <div className="absolute inset-3 border border-dashed border-amber-600/40 pointer-events-none rounded-lg" />

          {/* Corner Accents */}
          <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-amber-600 rounded-tr-lg" />
          <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-amber-600 rounded-tl-lg" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-amber-600 rounded-br-lg" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-amber-600 rounded-bl-lg" />

          {/* Header */}
          <div className="text-center relative z-10 space-y-1">
            <div className="text-[11px] tracking-widest text-emerald-700 font-extrabold uppercase">
              منصة المسابقات التعليمية الرقمية
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-serif tracking-tight pt-1">
              شَهَادَةُ تَمَيُّـزٍ وَتَقْدِيـرٍ
            </h1>
            <div className="inline-block px-4 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-xs mt-1">
              وسام الاستحقاق والتفوق العلمي
            </div>
          </div>

          {/* Body */}
          <div className="my-6 text-center space-y-4 relative z-10">
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              يَسُرُّ إِدَارَةَ المَسَابِقَاتِ أَنْ تَمْنَحَ هَذِهِ الشَّهَادَةَ بِكُلِّ فَخْرٍ وَاعْتِزَازٍ لِلْمُتَمَيِّزِ/ة:
            </p>

            <div className="py-2">
              <span className="text-2xl sm:text-4xl font-black text-slate-900 border-b-2 border-dashed border-amber-500 pb-2 px-6 inline-block font-serif">
                {studentName || 'اسم الطالب/ة'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-2xl mx-auto">
              {isManual ? (
                <>
                  نظير الجهد المتميز والمشاركة الاستثنائية في <strong className="text-emerald-700 font-bold">{reason || competitionTitle}</strong>، وتقديراً لشغفه بالمعرفة والتميز العلمي المستمر في <strong className="text-slate-900">{schoolName}</strong>.
                </>
              ) : (
                <>
                  نظير إحرازه لمركز متقدم {rank ? `(#${rank})` : ''} في مسابقة <strong className="text-emerald-700 font-bold">{competitionTitle}</strong>، متمنين له دوام التوفيق ومواصلة مسيرة النجاح والإبداع المعرفي.
                </>
              )}
            </p>

            {/* Achievement Badge */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {score !== undefined && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold">
                  🏅 النتيجة: {score} نقطة
                </div>
              )}
              {rank && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full text-xs font-bold">
                  🏆 المركز: #{rank}
                </div>
              )}
              <div className="bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">
                🏛️ {schoolName}
              </div>
            </div>
          </div>

          {/* Signatures & Seal */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between relative z-10">
            <div className="text-right">
              <div className="text-[10px] text-slate-500 font-medium">المعلم المشرف والراعي</div>
              <div className="text-xs sm:text-sm font-black text-slate-900">{teacherName}</div>
              <div className="text-[10px] text-slate-600">{schoolName}</div>
            </div>

            {/* Golden Stamp Badge */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 border-2 border-amber-800 p-1 flex items-center justify-center shadow-lg transform -rotate-6">
              <div className="w-full h-full rounded-full border border-dashed border-amber-900/60 flex flex-col items-center justify-center text-amber-950 font-black text-center">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-900" />
                <span className="text-[8px] sm:text-[9px] font-black leading-tight mt-0.5">معتمد<br/>ورسمي</span>
              </div>
            </div>

            <div className="text-left">
              <div className="text-[10px] text-slate-500 font-medium">تاريخ الاعتماد</div>
              <div className="text-xs sm:text-sm font-black text-slate-900">{displayDate}</div>
              <div className="text-[9px] font-mono text-slate-500 mt-0.5">{verCode}</div>
            </div>
          </div>
        </div>

        {/* Action bar below preview */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>كود التحقق الرقمي:</span>
            <code className="bg-slate-800 text-amber-300 font-mono px-2 py-0.5 rounded text-xs">
              {verCode}
            </code>
            <button
              onClick={handleCopyCode}
              title="نسخ كود التحقق"
              className="text-slate-400 hover:text-white p-1 cursor-pointer transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-xs cursor-pointer transition-colors"
            >
              إغلاق
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة الشهادة الآن</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
