import { IWsData, IWsAuthRequest } from '../../../types';
import { User } from '../../../models';

export default async function(
	req: IWsAuthRequest, data: IWsData['data'], next: Function
): Promise<void> {
	try {
		const now: Date = new Date();

		req.ws.isAlive = true;
		req.auth.user.lastSeen = now;
		req.auth.user.sessions.find(
			v => v._id.toString() === req.ws.sessionId
		).lastSeen = now;
		await req.auth.user.save();
		next();
	} catch (err) {
		next(err);
	}
}