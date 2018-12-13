import { Types } from 'mongoose';
import { Response, NextFunction } from 'express';

export default (msgPrefix: string, prop: string) => async (
	req: any, res: Response, next: NextFunction
): Promise<void> => {
	try {
		if (req[prop] && !Types.ObjectId.isValid(req[prop])) {
			res.status(400).json({
				message: `${msgPrefix}/INVALID_ID`
			});
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}