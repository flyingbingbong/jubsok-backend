import { IWsData, IWsRequest } from '../../../types';
import { WsMessageType } from '../../../utils';
import { User } from '../../../models';

const msgPrefix: string = 'user/getUser';

export default async function(
	req: IWsRequest, data: IWsData['data'], next: Function
): Promise<void> {
	try {
		req.auth = { user: await User.findOne({ _id: req.ws.userId }) };
		if (!req.auth.user) {
			req.ws.send(JSON.stringify({
				type: WsMessageType.error,
				message: `${msgPrefix}/USER_NOT_FOUND`
			}));
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}