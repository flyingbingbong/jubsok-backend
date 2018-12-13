import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../../types';
import { Friend, Message } from '../../../models';

const msgPrefix: string = 'user/delete';

const checkInput = async (
	req: IAuthRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		const confirmMessage = 'DELETE';

		if (!(req.body.confirm && req.body.confirm === confirmMessage)) {
			res.status(400).json({
				message: `${msgPrefix}/INVALID_CONFIRM`
			});
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

const _delete_ = async (
	req: IAuthRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		await req.auth.user.remove();
		res.status(200).end();
		next();
	} catch (err) {
		next(err);
	}
}

export default [ checkInput, _delete_ ];