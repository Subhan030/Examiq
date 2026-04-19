export interface UserData {
  email: string;
  role: string;
  id?: string;
}

export interface Course {
  _id: string;
  title: string;
  description: string;
}

export interface Question {
  _id?: string;
  type: 'MCQ' | 'TF' | 'Subjective';
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  content: string;
  metadata?: any;
  correctAnswer?: boolean; // for TF inside frontend state
  options?: string[]; // for MCQ inside frontend state
  correctOptionIndex?: number; // for MCQ inside frontend state
  expectedKeywords?: string[]; // for Subjective inside frontend state
}

export interface Exam {
  _id: string;
  title: string;
  courseId: Course | string;
  duration: number;
  totalMarks: number;
  startTime?: string;
  endTime?: string;
  isPractice?: boolean;
  randomizeCount?: number;
  state: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'CLOSED';
  questions?: Question[];
}

export interface Result {
  _id: string;
  examId: Exam | string;
  score: number;
  totalMarks: number;
  status: 'Pass' | 'Fail';
  answersDetail?: any[];
}
