import { IRequest } from '../../../types';
import { Response, NextFunction } from 'express';
import { RedisHashKey } from '../../../utils';

const msgPrefix: string = 'auth/validateRefreshToken';

const checkInput = async (
	req: IRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		if (!(req.body.refreshToken && req.body.id)) {
			res.status(400).json({
				message: `${msgPrefix}/REFRESH_TOKEN_NOT_EXIST`
			});
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

const validateToken = async (
	req: IRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		var userinfo: string;

		userinfo = await req.redis.hget(RedisHashKey.refreshTokens, req.body.refreshToken);
		if (req.body.id !== userinfo) {
			res.status(401).json({
				message: `${msgPrefix}/USER_NOT_FOUND`
			});
			return;
		}
		req.auth = {
			id: userinfo
		}
		next(); // generate new access token
	} catch (err) {
		next(err);
	}
}

export default [ checkInput, validateToken ];