import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../../types';
import { IUserDocument } from '../../../models';

export default async function(
	req: IAuthRequest, res: Response, next: NextFunction
): Promise<void> {
	try {
		var profile: IUserDocument | null;

		profile = req.auth.user.getProfile();
		res.status(200).json(profile);
		next();
	} catch (err) {
		next(err);
	}
}
