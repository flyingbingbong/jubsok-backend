import { Router } from 'express';
import { AppController } from '../../controllers';

const router = Router();

const {
	getProfile,
	_delete_,
	search,
	updateProfile,
	getPublicKeys,
	userinfo,
} = AppController.UserController;

const {
	authenticate
} = AppController.AuthController;

router.get('/profile',
	authenticate,
	getProfile
);

router.get('/search',
	authenticate,
	search,
);

router.get('/publickeys',
	authenticate,
	getPublicKeys,
);

router.get('/info',
	authenticate,
	userinfo,
);

router.delete('/',
	authenticate,
	_delete_,
);

router.put('/profile', 
	authenticate,
	updateProfile,
)

export default router;