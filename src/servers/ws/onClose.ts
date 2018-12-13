import { IWss, IWsClient } from '../../types';
import { User, Friend, IUserDocument } from '../../models';
import { WsMessageType } from '../../utils';

export default (wss: IWss, ws: IWsClient) => async () => {
	try {
		var user: IUserDocument;

		user = await User.findOne({ _id: ws.userId });
		clearInterval(ws.heartbeat);
		delete wss.clientManager.clients[ws.sessionId];
		if (!user.hasOtherActiveSession(ws.sessionId, wss.clientManager.clients))
			await broadcastDisconnection(user, wss.clientManager.clients);
	} catch (err) {
		throw err;
	}
}

export const broadcastDisconnection = async (
	user: IUserDocument, clients: any
): Promise<void> => {
	try {
		var sessions: Array<string>;
		var promises: Array<Promise<void>> = [];
	
		sessions = await Friend.activeSessions(user);
		for (let s of sessions) {
			if (!clients[s])
				continue;
			promises.push((async () => {
				try {
					clients[s].send(JSON.stringify({
						type: WsMessageType.friendDisconnected,
						item: { nickname: user.nickname }
					}));
				} catch (err) {
					throw err;
				}
			})())
		}
		await Promise.all(promises);	
	} catch (err) {
		throw err;
	}
}