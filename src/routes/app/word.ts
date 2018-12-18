import { Router } from 'express';
import { AppController } from '../../controllers';

const router = Router();

const {
	authenticate,
} = AppController.AuthController;

const {
	_get_,
} = AppController.WordController;

router.get('/',
	authenticate,
	_get_,
);

export default router;