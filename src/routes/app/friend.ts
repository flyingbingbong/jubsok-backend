import { Router } from 'express';
import { AppController } from '../../controllers';

const router = Router();

const {
	_get_,
	create,
	_delete_,
} = AppController.FriendController;

const {
	authenticate
} = AppController.AuthController;

router.get('/',
	authenticate,
	_get_,
);

router.post('/',
	authenticate,
	create,
);

router.delete('/',
	authenticate,
	_delete_,
);

export default router;