import { Router } from 'express';
import { AppController } from '../../controllers';

const router = Router();

const {
	_get_
} = AppController.NoticeController;

router.get('/',
	_get_
);

export default router;