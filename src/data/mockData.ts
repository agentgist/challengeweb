import { Competition, AccessCode, Participant, ParticipantAnswer, ManualCertificate } from '../types';

export const INITIAL_ACCESS_CODES: AccessCode[] = [
  {
    id: 'code-1',
    code: 'TCHR-7F2K9X',
    teacherDisplayName: 'أ. فهد بن عبدالعزيز السبيعي',
    school: 'ثانوية الأمير نايف بالرياض',
    maxCompetitions: 10,
    usedCount: 2,
    expiresAt: '2026-12-31',
    isActive: true,
    createdAt: '2026-09-01T08:00:00Z'
  },
  {
    id: 'code-2',
    code: 'TCHR-9M3L8Q',
    teacherDisplayName: 'أ. نورة بنت سالم الحربي',
    school: 'متوسطة دار الحنان بجدة',
    maxCompetitions: 5,
    usedCount: 1,
    expiresAt: '2026-11-30',
    isActive: true,
    createdAt: '2026-09-10T10:00:00Z'
  },
  {
    id: 'code-3',
    code: 'TCHR-NEW-2026',
    teacherDisplayName: '', // Unassigned yet - prompts for teacher name on first login!
    school: '',
    maxCompetitions: 5,
    usedCount: 0,
    expiresAt: '2027-01-01',
    isActive: true,
    createdAt: '2026-09-15T12:00:00Z'
  },
  {
    id: 'code-4',
    code: 'TCHR-EXPIRED',
    teacherDisplayName: 'أ. محمد بن خالد الشريف',
    school: 'مدارس الأندلس الأهلية',
    maxCompetitions: 3,
    usedCount: 3,
    expiresAt: '2026-08-01',
    isActive: false,
    createdAt: '2026-07-01T09:00:00Z'
  }
];

export const INITIAL_COMPETITIONS: Competition[] = [
  {
    id: 'comp-platform-01',
    webSlug: 'national-science-olympiad',
    name: 'المسابقة الكبرى للعلوم والتقنية 2026 (فترة محددة)',
    description: 'مسابقة وطنية معتمدة بفترة زمنية محددة. يُسمح للطالب بمحاولة واحدة فقط، وتُعلن النتائج الرسمية والإجابات الصحيحة فور إغلاق المسابقة.',
    source: 'platform',
    teacherDisplayName: 'لجنة المسابقات بالمنصة',
    schoolName: 'الإدارة العامة للتعليم والتميز الرقمي',
    questionType: 'manual',
    participationType: 'individual',
    competitionType: 'windowed',
    examDurationMinutes: 25,
    startTime: '2026-09-18T00:00',
    endTime: '2026-09-25T23:59',
    singleAttempt: true,
    hideAnswersUntilEnd: true,
    questionDuration: 30,
    winnersCount: 5,
    rewardType: 'وسام التميز الوطني + شهادة معتمدة',
    certificateEnabled: true,
    status: 'active',
    antiCheatEnabled: true,
    showLeaderboardToStudents: true,
    createdAt: '2026-09-15T07:00',
    questions: [
      {
        id: 'q1',
        text: 'ما هي الوحدة الأساسية المسؤولة عن معالجة كافة العمليات الحسابية والمنطقية في الحاسب الآلي؟',
        options: ['وحدة المعالجة المركزية (CPU)', 'الذاكرة العشوائية (RAM)', 'القرص الصلب (Hard Disk)', 'وحدة الإمداد بالطاقة (PSU)'],
        correctIndex: 0,
        duration: 30,
        explanation: 'تعتبر وحدة المعالجة المركزية الدماغ الفعلي للحاسب والمسؤولة عن تنفيذ الأوامر ومعالجة البيانات.',
        category: 'تقنية المعلومات'
      },
      {
        id: 'q2',
        text: 'ما هو الكوكب الذي يُعرف بـ "الكوكب الأحمر" بسبب وفرة أكسيد الحديد على سطحه؟',
        options: ['الزهرة', 'المريخ', 'المشتري', 'عطارد'],
        correctIndex: 1,
        duration: 25,
        explanation: 'المريخ يتميز بلونه الصدأ الأحمر نتيجة وجود كميات هائلة من أكسيد الحديد في تربته وصخوره.',
        category: 'علوم الفضاء'
      },
      {
        id: 'q3',
        text: 'أي من الغازات التالية يُشكل النسبة الكبرى في الغلاف الجوي لكوكب الأرض بنسبة تقارب 78%؟',
        options: ['الأكسجين (O2)', 'النيتروجين (N2)', 'ثاني أكسيد الكربون (CO2)', 'الأرجون (Ar)'],
        correctIndex: 1,
        duration: 25,
        explanation: 'يشكل غاز النيتروجين النسبة العظمى من الغلاف الجوي يليه الأكسجين بحوالي 21%.',
        category: 'الكيمياء'
      },
      {
        id: 'q4',
        text: 'ما هي لغة البرمجة التي تُعد الأكثر استخداماً وعالمية في تطبيقات الذكاء الاصطناعي الحديث وتعلم الآلة؟',
        options: ['بايثون (Python)', 'إتش تي إم إل (HTML)', 'باسكال (Pascal)', 'سي إف بي (CFB)'],
        correctIndex: 0,
        duration: 25,
        explanation: 'تتميز بايثون ببيئة ثرية من المكتبات مفتوحة المصدر مثل PyTorch وTensorFlow وسهولة الصياغة البرمجية.',
        category: 'الذكاء الاصطناعي'
      },
      {
        id: 'q5',
        text: 'في أي عام أطلقت المملكة العربية السعودية رؤيتها الطموحة 2030 لتعزيز التنمية المستدامة والتنوع الاقتصادي؟',
        options: ['2014 م', '2016 م', '2018 م', '2020 م'],
        correctIndex: 1,
        duration: 20,
        explanation: 'أطلق صاحب السمو الملكي الأمير محمد بن سلمان رؤية المملكة 2030 في 25 أبريل عام 2016 م.',
        category: 'الثقافة الوطنية'
      }
    ]
  },
  {
    id: 'comp-platform-02',
    webSlug: 'ai-robotics-team-cup',
    name: 'تحدي الروبوتات المباشر (مسابقة مباشرة - الساعة 3:00)',
    description: 'مسابقة مباشرة تنطلق في موعد محدد الساعة 3:00 تماماً لجميع المشاركين وتنتهي تلقائياً بانتهاء مدة الامتحان (30 دقيقة).',
    source: 'platform',
    teacherDisplayName: 'إدارة المسابقات والبرامج الإثرائية',
    schoolName: 'المركز الوطني لتطوير المناهج والمسابقات',
    questionType: 'manual',
    participationType: 'team',
    competitionType: 'live',
    examDurationMinutes: 30,
    startTime: '2026-09-18T15:00',
    endTime: '2026-09-18T15:30',
    singleAttempt: true,
    hideAnswersUntilEnd: true,
    questionDuration: 40,
    winnersCount: 3,
    rewardType: 'درع التميز الجماعي + شهادات تكريم لجميع الأعضاء',
    certificateEnabled: true,
    status: 'upcoming',
    antiCheatEnabled: true,
    showLeaderboardToStudents: true,
    createdAt: '2026-09-16T08:30',
    questions: [
      {
        id: 'tm1',
        text: 'إذا كان مجموع أعمار 3 طلاب 45 عاماً، فكم سيكون مجموع أعمارهم جميعاً بعد مرور 5 سنوات؟',
        options: ['50 عاماً', '55 عاماً', '60 عاماً', '65 عاماً'],
        correctIndex: 2,
        duration: 40,
        explanation: 'كل طالب يزيد 5 سنوات (3 طلاب × 5 سنوات = 15 سنة إضافة). 45 + 15 = 60 عاماً.',
        category: 'الرياضيات المنطقية'
      },
      {
        id: 'tm2',
        text: 'ما هو المنهج العلمي الدقيق الذي يبدأ بملاحظة الظاهرة، صياغة الفرضيات، وإجراء التجارب للتحقق؟',
        options: ['المنهج الاستقرائي التجريبي', 'التخمين الحر', 'التقليد المعرفي', 'التحليل العشوائي'],
        correctIndex: 0,
        duration: 35,
        explanation: 'المنهج العلمي التجريبي يقوم على خطوات منهجية دقيقة تبدأ بالملاحظة وتنتهي بالنتائج القابلة للتكرار.',
        category: 'مهارات البحث'
      },
      {
        id: 'tm3',
        text: 'في المنطق الحاسوبي، إذا كان المدخلان (A = 1 و B = 0)، فما هي البوابة المنطقية التي تعطي ناتج (1)؟',
        options: ['بوابة AND', 'بوابة OR', 'بوابة NOR', 'بوابة XNOR'],
        correctIndex: 1,
        duration: 35,
        explanation: 'بوابة الاختيار OR تعطي القيمة 1 بمجرد أن يكون أحد المدخلين على الأقل يساوي 1.',
        category: 'الدوائر المنطقية'
      }
    ]
  },
  {
    id: 'comp-teacher-01',
    webSlug: 'math-kings-2026',
    name: 'تحدي ملوك الرياضيات الذهنية (مباشرة - 20 دقيقة)',
    description: 'مسابقة مباشرة تبدأ الساعة 3:00 مساءً وتنتهي بانتهاء مدة الامتحان. تنافس مباشر وحاسم بين الطلاب.',
    source: 'teacher',
    teacherCodeId: 'TCHR-7F2K9X',
    teacherDisplayName: 'أ. فهد بن عبدالعزيز السبيعي',
    schoolName: 'ثانوية الأمير نايف بالرياض',
    questionType: 'manual',
    participationType: 'individual',
    competitionType: 'live',
    examDurationMinutes: 20,
    startTime: '2026-09-18T15:00',
    endTime: '2026-09-18T15:20',
    singleAttempt: true,
    hideAnswersUntilEnd: true,
    questionDuration: 30,
    winnersCount: 3,
    rewardType: 'شهادة شكر وتقدير + نقاط تميز بالمنظومة',
    certificateEnabled: true,
    status: 'upcoming',
    antiCheatEnabled: true,
    showLeaderboardToStudents: true,
    createdAt: '2026-09-17T08:00',
    questions: [
      {
        id: 'mq1',
        text: 'ما حاصل ضرب 12 × 15 ذهنياً؟',
        options: ['160', '175', '180', '190'],
        correctIndex: 2,
        duration: 25,
        explanation: '12 × 10 = 120، و 12 × 5 = 60، بمجموع 180.',
        category: 'حساب ذهني'
      },
      {
        id: 'mq2',
        text: 'مثلث قائم الزاوية طول ضلعيه القائمين 6 سم و 8 سم، كم يكون طول الوتر؟',
        options: ['9 سم', '10 سم', '12 سم', '14 سم'],
        correctIndex: 1,
        duration: 30,
        explanation: 'وفق نظرية فيثاغورس: مربع الوتر = 36 + 64 = 100، وجذره التربيعي هو 10 سم.',
        category: 'هندسة'
      },
      {
        id: 'mq3',
        text: 'ما هو العدد الأولي الوحيد الذي يكون عدداً زوجياً؟',
        options: ['العدد 0', 'العدد 1', 'العدد 2', 'العدد 4'],
        correctIndex: 2,
        duration: 20,
        explanation: 'العدد 2 هو العدد الزوجي الوحيد الذي لا يقبل القسمة إلا على نفسه والواحد الصحيح.',
        category: 'نظرية الأعداد'
      }
    ]
  },
  {
    id: 'comp-teacher-02',
    webSlug: 'ai-biology-quest',
    name: 'تحدي الأحياء والبيئة الحيوية (تدريب مفتوح فوري)',
    description: 'مسابقة تدريبية مفتوحة متاحة للطلاب في أي وقت للتدريب الذاتي، وتظهر النتائج والإجابات وشروحاتها فور الانتهاء.',
    source: 'teacher',
    teacherCodeId: 'TCHR-7F2K9X',
    teacherDisplayName: 'أ. فهد بن عبدالعزيز السبيعي',
    schoolName: 'ثانوية الأمير نايف بالرياض',
    questionType: 'ai',
    participationType: 'individual',
    competitionType: 'open',
    examDurationMinutes: 15,
    startTime: '2026-09-18T00:00',
    endTime: '2026-12-31T23:59',
    singleAttempt: false,
    hideAnswersUntilEnd: false,
    questionDuration: 30,
    winnersCount: 3,
    rewardType: 'شهادة تكريم تفوق فوري',
    certificateEnabled: true,
    status: 'active',
    antiCheatEnabled: true,
    showLeaderboardToStudents: true,
    createdAt: '2026-09-18T06:00',
    questions: [
      {
        id: 'bio1',
        text: 'ما هي العضية الخلوية التي تُعرف بمصنع الطاقة وإنتاج الـ ATP في الخلية حقيقية النواة؟',
        options: ['الميتوكوندريا (Mitochondria)', 'الريبوسومات (Ribosomes)', 'جهاز جولجي (Golgi Apparatus)', 'الشبكة الإندوبلازمية'],
        correctIndex: 0,
        duration: 25,
        explanation: 'الميتوكوندريا هي المسؤولة عن التنفس الخلوي وإنتاج جزيئات الطاقة ATP.',
        category: 'أحياء الخلية'
      },
      {
        id: 'bio2',
        text: 'ما هو الهرمون الرئيسي المسؤول عن تنظيم وخفض مستويات السكر (الجلوكوز) في دم الإنسان؟',
        options: ['الأنسولين (Insulin)', 'الجلوكاجون (Glucagon)', 'الأدرينالين (Adrenaline)', 'الثيروكسين (Thyroxine)'],
        correctIndex: 0,
        duration: 25,
        explanation: 'تفرز خلايا بيتا في البنكرياس هرمون الأنسولين لمساعدة الخلايا على امتصاص الجلوكوز.',
        category: 'فسيولوجيا الإنسان'
      }
    ]
  }
];

export const INITIAL_PARTICIPANTS: Participant[] = [
  {
    id: 'part-1',
    competitionId: 'comp-platform-01',
    name: 'سعود بن طارق القحطاني',
    school: 'ثانوية الأمير نايف بالرياض',
    sessionToken: 'sess-token-01',
    joinedAt: '2026-09-18T08:10:00',
    score: 500,
    correctAnswers: 5,
    totalQuestions: 5,
    totalTimeSeconds: 38.4,
    rank: 1,
    submittedAt: '2026-09-18T08:14:20'
  },
  {
    id: 'part-2',
    competitionId: 'comp-platform-01',
    name: 'ريان بن إبراهيم الدوسري',
    school: 'ثانوية الرواد النموذجية',
    sessionToken: 'sess-token-02',
    joinedAt: '2026-09-18T09:20:00',
    score: 480,
    correctAnswers: 5,
    totalQuestions: 5,
    totalTimeSeconds: 46.2,
    rank: 2,
    submittedAt: '2026-09-18T09:24:10'
  },
  {
    id: 'part-3',
    competitionId: 'comp-platform-01',
    name: 'شهد بنت خالد العتيبي',
    school: 'مدارس المنهل الحديثة',
    sessionToken: 'sess-token-03',
    joinedAt: '2026-09-18T10:05:00',
    score: 390,
    correctAnswers: 4,
    totalQuestions: 5,
    totalTimeSeconds: 41.5,
    rank: 3,
    submittedAt: '2026-09-18T10:08:45'
  },
  {
    id: 'part-4',
    competitionId: 'comp-platform-02',
    name: 'عبدالملك بن سلمان المطيري',
    school: 'ثانوية الموهوبين بالشرقية',
    teamName: 'فريق فرسان الرؤية',
    sessionToken: 'sess-token-04',
    joinedAt: '2026-09-18T09:00:00',
    score: 300,
    correctAnswers: 3,
    totalQuestions: 3,
    totalTimeSeconds: 32.1,
    rank: 1,
    submittedAt: '2026-09-18T09:03:20'
  },
  {
    id: 'part-5',
    competitionId: 'comp-platform-02',
    name: 'معاذ بن يوسف الزهراني',
    school: 'ثانوية الموهوبين بالشرقية',
    teamName: 'فريق فرسان الرؤية',
    sessionToken: 'sess-token-05',
    joinedAt: '2026-09-18T09:05:00',
    score: 300,
    correctAnswers: 3,
    totalQuestions: 3,
    totalTimeSeconds: 36.4,
    rank: 2,
    submittedAt: '2026-09-18T09:08:35'
  },
  {
    id: 'part-6',
    competitionId: 'comp-platform-02',
    name: 'أحمد بن طلال الغامدي',
    school: 'مدارس الفلاح بجدة',
    teamName: 'فريق نخبة المستقبل',
    sessionToken: 'sess-token-06',
    joinedAt: '2026-09-18T10:30:00',
    score: 200,
    correctAnswers: 2,
    totalQuestions: 3,
    totalTimeSeconds: 45.0,
    rank: 3,
    submittedAt: '2026-09-18T10:34:00'
  },
  {
    id: 'part-7',
    competitionId: 'comp-teacher-01',
    name: 'عمر بن سلطان السبيعي',
    school: 'ثانوية الأمير نايف بالرياض',
    sessionToken: 'sess-token-07',
    joinedAt: '2026-09-18T11:00:00',
    score: 300,
    correctAnswers: 3,
    totalQuestions: 3,
    totalTimeSeconds: 26.8,
    rank: 1,
    submittedAt: '2026-09-18T11:03:10'
  }
];

export const INITIAL_ANSWERS: ParticipantAnswer[] = [
  { participantId: 'part-1', questionId: 'q1', selectedIndex: 0, isCorrect: true, timeTaken: 6.2, answeredAt: '2026-09-18T08:10:40' },
  { participantId: 'part-1', questionId: 'q2', selectedIndex: 1, isCorrect: true, timeTaken: 7.1, answeredAt: '2026-09-18T08:11:30' },
  { participantId: 'part-1', questionId: 'q3', selectedIndex: 1, isCorrect: true, timeTaken: 8.5, answeredAt: '2026-09-18T08:12:25' },
  { participantId: 'part-1', questionId: 'q4', selectedIndex: 0, isCorrect: true, timeTaken: 7.9, answeredAt: '2026-09-18T08:13:15' },
  { participantId: 'part-1', questionId: 'q5', selectedIndex: 1, isCorrect: true, timeTaken: 8.7, answeredAt: '2026-09-18T08:14:15' }
];

export const INITIAL_MANUAL_CERTIFICATES: ManualCertificate[] = [
  {
    id: 'cert-man-01',
    studentName: 'فيصل بن عبدالله المنصور',
    titleOrReason: 'تكريم للتفوق المتميز والجهود النوعية في مشروع العلوم والابتكار',
    teacherName: 'أ. فهد بن عبدالعزيز السبيعي',
    schoolName: 'ثانوية الأمير نايف بالرياض',
    date: '2026-09-18',
    verificationCode: 'CERT-7F2K-991'
  }
];
