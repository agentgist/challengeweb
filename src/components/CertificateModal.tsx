import React, { useState } from 'react';
import { 
  Award, 
  Printer, 
  Copy, 
  Check, 
  X, 
  ShieldCheck, 
  Calendar, 
  Sparkles, 
  Share2, 
  ExternalLink,
  QrCode
} from 'lucide-react';
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
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const verCode = verificationCode || `CERT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
  const displayDate = dateStr || new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
  const shareUrl = `${window.location.origin}?verify=${verCode}`;

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

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-4xl w-full p-4 sm:p-8 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-teal-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-sm">
              <Award className="w-5 h-5 drop-shadow-[0_2px_4px_rgba(245,158,11,0.3)]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>شهادة التميز والتكريم المعتمدة</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-bold">
                  نسخة رسمية A4
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                تصميم فاخر بألوان كحلية وذهبية مع كود تحقق رقمي معتمد
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyShareLink}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-700"
              title="مشاركة رابط الشهادة"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-teal-400" />}
              <span>{copiedLink ? 'تم نسخ الرابط!' : 'مشاركة'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-slate-950 font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-amber-950/40 cursor-pointer transition-all active:scale-95"
            >
              <Printer className="w-4 h-4 text-slate-950" />
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

        {/* Certificate Visual Canvas Preview - Luxury Navy & Gold Aesthetic */}
        <div className="bg-gradient-to-b from-[#FFFDF9] to-[#FAF6EE] rounded-2xl p-6 sm:p-10 border-4 border-amber-600/70 shadow-2xl relative overflow-hidden text-slate-900 select-none">
          {/* Inner Golden Ornaments */}
          <div className="absolute inset-2 border-2 border-amber-500/80 pointer-events-none rounded-xl" />
          <div className="absolute inset-3 border border-dashed border-amber-700/30 pointer-events-none rounded-lg" />

          {/* Corner Accents with Gold Accents */}
          <div className="absolute top-4 right-4 w-9 h-9 border-t-4 border-r-4 border-amber-600 rounded-tr-lg" />
          <div className="absolute top-4 left-4 w-9 h-9 border-t-4 border-l-4 border-amber-600 rounded-tl-lg" />
          <div className="absolute bottom-4 right-4 w-9 h-9 border-b-4 border-r-4 border-amber-600 rounded-br-lg" />
          <div className="absolute bottom-4 left-4 w-9 h-9 border-b-4 border-l-4 border-amber-600 rounded-bl-lg" />

          {/* Watermark Crest */}
          <div className="absolute inset-0 flex items-center justify-center opacity-4 pointer-events-none">
            <Award className="w-96 h-96 text-amber-900" />
          </div>

          {/* Certificate Header */}
          <div className="text-center relative z-10 space-y-1.5">
            <div className="text-[11px] tracking-widest text-teal-800 font-extrabold uppercase flex items-center justify-center gap-1.5">
              <span>★</span>
              <span>منصة المسابقات المدرسية والشهادات الرقمية</span>
              <span>★</span>
            </div>
            
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 font-serif tracking-tight pt-1">
              شَهَادَةُ تَمَيُّـزٍ وَتَفَـوُّقٍ
            </h1>
            
            <div className="inline-block px-5 py-0.5 rounded-full bg-amber-100/80 border border-amber-300 text-amber-900 font-bold text-xs mt-1 shadow-2xs">
              وسام الاستحقاق والتكريم الأكاديمي
            </div>
          </div>

          {/* Body Content */}
          <div className="my-7 text-center space-y-4 relative z-10">
            <p className="text-xs sm:text-sm text-slate-600 font-medium">
              يَسُرُّ إِدَارَةَ المَسَابِقَاتِ المَدْرَسِيَّةِ أَنْ تَمْنَحَ هَذِهِ الشَّهَادَةَ بِكُلِّ فَخْرٍ وَاعْتِزَازٍ لِلْمُتَمَيِّزِ/ة:
            </p>

            <div className="py-2">
              <span className="text-2xl sm:text-4xl font-black text-slate-950 border-b-2 border-amber-500 pb-2 px-8 inline-block font-serif tracking-wide bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text">
                {studentName || 'اسم الطالب/ة'}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-2xl mx-auto font-medium">
              {isManual ? (
                <>
                  نظير الجهد الاستثنائي والمشاركة المتميزة في <strong className="text-teal-800 font-bold">{reason || competitionTitle}</strong>، وتقديراً لشغفه بالمعرفة وتفوقه المستمر في <strong className="text-slate-950 font-bold">{schoolName}</strong>.
                </>
              ) : (
                <>
                  نظير إحرازه لمركز متقدم {rank ? `(#${rank})` : ''} في مسابقة <strong className="text-teal-800 font-bold">{competitionTitle}</strong> في <strong className="text-slate-950 font-bold">{schoolName}</strong>، متمنين له دوام التوفيق ومواصلة مسيرة النجاح والإبداع المعرفي.
                </>
              )}
            </p>

            {/* Achievement Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {score !== undefined && (
                <div className="bg-teal-50 border border-teal-200 text-teal-800 px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs">
                  <span>🏅</span>
                  <span>النتيجة: {score} نقطة</span>
                </div>
              )}
              {rank && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-2xs">
                  <span>🏆</span>
                  <span>المركز: #{rank}</span>
                </div>
              )}
              <div className="bg-slate-100 border border-slate-200 text-slate-700 px-3.5 py-1 rounded-full text-xs font-bold shadow-2xs">
                🏛️ {schoolName}
              </div>
            </div>
          </div>

          {/* Signatures, Seal & QR Code Block */}
          <div className="pt-6 border-t border-slate-200/80 flex items-center justify-between relative z-10">
            {/* Teacher Sponsor Signature */}
            <div className="text-right space-y-0.5">
              <div className="text-[10px] text-slate-500 font-bold">المعلم المشرف والراعي</div>
              <div className="text-xs sm:text-sm font-black text-slate-900 font-serif">{teacherName}</div>
              <div className="text-[10px] text-slate-500">{schoolName}</div>
            </div>

            {/* Luxury Golden Seal Stamp */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 border-2 border-amber-800 p-1 flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">
              <div className="w-full h-full rounded-full border border-dashed border-amber-900/60 flex flex-col items-center justify-center text-amber-950 font-black text-center">
                <Sparkles className="w-3.5 h-3.5 text-amber-900" />
                <span className="text-[8px] sm:text-[9px] font-black leading-tight mt-0.5">معتمد<br/>ورسمي</span>
              </div>
            </div>

            {/* Verification Details & QR Simulation */}
            <div className="text-left space-y-0.5">
              <div className="text-[10px] text-slate-500 font-bold">تاريخ الاعتماد الرسمي</div>
              <div className="text-xs sm:text-sm font-black text-slate-900">{displayDate}</div>
              <div className="text-[9px] font-mono font-bold text-teal-800 tracking-wider mt-0.5">{verCode}</div>
            </div>
          </div>
        </div>

        {/* Action bar below preview */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>كود التحقق:</span>
            <code className="bg-slate-800 text-amber-300 font-mono px-2 py-0.5 rounded text-xs font-bold">
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
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs shadow-md cursor-pointer transition-all"
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
