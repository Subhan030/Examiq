import { Request, Response } from 'express';
import { Exam } from '../models/Exam';
import { Course } from '../models/Course';
import { QuestionModel } from '../models/Question';

export const createExam = async (req: Request, res: Response) => {
  try {
    const { title, courseId, duration, totalMarks, questions, startTime, endTime, isPractice, randomizeCount } = req.body;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    let questionIds: any[] = [];
    if (questions && Array.isArray(questions) && questions.length > 0) {
      const createdQuestions = await QuestionModel.insertMany(questions);
      questionIds = createdQuestions.map(q => q._id);
    }

    const exam = new Exam({
      title,
      courseId,
      duration,
      totalMarks,
      questions: questionIds,
      isPractice: isPractice || false,
      randomizeCount: randomizeCount || 0,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined
    });

    await exam.save();
    res.status(201).json(exam);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getExams = async (req: Request, res: Response) => {
  try {
    const exams = await Exam.find().populate('courseId', 'title');
    res.json(exams);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getExamById = async (req: Request, res: Response) => {
  try {
    const exam = await Exam.findById(req.params.id).populate('questions');
    if (!exam) return res.status(404).json({ message: 'Exam not found' });
    
    const examObj = exam.toObject();
    
    // Fisher-Yates shuffle + slice if randomizeCount is set
    if (examObj.randomizeCount && examObj.randomizeCount > 0 && examObj.questions.length > examObj.randomizeCount) {
      const shuffled = [...examObj.questions];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      examObj.questions = shuffled.slice(0, examObj.randomizeCount);
    }
    
    res.json(examObj);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateExamState = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'publish', 'activate', 'close'
    
    const exam = await Exam.findById(id);
    if (!exam) return res.status(404).json({ message: 'Exam not found' });

    if (action === 'publish') await exam.publish();
    else if (action === 'activate') await exam.activate();
    else if (action === 'close') await exam.close();
    else return res.status(400).json({ message: 'Invalid action' });

    res.json({ message: `Exam ${action}ed successfully`, exam });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
