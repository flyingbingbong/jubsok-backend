import { Friend, IUserDocument, User } from '../../../models';
import { IAuthRequest } from '../../../types';
import { Response, NextFunction } from 'express';

const msgPrefix: string = 'friend/create';

const checkInput = async (
	req: IAuthRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		if (!req.body.nickname) {
			res.status(400).json({
				message: `${msgPrefix}/NICKNAME_REQUIRED`
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
		var friend: IUserDocument | null;

		friend = await User.findOne({ nickname: req.body.nickname });
		if (friend) {
			await Friend.deleteOne({
				users: { $all: [ req.auth.user._id, friend._id ] }
			});
		}
		res.status(200).end();
		next();
	} catch (err) {
		next(err);
	}
}

export default [ checkInput, _delete_ ];