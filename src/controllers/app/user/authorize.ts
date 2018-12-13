import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../../types';

const msgPrefix: string = 'user/authorize';

export const nicknameRequired = async (
	req: IAuthRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		if (!req.auth.user.nickname) {
			res.status(403).json({
				message: `${msgPrefix}/USER_NICKNAME_REQUIRED`
			});
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

export const weeklyTastesRequired = async (
	req: IAuthRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		if (req.auth.user.weeklyTastes.indexOf(-1) !== -1) {
			res.status(403).json({
				message: `${msgPrefix}/USER_WEEKLYTASTES_REQUIRED`
			});
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}