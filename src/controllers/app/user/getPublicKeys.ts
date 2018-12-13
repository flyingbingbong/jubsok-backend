import { Response, NextFunction } from 'express';
import { IAuthRequest, ISession } from '../../../types';
import { User, IUserDocument } from '../../../models';
import { leaveRooms } from '../chat';

interface IGetPublickeysRequest extends IAuthRequest {
	userToChat: IUserDocument | null
}

const msgPrefix: string = 'user/getPublickeys';

const checkInput = async (
	req: IGetPublickeysRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		if (!req.query.nickname) {
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

const checkUserExist = async (
	req: IGetPublickeysRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		req.userToChat = await User.findOne({ nickname: req.query.nickname });
		if (!req.userToChat) {
			res.status(400).json({
				message: `${msgPrefix}/USER_NOT_EXIST`
			});
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

const getKeys = async (
	req: IGetPublickeysRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		const keys = req.userToChat.sessions.map((v: ISession) => v.publicKey);

		res.status(200).json({ keys });
		next();
	} catch (err) {
		next(err);
	}
}

export default [
	checkInput,
	checkUserExist,
	leaveRooms,
	getKeys
];