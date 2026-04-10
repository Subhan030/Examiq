import { Router } from 'express';
import { createExam, getExams, updateExamState } from '../controllers/examController';
import { submitExam, getStudentResults } from '../controllers/resultController';
import { auth, authorize } from '../middleware/auth';

const router = Router();

// Exam Management (Admin/Examiner)
router.post('/', auth, authorize('Admin', 'Examiner'), createExam);
router.get('/', auth, getExams);
router.patch('/:id/state', auth, authorize('Admin', 'Examiner'), updateExamState);

// Exam Results (Student)
router.post('/submit', auth, submitExam);
router.get('/results/:studentId', auth, getStudentResults);

export default router;
