import { MessageRouter } from './wsMessageRouter';
import { IWsData, IWsClient, IWsRequest } from '../../types';
import { Data } from 'ws';
import { WsMessageType } from '../../utils';

const msgPrefix: string = 'ws/onmessage';

export default (ws: IWsClient, clients: any, messageRouter: MessageRouter) =>
	async (data: Data): Promise<void> => {
		try {
			var JSONdata: IWsData;
			var req: IWsRequest;

			if (!data)
				return;
			req = { ws, clients };
			try {
				JSONdata = JSON.parse(<string>data);	
			} catch (err) {
				ws.send(JSON.stringify({
					type: WsMessageType.error,
					message: `${msgPrefix}/${err.message}`
				}));
				return;
			}
			await messageRouter.handle(req, JSONdata, msgPrefix);
		} catch (err) {
			// mail(err);
			throw err;
		}
	}