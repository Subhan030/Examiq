import { Request, Response } from 'express';
import { Exam } from '../models/Exam';
import { Course } from '../models/Course';

export const createExam = async (req: Request, res: Response) => {
  try {
    const { title, courseId, duration, totalMarks } = req.body;
    
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const exam = new Exam({
      title,
      courseId,
      duration,
      totalMarks
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
