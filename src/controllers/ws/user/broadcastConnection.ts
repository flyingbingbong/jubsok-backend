import { IWsData, IWsAuthRequest } from '../../../types';
import { WsMessageType } from '../../../utils';
import { Friend } from '../../../models';

interface IBroadcastConnectionRequest extends IWsAuthRequest {
	sessions: Array<string>
}

const getSessions = async (
	req: IBroadcastConnectionRequest, data: IWsData['data'], next: Function
): Promise<void> => {
	try {
		req.sessions = await Friend.activeSessions(req.auth.user);
		next();
	} catch (err) {
		throw err;
	}
}

const broadcast = async (
	req: IBroadcastConnectionRequest, data: IWsData['data'], next: Function
): Promise<void> => {
	try {
		var promises: Array<Promise<void>> = [];

		for (let s of req.sessions) {
			if (!req.clients[s])
				continue;
			promises.push((async () => {
				try {
					req.clients[s].send(JSON.stringify({
						type: WsMessageType.friendConnected,
						item: { nickname: req.auth.user.nickname }
					}));
				} catch (err) {
					throw err;
				}
			})());
		}
		await Promise.all(promises);
		next();
	} catch (err) {
		throw err;
	}
}

export default [ getSessions, broadcast ];