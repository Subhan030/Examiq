import { Router } from 'express';
import { createCourse, getCourses } from '../controllers/courseController';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, requireRole(['Admin', 'Examiner']), createCourse);
router.get('/', authenticate, getCourses);

export default router;
