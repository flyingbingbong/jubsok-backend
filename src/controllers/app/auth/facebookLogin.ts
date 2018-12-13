import { Response, NextFunction } from 'express';
import * as passport from 'passport';
import { IRequest } from '../../../types';
import { User } from '../../../models';

interface IFacebookLoginRequest extends IRequest {
	publicKey?: string
}

const msgPrefix: string = 'auth/facebook-login';

const checkPublicKeyExist = async (
	req: IFacebookLoginRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		if (!req.body.publicKey) {
			res.status(400).json({
				message: `${msgPrefix}/PUBLICKEY_REQUIRED`
			});
			return;
		}
		req.publicKey = req.body.publicKey;
		next();
	} catch (err) {
		next(err);
	}
}

const login = async (
	req: IFacebookLoginRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		await passport.authenticate('facebook-token', { session: false })(req, res, next);
		if (!req.user) {
			res.status(401).json({
				message: `${msgPrefix}/USER_NOT_FOUND`
			});
			return;
		}
		req.auth = {
			id: req.user.id,
			user: await User.findOne({ 'facebookProvider.id': req.user.id })
		};
		next();
	} catch (err) {
		next(err);
	}
}

export default [ checkPublicKeyExist, login ];