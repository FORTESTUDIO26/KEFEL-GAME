import { factKey, type FactKey } from './facts';
import type { LearnSession, LearnSessionResult } from './learnPath';
import {
  dayKey,
  emptyStats,
  isValidRecall,
  recordOutcome,
  recordRecognition,
  type FactStats,
  type Orientation,
  type Outcome,
} from './scheduler';

export interface DailyLog {
  questions: number;
  independent: number;
  hinted: number;
  wrong: number;
  /** practised with the answer shown */
  supported: number;
  /** correct answers on a day she already had help with that fact */
  afterHelp: number;
  rounds: number;
  /** finished "לומדות וזוכרות" sessions */
  learnSessions: number;
}

export interface LearningData {
  facts: Record<FactKey, FactStats>;
  daily: Record<string, DailyLog>;
  /** how many never-seen facts were introduced per day (keeps new material light) */
  newByDay: Record<string, number>;
  /** the six facts of the "לומדות וזוכרות" path */
  learnSet: FactKey[];
  /** a session that was stopped in the middle, to continue later */
  learnSession: LearnSession | null;
  /** results of recent finished sessions (newest last) */
  learnLog: LearnSessionResult[];
  /** how many questions were answered in this profile (the clock for spacing and the rest rule) */
  questionCount: number;
  /** facts to reinforce first (e.g. the ones missed in a room challenge) */
  learnFocus: FactKey[];
}

export function emptyLearning(): LearningData {
  return { facts: {}, daily: {}, newByDay: {}, learnSet: [], learnSession: null, learnLog: [], questionCount: 0, learnFocus: [] };
}

export function emptyDaily(): DailyLog {
  return { questions: 0, independent: 0, hinted: 0, wrong: 0, supported: 0, afterHelp: 0, rounds: 0, learnSessions: 0 };
}

export function getStats(data: LearningData, key: FactKey): FactStats {
  return data.facts[key] ?? emptyStats(key);
}

export function orientationOf(a: number, b: number): Orientation {
  return a <= b ? 'ab' : 'ba';
}

export interface AnswerRecord {
  a: number;
  b: number;
  outcome: Outcome;
  usedHint: boolean;
  free?: boolean;
  /** the answer was only shown (study card, copying, tricks) — not a question */
  exposureOnly?: boolean;
}

/**
 * Would a correct answer to this fact, asked now as the next question, count as remembering alone?
 * (Not if its answer was seen today fewer than GAP_QUESTIONS questions ago.)
 */
export function wouldCountAlone(data: LearningData, key: FactKey, now: number): boolean {
  const s = getStats(data, key);
  if (s.lastMissDay !== dayKey(now)) return true;
  return isValidRecall({ ...s, helpQ: s.helpQ ?? data.questionCount }, data.questionCount + 1, false);
}

export function applyOutcome(data: LearningData, rec: AnswerRecord, now: number): LearningData {
  const key = factKey(rec.a, rec.b);
  const prev = getStats(data, key);
  const today = dayKey(now);
  const exposure = !!rec.exposureOnly;
  const q = exposure ? undefined : data.questionCount + 1;
  const next = recordOutcome(prev, rec.outcome, now, {
    orientation: orientationOf(rec.a, rec.b),
    usedHint: rec.usedHint,
    free: rec.free,
    q,
    helpAt: data.questionCount,
    exposure,
  });
  const log = { ...(data.daily[today] ?? emptyDaily()) };
  log.questions += 1;
  if (next.afterHelpCorrect > prev.afterHelpCorrect) log.afterHelp += 1;
  else log[rec.outcome] += 1;
  const newByDay = { ...data.newByDay };
  if (prev.attempts === 0) newByDay[today] = (newByDay[today] ?? 0) + 1;
  return {
    ...data,
    facts: { ...data.facts, [key]: next },
    daily: { ...data.daily, [today]: log },
    newByDay,
    questionCount: q ?? data.questionCount,
  };
}

export function applyRecognition(data: LearningData, keys: FactKey[]): LearningData {
  const facts = { ...data.facts };
  for (const k of keys) facts[k] = recordRecognition(getStats(data, k));
  return { ...data, facts };
}

export function finishRoundLog(data: LearningData, now: number): LearningData {
  const today = dayKey(now);
  const log = { ...(data.daily[today] ?? emptyDaily()) };
  log.rounds += 1;
  return { ...data, daily: { ...data.daily, [today]: log } };
}
