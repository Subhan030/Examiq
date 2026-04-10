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

    for (const q of questions) {
      const userAnswer = answers[q._id];
      if (userAnswer === undefined) continue;

      // Use Factory to create a validation instance
      const questionInstance = QuestionFactory.createQuestion(q.type, {
        content: q.content,
        difficulty: q.difficulty,
        ...q.metadata
      });

      if (questionInstance.validateAnswer(userAnswer)) {
        score += 10; // Award 10 points per correct answer
      }
    }

    const totalPossibleMarks = questions.length * 10;
    const status = score >= totalPossibleMarks * 0.4 ? 'Pass' : 'Fail';

    const result = new Result({
      studentId,
      examId,
      score,
      totalMarks: totalPossibleMarks,
      status
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
