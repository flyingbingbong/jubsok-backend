import * as jwt from 'jsonwebtoken';
import { IRequest } from '../../../types';
import { Response, NextFunction } from 'express';
import { User, IUserDocument } from '../../../models';

interface IAuthenticateRequest extends IRequest {
	decoded?: any
}

const msgPrefix: string = 'auth/authenticate';
const JWT_SECRET: string = <string>process.env.JWT_SECRET;
const tokenField: string = 'x-auth-token';

const checkInput = async (
	req: IAuthenticateRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		if (!req.header(tokenField)) {
			res.status(400).json({
				message: `${msgPrefix}/ACCESS_TOKEN_NOT_EXIST`
			});
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

const verifyToken = async (
	req: IAuthenticateRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		var decoded: any;
		var errMessage: string;

		try {
			decoded = await jwt.verify(req.header(tokenField), JWT_SECRET);
		} catch (err) {
			switch (err.name) {
				case 'TokenExpiredError':
					errMessage = 'ACCESS_TOKEN_EXPIRED';
					break;
				case 'JsonWebTokenError':
					errMessage = 'INVALID_TOKEN';
					break;
				default:
					throw err;
			}
			res.status(401).json({
				message: `${msgPrefix}/${errMessage}`
			});
			return;
		}
		req.decoded = decoded;
		next();
	} catch (err) {
		next(err);
	}
}

const checkUserExist = async (
	req: IAuthenticateRequest, res: Response, next: NextFunction	
): Promise<void> => {
	try {
		var user: IUserDocument | null;

		user = await User.findOne({ 'facebookProvider.id': req.decoded.id });
		if (!user) {
			res.status(401).json({
				message: `${msgPrefix}/USER_NOT_FOUND`
			});
			return;
		}
		req.auth = {
			id: req.decoded.id,
			user
		};
		next();
	} catch (err) {
		next(err);
	}
}

export default [ checkInput, verifyToken, checkUserExist ];