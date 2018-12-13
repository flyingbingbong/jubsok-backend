import { Types } from 'mongoose';
import { IWsData } from '../../../types';
import { WsMessageType } from '../../../utils';

export default (msgPrefix: string, prop: string) => async (
	req: any, data: IWsData['data'], next: Function
): Promise<void> => {
	try {
		if (req[prop] && !Types.ObjectId.isValid(req[prop])) {
			req.ws.send(JSON.stringify({
				type: WsMessageType.error,
				message: `${msgPrefix}/INVALID_ID`
			}));
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}