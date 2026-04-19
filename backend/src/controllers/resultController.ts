import { Request, Response } from 'express';
import { Result } from '../models/Result';
import { Exam } from '../models/Exam';
import { QuestionModel } from '../models/Question';
import { QuestionFactory } from '../factory/QuestionFactory';

export const submitExam = async (req: Request, res: Response) => {
  try {
    const { examId, studentId, answers } = req.body; // answers: { [questionId]: value }

    const exam = await Exam.findById(examId).populate('questions');
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    let score = 0;
    const questions = exam.questions as any[];
    const answersDetail: any[] = [];

    for (const q of questions) {
      const userAnswer = answers[q._id];
      
      const detail: any = {
        questionId: q._id,
        content: q.content,
        userAnswer: userAnswer,
        isCorrect: false,
        correctAnswer: q.type === 'MCQ' ? q.metadata?.correctOptionIndex : (q.type === 'TF' ? q.metadata?.correctAnswer : q.metadata?.expectedKeywords)
      };

      if (userAnswer === undefined) {
        answersDetail.push(detail);
        continue;
      }

      // Use Factory to create a validation instance
      const questionInstance = QuestionFactory.createQuestion(q.type as 'MCQ' | 'TF' | 'Subjective', {
        content: q.content,
        difficulty: q.difficulty,
        ...q.metadata
      });

      if (questionInstance.validateAnswer(userAnswer)) {
        score += 10; // Award 10 points per correct answer
        detail.isCorrect = true;
      }
      answersDetail.push(detail);
    }

    const totalPossibleMarks = questions.length * 10;
    const status = score >= totalPossibleMarks * 0.4 ? 'Pass' : 'Fail';

    const result = new Result({
      studentId,
      examId,
      score,
      totalMarks: totalPossibleMarks,
      status,
      answersDetail
    });

    await result.save();
    res.status(201).json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentResults = async (req: Request, res: Response) => {
  try {
    const { studentId } = req.params;
    const results = await Result.find({ studentId }).populate('examId', 'title');
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllResults = async (req: Request, res: Response) => {
  try {
    // Admin/Examiner endpoint to see all submissions
    const results = await Result.find().populate('examId', 'title').populate('studentId', 'fullName email');
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const gradeSubjectiveAnswer = async (req: Request, res: Response) => {
  try {
    const { resultId } = req.params;
    const { questionId, scoreDelta } = req.body; 

    const result = await Result.findById(resultId);
    if (!result) return res.status(404).json({ message: 'Result not found' });

    let updated = false;
    for (let i = 0; i < result.answersDetail.length; i++) {
       if (result.answersDetail[i].questionId.toString() === questionId) {
          result.answersDetail[i].isCorrect = true;
          updated = true;
          break;
       }
    }
    
    if (updated) {
       result.score += scoreDelta;
       if (result.score >= result.totalMarks * 0.4) {
           result.status = 'Pass';
       }
       result.markModified('answersDetail');
       await result.save();
    }
    
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getLeaderboard = async (req: Request, res: Response) => {
  try {
    const { examId } = req.params;
    const results = await Result.find({ examId })
      .populate('studentId', 'fullName email')
      .sort({ score: -1 })
      .limit(10);
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
