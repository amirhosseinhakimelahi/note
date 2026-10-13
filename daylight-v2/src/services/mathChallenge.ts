// Random math challenge generator for Daylight Wake-up alarms

export interface MathProblem {
  question: string;
  answer: number;
}

export function generateMathProblem(difficulty: 'easy' | 'medium' | 'hard' = 'easy'): MathProblem {
  const operations = ['+', '-', '*', '/'];

  if (difficulty === 'easy') {
    // 2 single/double digit numbers: Addition or Subtraction or simple multiplication
    const op = ['+', '-', '*'][Math.floor(Math.random() * 3)];
    if (op === '+') {
      const a = Math.floor(Math.random() * 25) + 5;
      const b = Math.floor(Math.random() * 25) + 5;
      return { question: `${a} + ${b}`, answer: a + b };
    } else if (op === '-') {
      const b = Math.floor(Math.random() * 20) + 3;
      const a = b + Math.floor(Math.random() * 25) + 2;
      return { question: `${a} - ${b}`, answer: a - b };
    } else {
      const a = Math.floor(Math.random() * 9) + 2;
      const b = Math.floor(Math.random() * 9) + 2;
      return { question: `${a} × ${b}`, answer: a * b };
    }
  }

  if (difficulty === 'medium') {
    const op = operations[Math.floor(Math.random() * operations.length)];
    if (op === '+') {
      const a = Math.floor(Math.random() * 60) + 15;
      const b = Math.floor(Math.random() * 60) + 15;
      return { question: `${a} + ${b}`, answer: a + b };
    } else if (op === '-') {
      const b = Math.floor(Math.random() * 50) + 10;
      const a = b + Math.floor(Math.random() * 50) + 10;
      return { question: `${a} - ${b}`, answer: a - b };
    } else if (op === '*') {
      const a = Math.floor(Math.random() * 12) + 4;
      const b = Math.floor(Math.random() * 12) + 4;
      return { question: `${a} × ${b}`, answer: a * b };
    } else {
      // Division with guaranteed whole number answer
      const answer = Math.floor(Math.random() * 12) + 2;
      const divisor = Math.floor(Math.random() * 9) + 2;
      const dividend = answer * divisor;
      return { question: `${dividend} ÷ ${divisor}`, answer };
    }
  }

  // Hard: 3-operand or larger arithmetic
  const type = Math.floor(Math.random() * 3);
  if (type === 0) {
    // (a × b) + c
    const a = Math.floor(Math.random() * 12) + 3;
    const b = Math.floor(Math.random() * 12) + 3;
    const c = Math.floor(Math.random() * 30) + 5;
    return { question: `(${a} × ${b}) + ${c}`, answer: a * b + c };
  } else if (type === 1) {
    // (a × b) - c
    const a = Math.floor(Math.random() * 12) + 4;
    const b = Math.floor(Math.random() * 12) + 4;
    const prod = a * b;
    const c = Math.floor(Math.random() * (prod - 5)) + 2;
    return { question: `(${a} × ${b}) - ${c}`, answer: prod - c };
  } else {
    // (dividend ÷ divisor) + c
    const divAns = Math.floor(Math.random() * 15) + 3;
    const divisor = Math.floor(Math.random() * 8) + 2;
    const dividend = divAns * divisor;
    const c = Math.floor(Math.random() * 25) + 5;
    return { question: `(${dividend} ÷ ${divisor}) + ${c}`, answer: divAns + c };
  }
}
