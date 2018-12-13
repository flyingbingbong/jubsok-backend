import { Router } from 'express';
import { AppController } from '../../controllers';

const router = Router();

const {
	createChat,
	createRoom,
	getAESkeys,
	getChats
} = AppController.ChatController;

const {
	authenticate
} = AppController.AuthController;

router.post('/',
	authenticate,
	createChat
);

router.post('/room',
	authenticate,
	createRoom
);

router.get('/aeskeys',
	authenticate,
	getAESkeys,
);

router.get('/',
	authenticate,
	getChats,
);

export default router;