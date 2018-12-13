import { Response, NextFunction } from 'express';
import { IAuthRequest, ISession } from '../../../types';
import { RedisHashKey } from '../../../utils';

interface IAddSessionRequest extends IAuthRequest {
	refreshToken: string,
	publicKey: string
}

const MAX_SESSION_COUNT: number = 5;

export default async function(
	req: IAddSessionRequest, res: Response, next: NextFunction
): Promise<void> {
	try {
		var sessions: Array<ISession> = req.auth.user.sessions || [];
		var toRemove: ISession;

		if (sessions.length >= MAX_SESSION_COUNT) {
			sessions.sort((a, b) => (
				a.lastSeen > b.lastSeen ? -1 : 1 // DESC
			));
			while (sessions.length >= MAX_SESSION_COUNT) {
				toRemove = sessions.pop();
				await req.redis.hdel(
					RedisHashKey.refreshTokens, toRemove.refreshToken
				);
			}
		}
		req.auth.user.sessions.push({
			refreshToken: req.refreshToken,
			publicKey: req.publicKey
		});
		await req.auth.user.save(); 
		next();
	} catch (err) {
		next(err);
	}
}