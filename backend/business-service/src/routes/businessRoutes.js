import { Router } from 'express';
import multer from 'multer';
import os from 'os';
import { manageActivity } from '../controllers/activityController.js';
import { bookTicket } from '../controllers/bookingController.js';
import { platformData } from '../controllers/platformController.js';
import {
  createTicketPassController,
  deleteTicketPassController,
  listTicketPasses,
  updateTicketPassController,
} from '../controllers/ticketPassController.js';

const upload = multer({ dest: os.tmpdir() });
const router = Router();

router.get('/platform-data', platformData);
router.post('/bookings', bookTicket);
router.post('/activities', upload.single('background_image'), manageActivity);
router.get('/ticket-passes', listTicketPasses);
router.post('/ticket-passes', createTicketPassController);
router.put('/ticket-passes/:id', updateTicketPassController);
router.delete('/ticket-passes/:id', deleteTicketPassController);

export default router;
