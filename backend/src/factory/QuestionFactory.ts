export abstract class Question {
  protected content: string;
  protected difficulty: string;

  constructor(content: string, difficulty: string) {
    this.content = content;
    this.difficulty = difficulty;
  }

  abstract validateAnswer(answer: any): boolean;
}

export class MCQQuestion extends Question {
  private options: string[];
  private correctOptionIndex: number;

  constructor(content: string, difficulty: string, options: string[], correctOptionIndex: number) {
    super(content, difficulty);
    this.options = options;
    this.correctOptionIndex = correctOptionIndex;
  }

  validateAnswer(answer: any): boolean {
    return answer === this.correctOptionIndex;
  }
}

export class SubjectiveQuestion extends Question {
  private expectedKeywords: string[];

  constructor(content: string, difficulty: string, expectedKeywords: string[]) {
    super(content, difficulty);
    this.expectedKeywords = expectedKeywords;
  }

  validateAnswer(answer: any): boolean {
    const text = String(answer).toLowerCase();
    return this.expectedKeywords.some(kw => text.includes(kw.toLowerCase()));
  }
}

export class TFQuestion extends Question {
  private correctAnswer: boolean;

  constructor(content: string, difficulty: string, correctAnswer: boolean) {
    super(content, difficulty);
    this.correctAnswer = correctAnswer;
  }

  validateAnswer(answer: any): boolean {
    return answer === this.correctAnswer;
  }
}

export class QuestionFactory {
  static createQuestion(type: 'MCQ' | 'TF' | 'Subjective', config: any): Question {
    if (type === 'MCQ') {
      return new MCQQuestion(config.content, config.difficulty, config.options, config.correctOptionIndex);
    } else if (type === 'TF') {
      return new TFQuestion(config.content, config.difficulty, config.correctAnswer);
    } else if (type === 'Subjective') {
      return new SubjectiveQuestion(config.content, config.difficulty, config.expectedKeywords);
    }
    throw new Error('Unknown Question Type');
  }
}
