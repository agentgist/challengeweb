import { 
  Competition, 
  AccessCode, 
  Participant, 
  ParticipantAnswer, 
  ParticipantResult, 
  TeamResult, 
  ManualCertificate,
  VerificationRecord 
} from '../types';
import {
  INITIAL_ACCESS_CODES,
  INITIAL_COMPETITIONS,
  INITIAL_PARTICIPANTS,
  INITIAL_ANSWERS,
  INITIAL_MANUAL_CERTIFICATES
} from '../data/mockData';

const KEYS = {
  ACCESS_CODES: 'platform_access_codes_v2',
  COMPETITIONS: 'platform_competitions_v3',
  PARTICIPANTS: 'platform_participants_v3',
  ANSWERS: 'platform_answers_v3',
  MANUAL_CERTS: 'platform_manual_certs_v2',
  LOGGED_TEACHER_CODE: 'platform_logged_teacher_code',
  RATE_LIMIT: 'platform_rate_limit_state',
  STUDENT_ATTEMPTS: 'platform_student_attempts_v3'
};

function getStored<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event('storage_update'));
  } catch (err) {
    console.error(`Error writing to ${key}:`, err);
  }
}

export const StorageService = {
  // ==========================================
  // 1. Access Codes & Teacher Authentication
  // ==========================================
  getAccessCodes(): AccessCode[] {
    return getStored<AccessCode[]>(KEYS.ACCESS_CODES, INITIAL_ACCESS_CODES);
  },

  saveAccessCode(code: AccessCode): void {
    const list = this.getAccessCodes();
    const idx = list.findIndex(c => c.id === code.id || c.code.toUpperCase() === code.code.toUpperCase());
    if (idx >= 0) {
      list[idx] = code;
    } else {
      list.unshift(code);
    }
    setStored(KEYS.ACCESS_CODES, list);
  },

  toggleCodeStatus(id: string): void {
    const list = this.getAccessCodes();
    const target = list.find(c => c.id === id);
    if (target) {
      target.isActive = !target.isActive;
      setStored(KEYS.ACCESS_CODES, list);
    }
  },

  // Rate Limiting Protection (5 attempts max, lock for 2 minutes)
  getRateLimitState(): { failedAttempts: number; lockedUntil: number } {
    const state = getStored<{ failedAttempts: number; lockedUntil: number }>(KEYS.RATE_LIMIT, {
      failedAttempts: 0,
      lockedUntil: 0
    });
    return state;
  },

  recordFailedAttempt(): { isLocked: boolean; remainingLockSeconds: number } {
    const state = this.getRateLimitState();
    const now = Date.now();
    state.failedAttempts += 1;
    if (state.failedAttempts >= 5) {
      state.lockedUntil = now + 120 * 1000; // 2 minutes lock
      setStored(KEYS.RATE_LIMIT, state);
      return { isLocked: true, remainingLockSeconds: 120 };
    }
    setStored(KEYS.RATE_LIMIT, state);
    return { isLocked: false, remainingLockSeconds: 0 };
  },

  resetRateLimit(): void {
    setStored(KEYS.RATE_LIMIT, { failedAttempts: 0, lockedUntil: 0 });
  },

  verifyAccessCode(rawCode: string): { 
    valid: boolean; 
    codeObj?: AccessCode; 
    isLocked?: boolean; 
    remainingSeconds?: number;
    needsProfileSetup?: boolean;
    message: string 
  } {
    const cleanCode = rawCode.trim().toUpperCase();
    const now = Date.now();
    const rateState = this.getRateLimitState();

    if (rateState.lockedUntil > now) {
      const remainingSeconds = Math.ceil((rateState.lockedUntil - now) / 1000);
      return {
        valid: false,
        isLocked: true,
        remainingSeconds,
        message: `تم تجميد المحاولات مؤقتاً لحماية النظام (${remainingSeconds} ثانية متبقية). يرجى الانتظار.`
      };
    }

    const list = this.getAccessCodes();
    const found = list.find(c => c.code.toUpperCase() === cleanCode);

    if (!found) {
      const failInfo = this.recordFailedAttempt();
      if (failInfo.isLocked) {
        return {
          valid: false,
          isLocked: true,
          remainingSeconds: failInfo.remainingLockSeconds,
          message: 'تجاوزت الحد المسموح من المحاولات الخاطئة (5 محاولات). تم تجميد الإدخال لمدة دقيقتين لمنع التخمين.'
        };
      }
      return {
        valid: false,
        message: `رمز الدخول غير صحيح. تحقق من الرمز وحاول مجدداً (${5 - rateState.failedAttempts - 1} محاولات متبقية).`
      };
    }

    if (!found.isActive) {
      return {
        valid: false,
        message: 'هذا الرمز تم تعطيله أو إيقافه من قِبل إدارة المنصة.'
      };
    }

    if (new Date(found.expiresAt).getTime() < now) {
      return {
        valid: false,
        message: 'رمز الدخول منتهي الصلاحية.'
      };
    }

    if (found.usedCount >= found.maxCompetitions) {
      return {
        valid: false,
        message: `تم استنفاذ الحد الأقصى للمسابقات المسموح بها لهذا الرمز (${found.maxCompetitions} مسابقة).`
      };
    }

    // Success: reset rate limiting
    this.resetRateLimit();

    // Check if first-time user (displayName is empty)
    const needsProfileSetup = !found.teacherDisplayName || found.teacherDisplayName.trim().length === 0;

    return {
      valid: true,
      codeObj: found,
      needsProfileSetup,
      message: 'رمز صالح ومؤكد.'
    };
  },

  updateTeacherProfile(codeStr: string, teacherDisplayName: string, school: string): AccessCode | null {
    const list = this.getAccessCodes();
    const target = list.find(c => c.code.toUpperCase() === codeStr.trim().toUpperCase());
    if (target) {
      target.teacherDisplayName = teacherDisplayName.trim();
      target.school = school.trim();
      setStored(KEYS.ACCESS_CODES, list);
      return target;
    }
    return null;
  },

  getLoggedTeacher(): AccessCode | null {
    const codeStr = localStorage.getItem(KEYS.LOGGED_TEACHER_CODE);
    if (!codeStr) return null;
    const codes = this.getAccessCodes();
    const found = codes.find(c => c.code.toUpperCase() === codeStr.toUpperCase() && c.isActive);
    return found || null;
  },

  setLoggedTeacher(codeStr: string | null): void {
    if (codeStr) {
      localStorage.setItem(KEYS.LOGGED_TEACHER_CODE, codeStr.trim().toUpperCase());
    } else {
      localStorage.removeItem(KEYS.LOGGED_TEACHER_CODE);
    }
    window.dispatchEvent(new Event('storage_update'));
  },

  // ==========================================
  // 2. Competitions (Platform & Teacher)
  // ==========================================
  getCompetitionStatus(comp: Partial<Competition>): 'active' | 'upcoming' | 'ended' {
    if (comp.competitionType === 'open') {
      return 'active';
    }

    const now = Date.now();
    const start = comp.startTime ? new Date(comp.startTime).getTime() : 0;
    let end = comp.endTime ? new Date(comp.endTime).getTime() : 0;

    if (comp.competitionType === 'live') {
      const durationMs = (comp.examDurationMinutes || 20) * 60 * 1000;
      if (!end || isNaN(end) || end <= start) {
        end = start + durationMs;
      }
    }

    if (start && now < start) {
      return 'upcoming';
    }
    if (end && now > end) {
      return 'ended';
    }
    return 'active';
  },

  getCompetitions(): Competition[] {
    const raw = getStored<Competition[]>(KEYS.COMPETITIONS, INITIAL_COMPETITIONS);
    return raw.map(comp => {
      const competitionType = comp.competitionType || (comp.endTime && new Date(comp.endTime).getTime() - new Date(comp.startTime).getTime() < 3600000 ? 'live' : 'windowed');
      const singleAttempt = comp.singleAttempt ?? (competitionType !== 'open');
      const hideAnswersUntilEnd = comp.hideAnswersUntilEnd ?? (competitionType !== 'open');
      const status = this.getCompetitionStatus({ ...comp, competitionType });
      return {
        ...comp,
        competitionType,
        singleAttempt,
        hideAnswersUntilEnd,
        status
      };
    });
  },

  getCompetitionById(idOrSlug: string): Competition | undefined {
    const list = this.getCompetitions();
    const clean = idOrSlug.trim().toLowerCase();
    return list.find(c => c.id.toLowerCase() === clean || c.webSlug.toLowerCase() === clean);
  },

  getTeacherCompetitions(teacherCodeStr: string): Competition[] {
    const clean = teacherCodeStr.trim().toUpperCase();
    return this.getCompetitions().filter(c => c.source === 'teacher' && c.teacherCodeId?.toUpperCase() === clean);
  },

  getPlatformCompetitions(): Competition[] {
    return this.getCompetitions().filter(c => c.source === 'platform');
  },

  saveCompetition(comp: Competition): void {
    const list = getStored<Competition[]>(KEYS.COMPETITIONS, INITIAL_COMPETITIONS);
    const updatedStatus = this.getCompetitionStatus(comp);
    const readyComp: Competition = {
      ...comp,
      status: updatedStatus
    };
    const idx = list.findIndex(c => c.id === readyComp.id);
    if (idx >= 0) {
      list[idx] = readyComp;
    } else {
      list.unshift(readyComp);
      // Increment teacher usedCount if created by teacher
      if (readyComp.source === 'teacher' && readyComp.teacherCodeId) {
        const codes = this.getAccessCodes();
        const codeTarget = codes.find(c => c.code.toUpperCase() === readyComp.teacherCodeId?.toUpperCase());
        if (codeTarget) {
          codeTarget.usedCount += 1;
          setStored(KEYS.ACCESS_CODES, codes);
        }
      }
    }
    setStored(KEYS.COMPETITIONS, list);
  },

  deleteCompetition(id: string): void {
    const list = getStored<Competition[]>(KEYS.COMPETITIONS, INITIAL_COMPETITIONS).filter(c => c.id !== id);
    setStored(KEYS.COMPETITIONS, list);
  },

  // ==========================================
  // 3. Participants & Answers (Auto-Save & Anti-Double)
  // ==========================================
  getParticipants(): Participant[] {
    return getStored<Participant[]>(KEYS.PARTICIPANTS, INITIAL_PARTICIPANTS);
  },

  getAnswers(): ParticipantAnswer[] {
    return getStored<ParticipantAnswer[]>(KEYS.ANSWERS, INITIAL_ANSWERS);
  },

  registerParticipant(params: {
    competitionId: string;
    name: string;
    school: string;
    teamName?: string;
  }): Participant {
    const participants = this.getParticipants();
    const token = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newParticipant: Participant = {
      id: `part_${Date.now()}`,
      competitionId: params.competitionId,
      name: params.name.trim(),
      school: params.school.trim(),
      teamName: params.teamName ? params.teamName.trim() : undefined,
      sessionToken: token,
      joinedAt: new Date().toISOString(),
      score: 0,
      correctAnswers: 0,
      totalQuestions: 0,
      totalTimeSeconds: 0
    };
    participants.unshift(newParticipant);
    setStored(KEYS.PARTICIPANTS, participants);
    return newParticipant;
  },

  // Strict constraint: UNIQUE(participantId, questionId)
  saveAnswer(answerData: {
    participantId: string;
    questionId: string;
    selectedIndex: number;
    isCorrect: boolean;
    timeTaken: number;
  }): boolean {
    const answers = this.getAnswers();
    // Check if already answered to prevent double submission
    const existingIndex = answers.findIndex(
      a => a.participantId === answerData.participantId && a.questionId === answerData.questionId
    );
    if (existingIndex >= 0) {
      // Already answered - reject duplicate
      return false;
    }

    const newAnswer: ParticipantAnswer = {
      id: `ans_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      participantId: answerData.participantId,
      questionId: answerData.questionId,
      selectedIndex: answerData.selectedIndex,
      isCorrect: answerData.isCorrect,
      timeTaken: answerData.timeTaken,
      answeredAt: new Date().toISOString()
    };
    answers.push(newAnswer);
    setStored(KEYS.ANSWERS, answers);
    return true;
  },

  finalizeParticipant(participantId: string, totalQuestions: number): ParticipantResult {
    const participants = this.getParticipants();
    const answers = this.getAnswers().filter(a => a.participantId === participantId);
    
    const targetIdx = participants.findIndex(p => p.id === participantId);
    if (targetIdx === -1) {
      throw new Error('المشارك غير موجود');
    }

    const correctCount = answers.filter(a => a.isCorrect).length;
    const totalTime = answers.reduce((acc, a) => acc + (a.timeTaken || 0), 0);
    // 100 points per correct answer + bonus for speed
    const calculatedScore = correctCount * 100;

    const updated: Participant = {
      ...participants[targetIdx],
      correctAnswers: correctCount,
      totalQuestions,
      score: calculatedScore,
      totalTimeSeconds: Number(totalTime.toFixed(1)),
      submittedAt: new Date().toISOString()
    };

    participants[targetIdx] = updated;
    setStored(KEYS.PARTICIPANTS, participants);

    // Record attempt locally to enforce single attempt rule
    this.recordStudentAttempt(updated.competitionId, updated.id, updated.name);

    const comp = this.getCompetitionById(updated.competitionId);
    return {
      ...updated,
      competitionName: comp?.name,
      answers
    };
  },

  // Student Single Attempt Tracking
  hasStudentParticipated(competitionId: string, studentName?: string): {
    participated: boolean;
    participant?: ParticipantResult;
  } {
    const compResults = this.getCompetitionResults(competitionId);
    
    // Check by name if provided
    if (studentName && studentName.trim()) {
      const cleanName = studentName.trim().toLowerCase();
      const byName = compResults.find(p => p.name.trim().toLowerCase() === cleanName);
      if (byName) {
        return { participated: true, participant: byName };
      }
    }

    // Check by browser local storage attempt registry
    try {
      const storedMap = getStored<Record<string, { participantId: string; name: string; date: string }[]>>(
        KEYS.STUDENT_ATTEMPTS, 
        {}
      );
      const list = storedMap[competitionId] || [];
      if (list.length > 0) {
        const lastAttempt = list[list.length - 1];
        const targetPart = compResults.find(p => p.id === lastAttempt.participantId);
        if (targetPart) {
          return { participated: true, participant: targetPart };
        }
      }
    } catch {}

    return { participated: false };
  },

  recordStudentAttempt(competitionId: string, participantId: string, studentName: string): void {
    try {
      const storedMap = getStored<Record<string, { participantId: string; name: string; date: string }[]>>(
        KEYS.STUDENT_ATTEMPTS, 
        {}
      );
      if (!storedMap[competitionId]) {
        storedMap[competitionId] = [];
      }
      storedMap[competitionId].push({
        participantId,
        name: studentName.trim(),
        date: new Date().toISOString()
      });
      setStored(KEYS.STUDENT_ATTEMPTS, storedMap);
    } catch (err) {
      console.error('Error recording attempt:', err);
    }
  },

  getCompetitionResults(competitionId: string): ParticipantResult[] {
    const participants = this.getParticipants().filter(p => p.competitionId === competitionId && p.submittedAt);
    const comp = this.getCompetitionById(competitionId);
    const allAnswers = this.getAnswers();

    // Sort by Score DESC, then totalTimeSeconds ASC
    const sorted = [...participants].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.totalTimeSeconds - b.totalTimeSeconds;
    });

    return sorted.map((p, index) => ({
      ...p,
      rank: index + 1,
      competitionName: comp?.name,
      answers: allAnswers.filter(a => a.participantId === p.id)
    }));
  },

  getTeamResults(competitionId: string): TeamResult[] {
    const participants = this.getCompetitionResults(competitionId).filter(p => !!p.teamName);
    const teamMap = new Map<string, Participant[]>();

    participants.forEach(p => {
      const team = p.teamName!;
      if (!teamMap.has(team)) {
        teamMap.set(team, []);
      }
      teamMap.get(team)!.push(p);
    });

    const teams: TeamResult[] = [];
    teamMap.forEach((members, teamName) => {
      const totalScore = members.reduce((sum, m) => sum + m.score, 0);
      const totalTime = members.reduce((sum, m) => sum + m.totalTimeSeconds, 0);
      const membersCount = members.length;
      const school = members[0]?.school || 'غير محدد';

      teams.push({
        id: `team_${encodeURIComponent(teamName)}`,
        competitionId,
        teamName,
        school,
        membersCount,
        totalScore,
        averageScore: Number((totalScore / membersCount).toFixed(1)),
        totalTimeSeconds: Number(totalTime.toFixed(1)),
        averageTime: Number((totalTime / membersCount).toFixed(1)),
        members
      });
    });

    // Sort by totalScore DESC, then averageTime ASC
    teams.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return a.averageTime - b.averageTime;
    });

    return teams.map((t, idx) => ({ ...t, rank: idx + 1 }));
  },

  // ==========================================
  // 4. Manual Certificates
  // ==========================================
  getManualCertificates(): ManualCertificate[] {
    return getStored<ManualCertificate[]>(KEYS.MANUAL_CERTS, INITIAL_MANUAL_CERTIFICATES);
  },

  saveManualCertificate(cert: ManualCertificate): void {
    const list = this.getManualCertificates();
    list.unshift(cert);
    setStored(KEYS.MANUAL_CERTS, list);
  },

  // ==========================================
  // 5. Verification Engine (Public Audit)
  // ==========================================
  verifyCertificate(codeStr: string): VerificationRecord | null {
    const clean = codeStr.trim().toUpperCase();
    if (!clean) return null;

    // 1. Check manual certificates
    const manualCerts = this.getManualCertificates();
    const manualFound = manualCerts.find(c => c.verificationCode.toUpperCase() === clean);
    if (manualFound) {
      return {
        valid: true,
        type: 'manual',
        studentName: manualFound.studentName,
        competitionOrTitle: manualFound.titleOrReason,
        schoolName: manualFound.schoolName,
        issuerName: manualFound.teacherName,
        date: manualFound.date,
        verificationCode: manualFound.verificationCode
      };
    }

    // 2. Check participants from competitions
    const participants = this.getParticipants().filter(p => p.submittedAt);
    const comps = this.getCompetitions();

    // Check by participant id or session or matching code format
    for (const p of participants) {
      const comp = comps.find(c => c.id === p.competitionId);
      const generatedCode = `CERT-${p.id.slice(-4).toUpperCase()}-${p.sessionToken.slice(-4).toUpperCase()}`;
      if (clean === generatedCode || clean === p.id.toUpperCase() || clean.includes(p.id.slice(-4).toUpperCase())) {
        const results = this.getCompetitionResults(p.competitionId);
        const selfResult = results.find(r => r.id === p.id);
        return {
          valid: true,
          type: 'competition',
          studentName: p.name,
          competitionOrTitle: comp?.name || 'المسابقة التعليمية',
          schoolName: p.school,
          issuerName: comp?.teacherDisplayName || 'إدارة المسابقات والتميز الرقمي',
          date: new Date(p.submittedAt || p.joinedAt).toLocaleDateString('ar-SA'),
          verificationCode: clean,
          score: p.score,
          rank: selfResult?.rank || 1
        };
      }
    }

    // Check demo verified codes
    if (clean === 'CERT-7F2K-2026' || clean.includes('7F2K') || clean === 'CERT-DEMO-01') {
      return {
        valid: true,
        type: 'competition',
        studentName: 'ريان بن خالد الشمري',
        competitionOrTitle: 'أولمبياد العلوم والتقنية الوطني 2026',
        schoolName: 'ثانوية الأمير نايف بالرياض',
        issuerName: 'أ. فهد بن عبدالعزيز السبيعي',
        date: '15 سبتمبر 2026',
        verificationCode: 'CERT-7F2K-2026',
        score: 500,
        rank: 1
      };
    }

    return null;
  },

  // ==========================================
  // 6. Utility / Reset
  // ==========================================
  resetAllData(): void {
    localStorage.removeItem(KEYS.ACCESS_CODES);
    localStorage.removeItem(KEYS.COMPETITIONS);
    localStorage.removeItem(KEYS.PARTICIPANTS);
    localStorage.removeItem(KEYS.ANSWERS);
    localStorage.removeItem(KEYS.MANUAL_CERTS);
    localStorage.removeItem(KEYS.LOGGED_TEACHER_CODE);
    localStorage.removeItem(KEYS.RATE_LIMIT);
    window.dispatchEvent(new Event('storage_update'));
  }
};
