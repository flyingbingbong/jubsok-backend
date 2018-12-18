import { IWss, IWsClient } from '../../types';
import { WsMessageType } from '../../utils';
import onMessageCb from './onMessage';
import onCloseCb from './onClose';

const msgPrefix: string = 'ws/onconnection';
const pingCycle: number = 3000;

export default (wss: IWss) => async (ws: IWsClient, req): Promise<void> => {
	try {
		const clients: any = wss.clientManager.clients;
		var authError: string | null;

		authError = await wss.clientManager.authenticate(ws, req.url);
		if (authError) {
			ws.send(JSON.stringify({
				type: WsMessageType.error,
				message: `${msgPrefix}/${authError}`
			}));
			ws.close();
			return;
		}
		wss.clientManager.clients[ws.sessionId] = ws;
		ws.isAlive = true;
		ws.heartbeat = setInterval(ping(ws), pingCycle);
		ws.on('close', onCloseCb(wss, ws));
		ws.on('message', onMessageCb(ws, clients, wss.messageRouter));
		ws.on('pong', onMessageCb(ws, clients, wss.messageRouter));
	} catch (err) {
		// mail(err);
		ws.close();
	}
}

export const ping = (ws: IWsClient) => () => {
	if (!ws.isAlive) {
		ws.close();
		return;
	}
	ws.isAlive = false;
	ws.ping();
}