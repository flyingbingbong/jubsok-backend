import { Response, NextFunction } from 'express';
import { AES } from '../../../utils';

export const decryptCursor = (msgPrefix: string) => async (
	req: any, res: Response, next: NextFunction
): Promise<void> => {
	try {
		try {
			req.cursor = (req.query.next)
				? AES.decrypt(req.query.next)
				: null;
		} catch (err) {
			if (err.name === 'TypeError') {
				res.status(400).json({
					message: `${msgPrefix}/INVALID_CURSOR`
				});
				return;
			}
		}
		next();
	} catch (err) {
		next(err);
	}
}

export const encryptNextCursor = (pageSize: number, field: string) => async (
	req: any, res: Response, next: NextFunction
): Promise<void> => {
	try {
		if (!req.items || !Array.isArray(req.items)) {
			res.status(500);
			return;
		}
		req.nextCursor = (req.items.length === pageSize)
			? AES.encrypt(req.items[req.items.length - 1][field].toString())
			: null;
		next();
	} catch (err) {
		next(err);
	}
}