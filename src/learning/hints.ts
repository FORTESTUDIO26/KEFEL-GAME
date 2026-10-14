// Three hint levels per question.
// 1. A way to work it out from a fact she already knows (when the game has evidence she knows one),
//    otherwise a simple split with a picture.
// 2. A more detailed breakdown with the partial results, leaving only the last step.
// 3. The full explained solution.
// Math inside [[...]] is rendered left-to-right.

export interface ArrayVisual {
  rows: number;
  cols: number;
  /** highlight the first `split` columns (or rows) in one colour and the rest in another */
  split?: number;
  dir?: 'rows' | 'cols';
}

export interface Hint {
  text: string;
  visual?: ArrayVisual;
  reveals?: boolean;
}

export type KnownFn = (x: number, y: number) => boolean;

interface Strategy {
  level1: string;
  level2: string;
  sum: string;
  visual?: ArrayVisual;
}

const mul = (x: number, y: number) => `${x} × ${y}`;

function neighbourStrategies(a: number, b: number, known: KnownFn): Strategy[] {
  const out: Strategy[] = [];
  const R = a * b;
  if (b - 1 >= 1 && known(a, b - 1)) {
    const P = a * (b - 1);
    out.push({
      level1: `אם [[${mul(a, b - 1)} = ${P}]], כמה נקבל כשנוסיף עוד [[${a}]]?`,
      level2: `[[${mul(a, b - 1)} = ${P}]]. מוסיפים עוד קבוצה אחת של [[${a}]]: [[${P} + ${a} = ?]]`,
      sum: `[[${P} + ${a} = ${R}]]`,
      visual: { rows: a, cols: b, split: b - 1, dir: 'cols' },
    });
  }
  if (a - 1 >= 1 && known(a - 1, b)) {
    const P = (a - 1) * b;
    out.push({
      level1: `אם [[${mul(a - 1, b)} = ${P}]], כמה נקבל כשנוסיף עוד [[${b}]]?`,
      level2: `[[${mul(a - 1, b)} = ${P}]]. מוסיפים עוד שורה אחת של [[${b}]]: [[${P} + ${b} = ?]]`,
      sum: `[[${P} + ${b} = ${R}]]`,
      visual: { rows: a, cols: b, split: a - 1, dir: 'rows' },
    });
  }
  if (b % 2 === 0 && b > 2 && known(a, b / 2)) {
    const P = a * (b / 2);
    out.push({
      level1: `[[${mul(a, b / 2)} = ${P}]]. המספר [[${b}]] הוא פי 2 מ־[[${b / 2}]] — אז מה הכפול של [[${P}]]?`,
      level2: `[[${mul(a, b / 2)} = ${P}]], ופי 2: [[${P} + ${P} = ?]]`,
      sum: `[[${P} + ${P} = ${R}]]`,
      visual: { rows: a, cols: b, split: b / 2, dir: 'cols' },
    });
  }
  if (a % 2 === 0 && a > 2 && known(a / 2, b)) {
    const P = (a / 2) * b;
    out.push({
      level1: `[[${mul(a / 2, b)} = ${P}]]. המספר [[${a}]] הוא פי 2 מ־[[${a / 2}]] — אז מה הכפול של [[${P}]]?`,
      level2: `[[${mul(a / 2, b)} = ${P}]], ופי 2: [[${P} + ${P} = ?]]`,
      sum: `[[${P} + ${P} = ${R}]]`,
      visual: { rows: a, cols: b, split: a / 2, dir: 'rows' },
    });
  }
  if (b + 1 <= 10 && known(a, b + 1)) {
    const P = a * (b + 1);
    out.push({
      level1: `אם [[${mul(a, b + 1)} = ${P}]], כמה נקבל כשנוריד [[${a}]]?`,
      level2: `[[${mul(a, b + 1)} = ${P}]]. מורידים קבוצה אחת של [[${a}]]: [[${P} − ${a} = ?]]`,
      sum: `[[${P} − ${a} = ${R}]]`,
    });
  }
  if (a + 1 <= 10 && known(a + 1, b)) {
    const P = (a + 1) * b;
    out.push({
      level1: `אם [[${mul(a + 1, b)} = ${P}]], כמה נקבל כשנוריד [[${b}]]?`,
      level2: `[[${mul(a + 1, b)} = ${P}]]. מורידים שורה אחת של [[${b}]]: [[${P} − ${b} = ?]]`,
      sum: `[[${P} − ${b} = ${R}]]`,
    });
  }
  return out;
}

function anchorStrategy(a: number, b: number, known: KnownFn): Strategy | null {
  for (const splitA of [true, false]) {
    const factor = splitA ? a : b;
    const n = splitA ? b : a;
    if (factor <= 5 || !(splitA ? known(5, b) : known(a, 5))) continue;
    const anchor = splitA ? mul(5, b) : mul(a, 5);
    const rest = splitA ? mul(a - 5, b) : mul(a, b - 5);
    return {
      level1: `אפשר להתחיל מעובדה מוכרת: [[${anchor} = ${5 * n}]]. מוסיפים [[${rest}]] — כמה נקבל?`,
      level2: `[[${anchor} = ${5 * n}]], וגם [[${rest} = ${(factor - 5) * n}]]. עכשיו: [[${5 * n} + ${(factor - 5) * n} = ?]]`,
      sum: `[[${5 * n} + ${(factor - 5) * n} = ${a * b}]]`,
      visual: { rows: a, cols: b, split: 5, dir: splitA ? 'rows' : 'cols' },
    };
  }
  return null;
}

function specialStrategy(a: number, b: number): Strategy | null {
  const R = a * b;
  if (a === 1 || b === 1) {
    const n = a === 1 ? b : a;
    return {
      level1: `כל מספר כפול [[1]] נשאר אותו מספר.`,
      level2: `יש קבוצה אחת של [[${n}]] — כמה זה?`,
      sum: `[[${mul(a, b)} = ${n}]]`,
    };
  }
  if (a === 10 || b === 10) {
    const n = a === 10 ? b : a;
    return {
      level1: `כפול [[10]]: כותבים את המספר ומוסיפים [[0]] בסוף.`,
      level2: `[[${n}]] ועוד אפס בסוף = ?`,
      sum: `[[${mul(a, b)} = ${R}]]`,
    };
  }
  if (a === 2 || b === 2) {
    const n = a === 2 ? b : a;
    return {
      level1: `כפול [[2]] זה לחבר את המספר לעצמו.`,
      level2: `[[${n} + ${n} = ?]]`,
      sum: `[[${n} + ${n} = ${R}]]`,
      visual: a === 2 ? { rows: 2, cols: b, split: 1, dir: 'rows' } : { rows: a, cols: 2, split: 1, dir: 'cols' },
    };
  }
  if (a === 9 || b === 9) {
    const n = a === 9 ? b : a;
    return {
      level1: `טריק של 9: מחשבים [[10 × ${n}]] ואז מורידים [[${n}]] אחד.`,
      level2: `[[10 × ${n} = ${10 * n}]]. עכשיו: [[${10 * n} − ${n} = ?]]`,
      sum: `[[${10 * n} − ${n} = ${R}]]`,
    };
  }
  if (a === 5 || b === 5) {
    const n = a === 5 ? b : a;
    return {
      level1: `כפול [[5]] זה חצי מכפול [[10]]: חשבי [[10 × ${n}]] ואז חצי.`,
      level2: `[[10 × ${n} = ${10 * n}]]. חצי מ־[[${10 * n}]] = ?`,
      sum: `[[${10 * n} ÷ 2 = ${R}]]`,
    };
  }
  if (a === 4 || b === 4 || a === 8 || b === 8) {
    const factor = a === 4 || a === 8 ? a : b;
    const n = factor === a ? b : a;
    const half = factor * n / 2;
    return {
      level1: `כפול [[${factor}]]: מכפילים את [[${n}]] ב־[[2]] ${factor === 4 ? 'פעמיים' : 'שלוש פעמים'}, בכל פעם את התוצאה שקיבלנו.`,
      level2: factor === 4
        ? `[[${n} × 2 = ${half}]]. מכפילים שוב: [[${half} + ${half} = ?]]`
        : `[[${n} × 2 = ${n * 2}]], ואז [[${n * 2} × 2 = ${half}]]. מכפילים שוב: [[${half} + ${half} = ?]]`,
      sum: `[[${half} + ${half} = ${R}]]`,
    };
  }
  return null;
}

function splitStrategy(a: number, b: number): Strategy {
  const R = a * b;
  // Split a factor above 5 into 5 + rest (the smaller such factor keeps the rest small),
  // or the larger factor into 2 + rest for small facts.
  const splitA = a > 5 && b > 5 ? a <= b : a > 5 ? true : b > 5 ? false : a >= b;
  const big = splitA ? a : b;
  const first = big > 5 ? 5 : 2;
  const rest = big - first;
  const [p1, p2] = splitA ? [first * b, rest * b] : [a * first, a * rest];
  const e1 = splitA ? mul(first, b) : mul(a, first);
  const e2 = splitA ? mul(rest, b) : mul(a, rest);
  return {
    level1: `אפשר לפרק: [[${mul(a, b)}]] זה [[${e1}]] ועוד [[${e2}]]. הסתכלי על הציור.`,
    level2: `[[${e1} = ${p1}]] וגם [[${e2} = ${p2}]]. עכשיו מחברים: [[${p1} + ${p2} = ?]]`,
    sum: `[[${p1} + ${p2} = ${R}]]`,
    visual: { rows: a, cols: b, split: first, dir: splitA ? 'rows' : 'cols' },
  };
}

export function buildHints(a: number, b: number, known: KnownFn): Hint[] {
  const R = a * b;
  const special = specialStrategy(a, b);
  const neighbours = neighbourStrategies(a, b, known);
  // Easy tables have their own simple rule; otherwise prefer a fact she knows, then a split.
  const s: Strategy =
    special && (a <= 2 || b <= 2 || a === 10 || b === 10)
      ? special
      : neighbours[0] ?? anchorStrategy(a, b, known) ?? special ?? splitStrategy(a, b);
  return [
    { text: s.level1, visual: s.visual },
    { text: s.level2, visual: s.visual ?? { rows: a, cols: b } },
    {
      text: `[[${mul(a, b)} = ${R}]], כי ${s.sum}.`,
      visual: s.visual ?? { rows: a, cols: b },
      reveals: true,
    },
  ];
}

/** The detailed (level 2) way, completed with the answer — shown once the answer is visible anyway. */
export function workedWay(hints: Hint[], answer: number): string {
  return hints[1].text.replace(/= \?/g, `= ${answer}`);
}

/** Hints for "a × ? = p" questions. */
export function buildMissingHints(a: number, b: number): Hint[] {
  const p = a * b;
  const skips = Array.from({ length: Math.min(b, 4) }, (_, i) => a * (i + 1)).join(', ');
  return [
    { text: `איזה מספר כפול [[${a}]] נותן [[${p}]]? זו גם השאלה [[${p} ÷ ${a} = ?]]. אפשר לקפוץ בקפיצות של [[${a}]]: [[${skips}, ...]]` },
    {
      text: `נסי לבדוק: [[${a} × 5 = ${a * 5}]]. צריך ${p > a * 5 ? 'יותר' : p < a * 5 ? 'פחות' : 'בדיוק את זה'} — כמה קבוצות של [[${a}]] יוצרות [[${p}]]?`,
      visual: { rows: b, cols: a },
    },
    { text: `[[${a} × ${b} = ${p}]], ולכן [[${p} ÷ ${a} = ${b}]] והמספר החסר הוא [[${b}]].`, visual: { rows: b, cols: a }, reveals: true },
  ];
}

/** Split a hint text into plain and math segments for rendering. */
export function splitMath(text: string): { math: boolean; value: string }[] {
  const parts: { math: boolean; value: string }[] = [];
  const re = /\[\[(.+?)\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push({ math: false, value: text.slice(last, m.index) });
    parts.push({ math: true, value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ math: false, value: text.slice(last) });
  return parts;
}
