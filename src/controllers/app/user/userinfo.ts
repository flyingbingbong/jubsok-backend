import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../../types';
import { User, IUserDocument } from '../../../models';

interface IUserInfoRequest extends IAuthRequest {
	userinfo: IUserDocument
}

const msgPrefix: string = 'user/userinfo';

const checkInput = async (
	req: IAuthRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		if (!(req.query.nickname && typeof req.query.nickname === 'string')) {
			res.status(400).json({
				message: `${msgPrefix}/USER_NICKNAME_NOT_EXIST`
			});
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

const checkUserExist = async (
	req: IUserInfoRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		req.userinfo = await User.findOne(
			{ nickname: req.query.nickname },
			{
				_id: 0,
				nickname: 1, gender: 1, comment: 1,
				favorites: 1, interests: 1, weeklyTastes: 1
			}
		);
		if (!req.userinfo) {
			res.status(400).json({
				message: `${msgPrefix}/USER_NOT_FOUND`
			});
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

const responseUserinfo = async (
	req: IUserInfoRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		res.status(200).json(req.userinfo.toJSON());
		next();
	} catch (err) {
		next(err);
	}
}

export default [ checkInput, checkUserExist, responseUserinfo ];