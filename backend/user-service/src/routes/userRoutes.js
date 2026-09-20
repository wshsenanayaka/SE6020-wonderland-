import { Router } from 'express';
import {
  listVisitors,
  registerVisitor,
  updateVisitorProfile,
  visitorProfile,
} from '../controllers/userController.js';

const router = Router();

router.post('/register', registerVisitor);
router.get('/profile', visitorProfile);
router.put('/profile', updateVisitorProfile);
router.get('/visitors', listVisitors);

export default router;
