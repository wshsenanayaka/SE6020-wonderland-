import { Router } from 'express';
import { listVisitors, registerVisitor } from '../controllers/userController.js';

const router = Router();

router.post('/register', registerVisitor);
router.get('/visitors', listVisitors);

export default router;
