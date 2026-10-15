import { Router } from 'express';
import {
  confirmCognitoRegistration,
  login,
  logout,
  registerCognitoVisitor,
  session,
  updateCognitoProfile,
} from '../controllers/authController.js';

const router = Router();

const asyncRoute = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

router.post('/login', asyncRoute(login));
router.post('/register', asyncRoute(registerCognitoVisitor));
router.post('/confirm-registration', asyncRoute(confirmCognitoRegistration));
router.put('/profile', asyncRoute(updateCognitoProfile));
router.post('/logout', logout);
router.get('/session', session);

export default router;
