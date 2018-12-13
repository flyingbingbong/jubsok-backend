import { IAuthRequest } from '../../../types';
import { Response, NextFunction } from 'express';
import {
	ChatRoom, Message, User,
	IUserDocument, IChatRoomDocument,
	messageTypes
} from '../../../models';
import { WsMessageType, AES } from '../../../utils';

interface ICreateChatRoomRequest extends IAuthRequest {
	userToChat: IUserDocument | null,
	room: IChatRoomDocument
}

const msgPrefix: string = 'chatRoom/create';
const messageContent: string = '우리 채팅해요';

const checkInput = async (
	req: ICreateChatRoomRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		const AESkeys: Array<string> | undefined = req.body.AESkeys;

		if (!req.body.nickname) {
			res.status(400).json({
				message: `${msgPrefix}/NICKNAME_REQUIRED`
			});
			return;
		}
		if (!(AESkeys && Array.isArray(AESkeys) && AESkeys.length > 0)) {
			res.status(400).json({
				message: `${msgPrefix}/ROOM_KEY_REQUIRED`
			});
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

const checkUserExist = async (
	req: ICreateChatRoomRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		req.userToChat = await User.findOne({ nickname: req.body.nickname });
		if (!req.userToChat) {
			res.status(400).json({
				message: `${msgPrefix}/USER_NOT_FOUND`
			});
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

const createRoom = async (
	req: ICreateChatRoomRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		req.room = new ChatRoom({
			users: [ req.auth.user._id, req.userToChat._id ],
			keys: req.body.AESkeys
		});
		await req.room.save();
		next();
	} catch (err) {
		if (err.name === 'ValidationError') {
			res.status(400).json({
				message: `${msgPrefix}/VALIDATION_ERROR`
			});
			return;
		}
		next(err);
	}
}

const createMessage = async (
	req: ICreateChatRoomRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		await Message._create_(
			req.auth.user,
			req.userToChat,
			{
				content: messageContent,
				type: messageTypes.chatRequest,
				chatRoomId: req.room._id
			}
		);
		res.status(200).end();
		next();
	} catch (err) {
		next(err);
	}
}

const sendMessage = async (
	req: ICreateChatRoomRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		req.userToChat.wsSend(req.wsClients, {
			type: WsMessageType.message,
			item: {
				from: req.auth.user.nickname,
				chatRoomId: AES.encrypt(req.room._id.toString())
			}
		});
		next();
	} catch (err) {
		next(err);
	}
}

export default [
	checkInput,
	checkUserExist,
	createRoom,
	createMessage,
	sendMessage
];