import { Router } from 'express';
import { AppController } from '../../controllers';

const router = Router();

const {
	getReceived,
	getSent,
	create,
	deleteReceived,
	deleteSent,
	hasRead,
} = AppController.MessageController;

const {
	authenticate
} = AppController.AuthController;

const {
	nicknameRequired,
	weeklyTastesRequired
} = AppController.UserController;

router.get('/received',
	authenticate,
	getReceived
);

router.get('/sent',
	authenticate,
	getSent
);

router.post('/',
	authenticate,
	nicknameRequired,
	weeklyTastesRequired,
	create
);

router.delete('/received',
	authenticate,
	deleteReceived,
);

router.delete('/sent',
	authenticate,
	deleteSent,
);

router.put('/',
	authenticate,
	hasRead,
);

export default router;