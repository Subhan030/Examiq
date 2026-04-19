import { Router } from 'express';
import { createExam, getExams, updateExamState, getExamById } from '../controllers/examController';
import { submitExam, getStudentResults, getAllResults, gradeSubjectiveAnswer, getLeaderboard } from '../controllers/resultController';
import { generateQuestions } from '../controllers/aiController';
import { checkPlagiarism } from '../controllers/plagiarismController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

// Exam Management (Admin/Examiner)
router.post('/', authenticate, requireRole(['Admin', 'Examiner']), createExam);
router.get('/', authenticate, getExams);
router.patch('/:id/state', authenticate, requireRole(['Admin', 'Examiner']), updateExamState);

// Exam Results
router.post('/submit', authenticate, submitExam);
router.get('/results/all', authenticate, requireRole(['Admin', 'Examiner']), getAllResults);
router.get('/results/:studentId', authenticate, getStudentResults);
router.patch('/results/:resultId/grade', authenticate, requireRole(['Admin', 'Examiner']), gradeSubjectiveAnswer);

// Leaderboard
router.get('/:examId/leaderboard', authenticate, getLeaderboard);

// AI & Intelligence
router.post('/generate-questions', authenticate, requireRole(['Admin', 'Examiner']), generateQuestions);
router.get('/:examId/plagiarism-check', authenticate, requireRole(['Admin', 'Examiner']), checkPlagiarism);

// Get Exam By ID (Must be last GET to avoid shadowing)
router.get('/:id', authenticate, getExamById);

export default router;
