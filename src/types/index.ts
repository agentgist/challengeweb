export type CompetitionSource = 'platform' | 'teacher';
export type QuestionType = 'manual' | 'ai';
export type ParticipationType = 'individual' | 'team';
export type CompetitionStatus = 'active' | 'upcoming' | 'ended';
export type CompetitionType = 'live' | 'windowed' | 'open';

export interface Question {
  id: string;
  competitionId?: string;
  text: string;
  options: string[];
  correctIndex: number;
  orderIndex?: number;
  duration: number; // in seconds
  explanation?: string;
  category?: string;
}

export interface AccessCode {
  id: string;
  code: string; // e.g. TCHR-7F2K9X
  teacherDisplayName: string; // filled on first use or by admin
  school: string;
  maxCompetitions: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface Competition {
  id: string;
  webSlug: string; // Unique URL slug/code
  name: string;
  description: string;
  source: CompetitionSource; // 'platform' (Admin) or 'teacher'
  teacherCodeId?: string; // Foreign key / code of the teacher
  teacherDisplayName: string;
  schoolName: string;
  questionType: QuestionType; // 'manual' or 'ai'
  participationType: ParticipationType; // 'individual' or 'team'
  competitionType: CompetitionType; // 'live' | 'windowed' | 'open'
  examDurationMinutes?: number; // Total exam duration in minutes (e.g. 20 mins)
  startTime: string; // ISO date-time string
  endTime: string; // ISO date-time string
  singleAttempt?: boolean; // strictly 1 attempt per student
  hideAnswersUntilEnd?: boolean; // Results & correct answers revealed only after competition ends
  questionDuration: number; // default per question in seconds
  winnersCount: number;
  rewardType: string;
  certificateEnabled: boolean;
  status: CompetitionStatus;
  questions: Question[];
  createdAt: string;
  antiCheatEnabled?: boolean;
  showLeaderboardToStudents?: boolean;
}

export interface Participant {
  id: string;
  competitionId: string;
  name: string;
  school: string;
  teamName?: string;
  sessionToken: string;
  joinedAt: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  totalTimeSeconds: number;
  rank?: number;
  submittedAt?: string;
}

export interface ParticipantAnswer {
  id?: string;
  participantId: string;
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
  timeTaken: number;
  answeredAt: string;
}

// Result aggregation for displays & certificates
export interface ParticipantResult extends Participant {
  competitionName?: string;
  answers?: ParticipantAnswer[];
}

export interface TeamResult {
  id: string;
  competitionId: string;
  teamName: string;
  school: string;
  membersCount: number;
  totalScore: number;
  averageScore: number;
  totalTimeSeconds: number;
  averageTime: number;
  rank?: number;
  members: Participant[];
}

export interface ManualCertificate {
  id: string;
  studentName: string;
  titleOrReason: string; // e.g. "وسام التفوق والإبداع العلمي"
  teacherName: string;
  schoolName: string;
  date: string;
  verificationCode: string;
}

export interface VerificationRecord {
  valid: boolean;
  type: 'competition' | 'manual';
  studentName: string;
  competitionOrTitle: string;
  schoolName: string;
  issuerName: string;
  date: string;
  verificationCode: string;
  score?: number;
  rank?: number;
}
