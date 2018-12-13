import { Router } from 'express';
import { AppController } from '../../controllers';

const router = Router();
const {
	facebookLogin,
	generateAccessToken,
	generateRefreshToken,
	addSession,
	sendToken,
	validateRefreshToken,
} = AppController.AuthController;

router.post('/facebook-login',
	facebookLogin,
	generateAccessToken,
	generateRefreshToken,
	addSession,
	sendToken,
);

router.post('/token',
	validateRefreshToken,
	generateAccessToken,
	sendToken,
);

export default router;