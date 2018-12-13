import { IWsAuthRequest, IWsData } from '../../../types';
import { WsMessageType } from '../../../utils';
import { User, Friend, IUserDocument, IFriendDocument } from '../../../models';

interface IWelcomeRequest extends IWsAuthRequest {
	friend: IUserDocument,
}

const msgPrefix: string = 'user/welcome';

const checkInput = async (
	req: IWelcomeRequest, data: IWsData['data'], next: Function
): Promise<void> => {
	try {
		if (!data.to) {
			req.ws.send(JSON.stringify({
				type: WsMessageType.error,
				message: `${msgPrefix}/INSUFFICIENT_INPUT_DATA`
			}));
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

const checkUser = async (
	req: IWelcomeRequest, data: IWsData['data'], next: Function
): Promise<void> => {
	try {
		req.friend = await User.findOne({ nickname: data.to });
		if (!req.friend) {
			req.ws.send(JSON.stringify({
				type: WsMessageType.error,
				message: `${msgPrefix}/USER_NOT_EXIST`
			}));
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

const checkUserIsFriend = async (
	req: IWelcomeRequest, data: IWsData['data'], next: Function
): Promise<void> => {
	try {
		var isFriend: IFriendDocument;

		isFriend = await Friend.findOne({
			users: { $all: [ req.auth.user._id, req.friend._id ] }
		});
		if (!isFriend) {
			req.ws.send(JSON.stringify({
				type: WsMessageType.error,
				message: `${msgPrefix}/NOT_FRIEND`
			}));
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

const sendMessage = async (
	req: IWelcomeRequest, data: IWsData['data'], next: Function
): Promise<void> => {
	try {
		req.friend.wsSend(req.clients, {
			type: WsMessageType.welcome,
			item: {
				from: req.auth.user.nickname
			}
		});
		next();
	} catch (err) {
		next(err);
	}
}

export default [
	checkInput,
	checkUser,
	checkUserIsFriend,
	sendMessage,
];