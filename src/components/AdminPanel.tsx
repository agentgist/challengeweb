import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  KeyRound, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Users, 
  Trophy, 
  Trash2, 
  Edit3, 
  RotateCcw, 
  Copy, 
  Check, 
  Search,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowRight,
  LogOut
} from 'lucide-react';
import { AccessCode, Competition, Participant } from '../types';
import { StorageService } from '../services/storageService';
import { CompetitionBuilderModal } from './CompetitionBuilderModal';

interface AdminPanelProps {
  onBackToHome: () => void;
  onLoginAsTeacher?: (code: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBackToHome, onLoginAsTeacher }) => {
  const [activeTab, setActiveTab] = useState<'access_codes' | 'platform_competitions' | 'analytics'>('access_codes');

  // Codes State
  const [accessCodes, setAccessCodes] = useState<AccessCode[]>([]);
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeSchool, setNewCodeSchool] = useState('');
  const [newCodeMaxComp, setNewCodeMaxComp] = useState(5);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [searchCode, setSearchCode] = useState('');

  // Platform Competitions
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<Competition | null>(null);

  // Stats
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [answersCount, setAnswersCount] = useState(0);

  const loadData = () => {
    setAccessCodes(StorageService.getAccessCodes());
    setCompetitions(StorageService.getCompetitions());
    setParticipants(StorageService.getParticipants());
    setAnswersCount(StorageService.getAnswers().length);
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage_update', loadData);
    return () => window.removeEventListener('storage_update', loadData);
  }, []);

  const handleGenerateCode = (e: React.FormEvent) => {
    e.preventDefault();
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const generatedCode = `TCHR-${randomHex}`;

    const newObj: AccessCode = {
      id: `code-${Date.now()}`,
      code: generatedCode,
      teacherDisplayName: newCodeName.trim(),
      school: newCodeSchool.trim() || 'المملكة العربية السعودية',
      maxCompetitions: Number(newCodeMaxComp) || 5,
      usedCount: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString()
    };

    StorageService.saveAccessCode(newObj);
    setNewCodeName('');
    setNewCodeSchool('');
    loadData();
  };

  const handleToggleCode = (id: string) => {
    StorageService.toggleCodeStatus(id);
    loadData();
  };

  const handleResetRateLimit = () => {
    StorageService.resetRateLimit();
    alert('تم إعادة تعيين حماية المحاولات (Rate Limit) بنجاح!');
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteComp = (id: string, name: string) => {
    if (confirm(`هل أنت متأكد من حذف مسابقة "${name}"؟`)) {
      StorageService.deleteCompetition(id);
      loadData();
    }
  };

  const handleSavePlatformComp = (comp: Competition) => {
    StorageService.saveCompetition(comp);
    setIsBuilderOpen(false);
    setEditingComp(null);
    loadData();
  };

  const filteredCodes = accessCodes.filter(c => 
    c.code.toLowerCase().includes(searchCode.toLowerCase()) ||
    c.teacherDisplayName.toLowerCase().includes(searchCode.toLowerCase()) ||
    c.school.toLowerCase().includes(searchCode.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              الإدارة المركزية للمنصة
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black">لوحة تحكم إدارة المنصة التعليمية</h1>
          <p className="text-xs text-slate-400 mt-1">
            إدارة وتوليد رموز وصول المعلمين، تفعيل/تعطيل الحسابات، ونشر مسابقات المنصة العامة
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Copy Direct Admin Link */}
          <button
            onClick={() => {
              const url = `${window.location.origin}${window.location.pathname}?portal=admin`;
              navigator.clipboard.writeText(url);
              alert('تم نسخ رابط المدير المخصص بنجاح:\n' + url);
            }}
            title="نسخ رابط الإدارة المباشر"
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>نسخ رابط المدير المباشر (?portal=admin)</span>
          </button>

          <button
            onClick={handleResetRateLimit}
            title="إلغاء تجميد المحاولات الخاطئة في النظام"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-300 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>فك تجميد المحاولات</span>
          </button>

          <button
            onClick={onBackToHome}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>العودة للمنصة</span>
          </button>
        </div>
      </div>

      {/* Analytics Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>رموز المعلمين</span>
            <KeyRound className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{accessCodes.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            نشط: {accessCodes.filter(c => c.isActive).length} رمز
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>إجمالي المسابقات</span>
            <Trophy className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{competitions.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            مسابقات منصة: {competitions.filter(c => c.source === 'platform').length}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>المشاركون الإجمالي</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{participants.length}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">طلاب ومتنافسون</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>الإجابات المحفوظة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{answersCount}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">سؤال تم تقييمه</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('access_codes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'access_codes'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <KeyRound className="w-4 h-4 text-amber-400" />
          <span>إدارة رموز المعلمين ({accessCodes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('platform_competitions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'platform_competitions'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Trophy className="w-4 h-4 text-teal-400" />
          <span>مسابقات المنصة العامة ({competitions.filter(c => c.source === 'platform').length})</span>
        </button>
      </div>

      {/* TAB 1: Access Codes Management */}
      {activeTab === 'access_codes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Form to generate new teacher code */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">توليد رمز وصول جديد</h3>
                <p className="text-[11px] text-slate-500">إصدار رمز جديد لمعلم أو مدرسة</p>
              </div>
            </div>

            <form onSubmit={handleGenerateCode} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم المعلم (اختياري، يمكن للمعلم إدخاله لاحقاً)
                </label>
                <input
                  type="text"
                  value={newCodeName}
                  onChange={(e) => setNewCodeName(e.target.value)}
                  placeholder="مثال: أ. محمد السالم"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-teal-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المدرسة / الجهة
                </label>
                <input
                  type="text"
                  value={newCodeSchool}
                  onChange={(e) => setNewCodeSchool(e.target.value)}
                  placeholder="مثال: مدرسة الرياض الثانوية"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-teal-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الحد الأقصى للمسابقات المسموح بها
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={newCodeMaxComp}
                  onChange={(e) => setNewCodeMaxComp(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 text-center"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>توليد وإصدار الرمز فوراً</span>
              </button>
            </form>
          </div>

          {/* Codes List */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-black text-slate-900">سجل رموز المعلمين</h3>
                <p className="text-xs text-slate-500">متابعة الاستخدام، النسخ، وإمكانية التعطيل الفوري</p>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  placeholder="ابحث برمز أو اسم..."
                  className="pr-8 pl-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-teal-600 w-44 shadow-2xs"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <tr>
                    <th className="p-3">الرمز</th>
                    <th className="p-3">اسم المعلم</th>
                    <th className="p-3">المدرسة</th>
                    <th className="p-3">الاستخدام</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCodes.map((code) => (
                    <tr key={code.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{code.code}</span>
                        <button
                          onClick={() => handleCopy(code.code)}
                          title="نسخ الرمز"
                          className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                        >
                          {copiedCode === code.code ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                      <td className="p-3 font-bold text-slate-800">
                        {code.teacherDisplayName || <span className="text-slate-400 font-normal">لم يدخل بعد</span>}
                      </td>
                      <td className="p-3 text-slate-600">{code.school}</td>
                      <td className="p-3 text-slate-700 font-bold">
                        {code.usedCount} / {code.maxCompetitions}
                      </td>
                      <td className="p-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          code.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {code.isActive ? 'نشط' : 'معطل'}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {onLoginAsTeacher && (
                            <button
                              onClick={() => onLoginAsTeacher(code.code)}
                              title="الدخول فوراً كمعلم بهذا الرمز للمعاينة"
                              className="px-2 py-1 rounded-lg text-[11px] font-bold bg-teal-50 text-teal-700 hover:bg-teal-100 cursor-pointer transition-colors"
                            >
                              معاينة كمعلم
                            </button>
                          )}
                          <button
                            onClick={() => handleToggleCode(code.id)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                              code.isActive
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {code.isActive ? 'تعطيل' : 'تفعيل'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Platform Competitions */}
      {activeTab === 'platform_competitions' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-900">مسابقات المنصة العامة</h3>
              <p className="text-xs text-slate-500">هذه المسابقات معروضة مباشرة في الصفحة الرئيسية لعموم الزوار والطلاب</p>
            </div>

            <button
              onClick={() => {
                setEditingComp(null);
                setIsBuilderOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء مسابقة منصة مركزية</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitions.filter(c => c.source === 'platform').map((comp) => (
              <div
                key={comp.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between space-y-3"
              >
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                    مسابقة منصة رسمية
                  </span>
                  <h4 className="text-sm font-black text-slate-900 mt-2">{comp.name}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1">{comp.description}</p>
                  <div className="text-[11px] text-slate-500 mt-2">
                    الأسئلة: {comp.questions.length} • المشاركة: {comp.participationType === 'team' ? 'فرق' : 'فردية'}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setEditingComp(comp);
                      setIsBuilderOpen(true);
                    }}
                    className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-white cursor-pointer"
                    title="تعديل"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteComp(comp.id, comp.name)}
                    className="p-1.5 rounded-lg border border-slate-300 text-slate-400 hover:text-rose-600 hover:bg-white cursor-pointer"
                    title="حذف"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Builder Modal for Platform Competitions */}
      <CompetitionBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => {
          setIsBuilderOpen(false);
          setEditingComp(null);
        }}
        onSave={handleSavePlatformComp}
        currentTeacher={null}
        isAdmin={true}
        editingCompetition={editingComp}
      />
    </div>
  );
};
