import { Response, NextFunction } from 'express';
import { AES } from '../../../utils';

export const decryptMessageId = (msgPrefix: string) => async (
	req: any, res: Response, next: NextFunction
): Promise<void> => {
	try {
		try {
			req.messageId = AES.decrypt(req.body.id);
		} catch (err) {
			if (err.name === 'TypeError') {
				res.status(400).json({
					message: `${msgPrefix}/INVALID_MESSAGE_ID`
				})
				return;
			}
		}
		next();
	} catch (err) {
		next(err);
	}
}