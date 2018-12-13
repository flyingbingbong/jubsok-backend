import { Router } from 'express';
import { AppController } from '../../controllers';

const router = Router();

const {
	getRecent,
} = AppController.WeeklyTasteController;

router.get('/recent',
	getRecent,
);

export default router;