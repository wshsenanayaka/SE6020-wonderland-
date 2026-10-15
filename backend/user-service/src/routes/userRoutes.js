import { Router } from 'express';
import {
  listVisitors,
  registerVisitor,
  syncCognitoVisitor,
  updateVisitorProfile,
  visitorProfile,
} from '../controllers/userController.js';

const router = Router();

router.post('/register', registerVisitor);
router.post('/profile/sync', syncCognitoVisitor);
router.get('/profile', visitorProfile);
router.put('/profile', updateVisitorProfile);
router.get('/visitors', listVisitors);

export default router;
