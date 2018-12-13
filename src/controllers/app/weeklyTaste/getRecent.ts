import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../../types';
import { WeeklyTaste } from '../../../models';

export default async function(
	req: IAuthRequest, res: Response, next: NextFunction
): Promise<void> {
	try {
		var recent: Array<Array<string>>;

		recent = await WeeklyTaste.getRecent();
		res.status(200).json({ recent });
		next();
	} catch (err) {
		next(err);
	}
}