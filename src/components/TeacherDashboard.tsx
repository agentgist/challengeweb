import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  Users, 
  Award, 
  FileSpreadsheet, 
  Printer, 
  ExternalLink, 
  School, 
  Clock, 
  CheckCircle2, 
  Search, 
  LogOut,
  Sparkles,
  AlertCircle,
  Eye,
  KeyRound,
  FileText,
  BarChart3,
  TrendingUp,
  Target,
  Zap
} from 'lucide-react';
import { Competition, AccessCode, ParticipantResult, TeamResult, ManualCertificate } from '../types';
import { StorageService } from '../services/storageService';
import { ExportService } from '../services/exportService';
import { CompetitionBuilderModal } from './CompetitionBuilderModal';
import { CertificateModal } from './CertificateModal';

interface TeacherDashboardProps {
  currentTeacher: AccessCode;
  onLogout: () => void;
  onOpenStudentView: (competitionId: string) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  currentTeacher,
  onLogout,
  onOpenStudentView,
}) => {
  const [activeTab, setActiveTab] = useState<'my_competitions' | 'certificates' | 'results' | 'analytics'>('my_competitions');
  
  // Competitions state
  const [myCompetitions, setMyCompetitions] = useState<Competition[]>([]);
  const [selectedCompForResults, setSelectedCompForResults] = useState<string>('');
  const [resultsList, setResultsList] = useState<ParticipantResult[]>([]);
  const [teamResultsList, setTeamResultsList] = useState<TeamResult[]>([]);

  // Manual Certificate Generator state
  const [manualStudentName, setManualStudentName] = useState('');
  const [manualReason, setManualReason] = useState('تكريم للتفوق والتميز الدراسي المستمر');
  const [manualCertificates, setManualCertificates] = useState<ManualCertificate[]>([]);

  // Modals
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Competition | null>(null);

  // Certificate Preview Modal state
  const [certModalData, setCertModalData] = useState<{
    isOpen: boolean;
    studentName: string;
    teacherName: string;
    schoolName: string;
    competitionTitle: string;
    score?: number;
    rank?: number;
    isManual?: boolean;
    reason?: string;
  }>({
    isOpen: false,
    studentName: '',
    teacherName: '',
    schoolName: '',
    competitionTitle: ''
  });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load teacher competitions and data
  const loadData = () => {
    const list = StorageService.getTeacherCompetitions(currentTeacher.code);
    setMyCompetitions(list);
    if (!selectedCompForResults && list.length > 0) {
      setSelectedCompForResults(list[0].id);
    }
    setManualCertificates(StorageService.getManualCertificates().filter(c => c.teacherName === currentTeacher.teacherDisplayName));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage_update', loadData);
    return () => window.removeEventListener('storage_update', loadData);
  }, [currentTeacher.code]);

  // Update results when selected competition changes
  useEffect(() => {
    if (selectedCompForResults) {
      const results = StorageService.getCompetitionResults(selectedCompForResults);
      setResultsList(results);
      const teamResults = StorageService.getTeamResults(selectedCompForResults);
      setTeamResultsList(teamResults);
    } else {
      setResultsList([]);
      setTeamResultsList([]);
    }
  }, [selectedCompForResults, myCompetitions]);

  const handleCopySlugLink = (webSlug: string) => {
    const url = `${window.location.origin}/?quiz=${webSlug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(webSlug);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDeleteComp = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف مسابقة "${name}"؟`)) {
      StorageService.deleteCompetition(id);
      loadData();
    }
  };

  const handleSaveCompetition = (comp: Competition) => {
    StorageService.saveCompetition(comp);
    setIsBuilderOpen(false);
    setEditingComp(null);
    loadData();
  };

  const handleCreateManualCertificate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentName.trim()) {
      alert('يرجى كتابة اسم الطالب للتكريم.');
      return;
    }

    const newCert: ManualCertificate = {
      id: `cert-${Date.now()}`,
      studentName: manualStudentName.trim(),
      titleOrReason: manualReason.trim(),
      teacherName: currentTeacher.teacherDisplayName,
      schoolName: currentTeacher.school,
      date: new Date().toLocaleDateString('ar-SA'),
      verificationCode: `CERT-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`
    };

    StorageService.saveManualCertificate(newCert);
    setManualCertificates(prev => [newCert, ...prev]);

    // Open live certificate modal
    setCertModalData({
      isOpen: true,
      studentName: newCert.studentName,
      teacherName: newCert.teacherName,
      schoolName: newCert.schoolName,
      competitionTitle: newCert.titleOrReason,
      isManual: true,
      reason: newCert.titleOrReason
    });

    setManualStudentName('');
  };

  const selectedCompObj = myCompetitions.find(c => c.id === selectedCompForResults);

  // Overall analytics across all teacher competitions
  const allTeacherResults = myCompetitions.flatMap(c => StorageService.getCompetitionResults(c.id));
  const totalParticipants = allTeacherResults.length;
  const avgScore = totalParticipants > 0 ? Math.round(allTeacherResults.reduce((sum, r) => sum + r.score, 0) / totalParticipants) : 0;
  const topScore = totalParticipants > 0 ? Math.max(...allTeacherResults.map(r => r.score)) : 0;
  const totalCertificatesIssued = allTeacherResults.length + manualCertificates.length;

  const excellentCount = allTeacherResults.filter(r => (r.correctAnswers / (r.totalQuestions || 1)) >= 0.85).length;
  const veryGoodCount = allTeacherResults.filter(r => {
    const ratio = r.correctAnswers / (r.totalQuestions || 1);
    return ratio >= 0.70 && ratio < 0.85;
  }).length;
  const goodCount = allTeacherResults.filter(r => {
    const ratio = r.correctAnswers / (r.totalQuestions || 1);
    return ratio >= 0.50 && ratio < 0.70;
  }).length;
  const needsImprovementCount = allTeacherResults.filter(r => (r.correctAnswers / (r.totalQuestions || 1)) < 0.50).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" dir="rtl">
      
      {/* Teacher Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                لوحة المعلم المعتمد
              </span>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-white/10 text-slate-300 border border-white/10">
                رمزك: {currentTeacher.code}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black">{currentTeacher.teacherDisplayName}</h1>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
              <School className="w-3.5 h-3.5 text-teal-400" />
              <span>{currentTeacher.school || 'المملكة العربية السعودية'}</span>
              <span>•</span>
              <span>المسابقات المنشأة: {myCompetitions.length} من {currentTeacher.maxCompetitions}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                setEditingComp(null);
                setIsBuilderOpen(true);
              }}
              className="flex-1 md:flex-initial flex items-center justify-center gap-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-2xl shadow-lg shadow-teal-900/40 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء مسابقة جديدة</span>
            </button>

            <button
              onClick={onLogout}
              title="تسجيل الخروج من الرمز"
              className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('my_competitions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'my_competitions'
              ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-400" />
          <span>مسابقاتي ({myCompetitions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'certificates'
              ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4 text-amber-500" />
          <span>مركز الشهادات والتكريم</span>
        </button>

        <button
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'results'
              ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-teal-400" />
          <span>النتائج والتقارير</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-slate-900 dark:bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-emerald-400" />
          <span>الإحصائيات والتحليلات</span>
        </button>
      </div>

      {/* TAB 1: My Competitions */}
      {activeTab === 'my_competitions' && (
        <div className="space-y-4">
          {myCompetitions.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4 shadow-sm">
              <div className="w-16 h-16 bg-teal-50 text-teal-700 rounded-3xl flex items-center justify-center mx-auto">
                <Trophy className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">لم تقم بإنشاء مسابقات بعد</h3>
                <p className="text-xs text-slate-500 mt-1">
                  ابدأ بإنشاء أول مسابقة لطلابك يدوياً أو بواسطة الذكاء الاصطناعي وشارك الرابط معهم فوراً!
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingComp(null);
                  setIsBuilderOpen(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-2xl shadow-md cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>إنشاء مسابقتك الأولى الآن</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myCompetitions.map((comp) => {
                const resultsCount = StorageService.getCompetitionResults(comp.id).length;
                return (
                  <div
                    key={comp.id}
                    className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          comp.participationType === 'team'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {comp.participationType === 'team' ? '👥 فرق جماعية' : '👤 فردية'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          {comp.questionType === 'ai' ? '✨ ذكاء اصطناعي' : '✍️ إعداد يدوي'}
                        </span>
                      </div>

                      <h3 className="text-sm font-black text-slate-900 leading-snug">
                        {comp.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2">
                        {comp.description || 'لا يوجد وصف إضافي.'}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                        <span>📝 {comp.questions.length} أسئلة</span>
                        <span>⏱️ {comp.questionDuration}ث/سؤال</span>
                        <span>👥 {resultsCount} مشارك</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      {/* Copy student link */}
                      <button
                        onClick={() => handleCopySlugLink(comp.webSlug)}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          copiedId === comp.webSlug
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        {copiedId === comp.webSlug ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>تم نسخ رابط الطلاب!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>نسخ رابط مشاركة الطلاب</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenStudentView(comp.webSlug)}
                          title="معاينة شاشة الطالب"
                          className="flex-1 py-1.5 px-2.5 rounded-xl border border-slate-200 text-[11px] font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>معاينة</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedCompForResults(comp.id);
                            setActiveTab('results');
                          }}
                          title="عرض نتائج الطلاب"
                          className="flex-1 py-1.5 px-2.5 rounded-xl border border-teal-200 text-[11px] font-bold text-teal-700 bg-teal-50/50 hover:bg-teal-50 flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <Trophy className="w-3 h-3" />
                          <span>النتائج</span>
                        </button>

                        <button
                          onClick={() => {
                            setEditingComp(comp);
                            setIsBuilderOpen(true);
                          }}
                          title="تعديل المسابقة"
                          className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteComp(comp.id, comp.name)}
                          title="حذف المسابقة"
                          className="p-1.5 rounded-xl border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Certificates Hub */}
      {activeTab === 'certificates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Method B: Direct Instant Manual Generation */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">توليد شهادة تقدير فورية (يدوي)</h3>
                  <p className="text-[11px] text-slate-500">أدخل اسم الطالب واطبع شهادته فوراً بدون إنشاء مسابقة</p>
                </div>
              </div>

              <form onSubmit={handleCreateManualCertificate} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    اسم الطالب/ة المكرم *
                  </label>
                  <input
                    type="text"
                    required
                    value={manualStudentName}
                    onChange={(e) => setManualStudentName(e.target.value)}
                    placeholder="مثال: فيصل بن عبدالله المنصور"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-teal-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مناسبة التكريم أو عنوان التميز
                  </label>
                  <input
                    type="text"
                    value={manualReason}
                    onChange={(e) => setManualReason(e.target.value)}
                    placeholder="مثال: تكريم للتفوق في مادة الرياضيات"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-teal-600 focus:bg-white"
                  />
                </div>

                <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 space-y-1">
                  <div>• اسم المعلم المعتمد: <b>{currentTeacher.teacherDisplayName}</b></div>
                  <div>• الصرح التعليمي: <b>{currentTeacher.school}</b></div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4" />
                  <span>توليد ومعاينة الشهادة للطباعة</span>
                </button>
              </form>
            </div>

            {/* Previously Generated Manual Certificates */}
            {manualCertificates.length > 0 && (
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-3">
                <div className="text-xs font-black text-slate-800">
                  شهادات يدوية سابقة ({manualCertificates.length})
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {manualCertificates.map(cert => (
                    <div
                      key={cert.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{cert.studentName}</div>
                        <div className="text-[10px] text-slate-500">{cert.titleOrReason}</div>
                      </div>
                      <button
                        onClick={() => {
                          setCertModalData({
                            isOpen: true,
                            studentName: cert.studentName,
                            teacherName: cert.teacherName,
                            schoolName: cert.schoolName,
                            competitionTitle: cert.titleOrReason,
                            isManual: true,
                            reason: cert.titleOrReason
                          });
                        }}
                        className="px-3 py-1 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-amber-700 rounded-lg font-bold text-[11px] cursor-pointer"
                      >
                        معاينة وطباعة
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Method A: Certificates from Competition Results */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900">شهادات الطلاب من نتائج المسابقات</h3>
              </div>

              {/* Select Competition */}
              {myCompetitions.length > 0 && (
                <select
                  value={selectedCompForResults}
                  onChange={(e) => setSelectedCompForResults(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-teal-600"
                >
                  {myCompetitions.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {resultsList.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                لا توجد مشاركات مسجلة في هذه المسابقة حتى الآن. بمجرد حل الطلاب للأسئلة ستتمكن من طباعة شهاداتهم هنا بضغطة زر.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[450px] overflow-y-auto pr-1">
                {resultsList.map((res) => (
                  <div
                    key={res.id}
                    className="p-3.5 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs">
                        #{res.rank}
                      </div>
                      <div>
                        <div className="text-xs font-black text-slate-900">{res.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {res.school || 'المدرسة'} • الدرجة: {res.score} نقطة ({res.correctAnswers}/{res.totalQuestions})
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCertModalData({
                          isOpen: true,
                          studentName: res.name,
                          teacherName: currentTeacher.teacherDisplayName,
                          schoolName: res.school || currentTeacher.school,
                          competitionTitle: selectedCompObj?.name || 'مسابقة التميز',
                          score: res.score,
                          rank: res.rank,
                          isManual: false
                        });
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>طباعة الشهادة</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Results & Rankings */}
      {activeTab === 'results' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">سجل نتائج وترتيب الطلاب</h3>
              <p className="text-xs text-slate-500">متابعة دقيقة، تصدير ملف إكسل، وطباعة التقرير الرسمي</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {myCompetitions.length > 0 && (
                <select
                  value={selectedCompForResults}
                  onChange={(e) => setSelectedCompForResults(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-teal-600"
                >
                  {myCompetitions.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}

              {selectedCompObj && (
                <>
                  <button
                    onClick={() => ExportService.exportToCSV(resultsList, selectedCompObj.name)}
                    disabled={resultsList.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>تصدير Excel (CSV)</span>
                  </button>

                  <button
                    onClick={() => ExportService.printReport(resultsList, selectedCompObj, teamResultsList)}
                    disabled={resultsList.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold cursor-pointer disabled:opacity-40 transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>طباعة التقرير</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          {resultsList.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-100 text-teal-900">
                <div className="text-xs text-teal-700">إجمالي المشاركين</div>
                <div className="text-2xl font-black mt-1">{resultsList.length}</div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-900">
                <div className="text-xs text-amber-700">أعلى درجة محققة</div>
                <div className="text-2xl font-black mt-1">{resultsList[0]?.score || 0}</div>
              </div>

              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-100 text-sky-900">
                <div className="text-xs text-sky-700">متوسط الدرجات</div>
                <div className="text-2xl font-black mt-1">
                  {(resultsList.reduce((s, r) => s + r.score, 0) / resultsList.length).toFixed(0)}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900">
                <div className="text-xs text-slate-500">أسرع وقت حل</div>
                <div className="text-2xl font-black mt-1">{resultsList[0]?.totalTimeSeconds || 0}ث</div>
              </div>
            </div>
          )}

          {/* Teams Table if team mode */}
          {selectedCompObj?.participationType === 'team' && teamResultsList.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-extrabold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-sky-600" />
                <span>ترتيب الفرق الجماعية (مجموع الدرجات وسرعة الإنجاز)</span>
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3">الترتيب</th>
                      <th className="p-3">اسم الفريق</th>
                      <th className="p-3">المدرسة</th>
                      <th className="p-3">عدد الأعضاء</th>
                      <th className="p-3">مجموع النقاط</th>
                      <th className="p-3">متوسط الوقت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {teamResultsList.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">#{t.rank}</td>
                        <td className="p-3 font-bold text-sky-700">{t.teamName}</td>
                        <td className="p-3 text-slate-600">{t.school}</td>
                        <td className="p-3 text-slate-700">{t.membersCount} طلاب</td>
                        <td className="p-3 font-black text-emerald-700">{t.totalScore}</td>
                        <td className="p-3 text-slate-600">{t.averageTime}ث</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Individuals Table */}
          {resultsList.length === 0 ? (
            <div className="py-16 text-center text-slate-400 text-xs">
              لا توجد نتائج مسجلة حتى الآن. شارك رابط المسابقة مع طلابك للبدء.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3">الترتيب</th>
                    <th className="p-3">اسم المتسابق</th>
                    <th className="p-3">المدرسة</th>
                    {selectedCompObj?.participationType === 'team' && <th className="p-3">الفريق</th>}
                    <th className="p-3">الدرجة</th>
                    <th className="p-3">الإجابات الصحيحة</th>
                    <th className="p-3">الوقت المستغرق</th>
                    <th className="p-3 text-center">الشهادة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {resultsList.map((res) => (
                    <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-black text-slate-900">#{res.rank}</td>
                      <td className="p-3 font-bold text-slate-900">{res.name}</td>
                      <td className="p-3 text-slate-600">{res.school}</td>
                      {selectedCompObj?.participationType === 'team' && (
                        <td className="p-3 font-semibold text-sky-700">{res.teamName || '-'}</td>
                      )}
                      <td className="p-3 font-black text-emerald-700 text-sm">{res.score}</td>
                      <td className="p-3 text-slate-700">{res.correctAnswers} من {res.totalQuestions}</td>
                      <td className="p-3 text-slate-600 font-mono">{res.totalTimeSeconds.toFixed(1)} ث</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => {
                            setCertModalData({
                              isOpen: true,
                              studentName: res.name,
                              teacherName: currentTeacher.teacherDisplayName,
                              schoolName: res.school || currentTeacher.school,
                              competitionTitle: selectedCompObj?.name || 'المسابقة',
                              score: res.score,
                              rank: res.rank,
                              isManual: false
                            });
                          }}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          عرض الشهادة
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: Visual Analytics & Insights */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Top High-level Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي مشاركات الطلاب</span>
                <div className="w-9 h-9 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-3">
                {totalParticipants}
              </div>
              <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-1 font-semibold flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>عبر {myCompetitions.length} مسابقة مفعّلة</span>
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">متوسط الدرجات العام</span>
                <div className="w-9 h-9 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-3">
                {avgScore} <span className="text-sm font-bold text-slate-400">نقطة</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
                معدل الاستيعاب والإتقان المعرفي
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">أعلى درجة محققة</span>
                <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Trophy className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-3">
                {topScore}
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 font-semibold flex items-center gap-1">
                <span>⭐ الرقم القياسي الحالي</span>
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">الشهادات الصادرة</span>
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-3">
                {totalCertificatesIssued}
              </div>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>شهادات معتمدة ورسمية</span>
              </p>
            </div>
          </div>

          {/* Performance Distribution & Mastery Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span>توزيع مستويات أداء الطلاب ومعدل الإتقان</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    تصنيف الطلاب بناءً على نسبة الإجابات الصحيحة في جميع الاختبارات
                  </p>
                </div>
              </div>

              {totalParticipants === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  لا توجد بيانات كافية لعرض التوزيع حتى الآن. ستظهر المؤشرات فور بدء حل الطلاب للمسابقات.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Excellent */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                        <span>متميز (85% فما فوق)</span>
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {excellentCount} طلاب ({Math.round((excellentCount / totalParticipants) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${(excellentCount / totalParticipants) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Very Good */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
                        <span>جيد جداً (70% - 84%)</span>
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {veryGoodCount} طلاب ({Math.round((veryGoodCount / totalParticipants) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-teal-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${(veryGoodCount / totalParticipants) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Good */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                        <span>جيد (50% - 69%)</span>
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {goodCount} طلاب ({Math.round((goodCount / totalParticipants) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${(goodCount / totalParticipants) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Needs Support */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                        <span>بحاجة لمتابعة ودعم (أقل من 50%)</span>
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {needsImprovementCount} طلاب ({Math.round((needsImprovementCount / totalParticipants) * 100)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-rose-500 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${(needsImprovementCount / totalParticipants) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Hall of Fame / Top 3 Achievers */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>لوحة الشرف لأفضل المتسابقين</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                أعلى الطلاب إحرازاً للنقاط عبر جميع المسابقات المدرسية
              </p>

              {allTeacherResults.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-xs">
                  لا توجد نتائج مسجلة حتى الآن في لوحة الشرف.
                </div>
              ) : (
                <div className="space-y-3 pt-2">
                  {allTeacherResults.slice(0, 3).map((student, idx) => {
                    const medals = ['🥇', '🥈', '🥉'];
                    const medalColors = [
                      'bg-amber-50 dark:bg-amber-950/40 border-amber-300 text-amber-900 dark:text-amber-300',
                      'bg-slate-50 dark:bg-slate-800 border-slate-300 text-slate-800 dark:text-slate-200',
                      'bg-amber-100/40 dark:bg-amber-950/20 border-amber-400/40 text-amber-950 dark:text-amber-400'
                    ];
                    return (
                      <div 
                        key={student.id + idx}
                        className={`p-3 rounded-2xl border flex items-center justify-between ${medalColors[idx] || 'bg-slate-50'}`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-xl">{medals[idx]}</span>
                          <div>
                            <div className="text-xs font-black text-slate-900 dark:text-white">{student.name}</div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">{student.school}</div>
                          </div>
                        </div>
                        <div className="text-left font-mono">
                          <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">{student.score} نقطة</div>
                          <div className="text-[10px] text-slate-400">{student.totalTimeSeconds.toFixed(1)}ث</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Per-Competition Participation Breakdown Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>معدل التفاعل والمشاركة حسب المسابقة</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold">
                  <tr>
                    <th className="p-3">عنوان المسابقة</th>
                    <th className="p-3">نوع المسابقة</th>
                    <th className="p-3">عدد الأسئلة</th>
                    <th className="p-3">المشاركون</th>
                    <th className="p-3">متوسط الدرجات</th>
                    <th className="p-3">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {myCompetitions.map(comp => {
                    const compResults = StorageService.getCompetitionResults(comp.id);
                    const compAvg = compResults.length > 0 
                      ? Math.round(compResults.reduce((s, r) => s + r.score, 0) / compResults.length) 
                      : 0;
                    return (
                      <tr key={comp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-slate-900 dark:text-white">{comp.name}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">
                          {comp.competitionType === 'live' ? '🔴 مباشرة' : comp.competitionType === 'windowed' ? '⏳ فترة محددة' : '🟢 مفتوحة'}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-300">{comp.questions.length} سؤال</td>
                        <td className="p-3 font-bold text-teal-600 dark:text-teal-400">{compResults.length} طالب</td>
                        <td className="p-3 font-black text-slate-800 dark:text-slate-200">{compAvg} نقطة</td>
                        <td className="p-3">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            متاحة للطلاب
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      <CompetitionBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false);
          setEditingComp(null);
        }}
        onSave={handleSaveCompetition}
        currentTeacher={currentTeacher}
        isAdmin={false}
        editingCompetition={editingComp}
      />

      <CertificateModal
        isOpen={certModalData.isOpen}
        onClose={() => setCertModalData(prev => ({ ...prev, isOpen: false }))}
        studentName={certModalData.studentName}
        teacherName={certModalData.teacherName}
        schoolName={certModalData.schoolName}
        competitionTitle={certModalData.competitionTitle}
        score={certModalData.score}
        rank={certModalData.rank}
        isManual={certModalData.isManual}
        reason={certModalData.reason}
      />
    </div>
  );
};
