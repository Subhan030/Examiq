import { Request, Response } from 'express';
import { Course } from '../models/Course';

export const createCourse = async (req: Request, res: Response) => {
  try {
    const { title, description, instructorId } = req.body;
    const course = new Course({ title, description, instructorId });
    await course.save();
    res.status(201).json(course);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const getCourses = async (req: Request, res: Response) => {
  try {
    const courses = await Course.find().populate('instructorId', 'email fullName');
    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
