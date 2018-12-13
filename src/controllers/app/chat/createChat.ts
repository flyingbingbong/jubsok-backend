import { IAuthRequest, IChat } from '../../../types';
import { Response, NextFunction } from 'express';
import { WsMessageType, AES } from '../../../utils';
import { IChatRoomDocument, ChatRoom, IUserDocument, User } from '../../../models';
import { checkId } from '../helpers';

interface ICreateChatRequest extends IAuthRequest {
	chatRoomId: string,
	room: IChatRoomDocument,
	recipient: IUserDocument,
	chat: IChat
};

const msgPrefix: string = 'chat/create';

const checkInput = async (
	req: ICreateChatRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		if (!(
			req.body.content && typeof req.body.content === 'string' &&
			req.body.chatRoomId && typeof req.body.chatRoomId === 'string'
		)) {
			res.status(400).json({
				message: `${msgPrefix}/INSUFFICIENT_INPUT_DATA`
			});
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

const decryptChatRoomId = async (
	req: ICreateChatRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		try {
			req.chatRoomId = AES.decrypt(req.body.chatRoomId);
		} catch (err) {
			if (err.name === 'TypeError') {
				res.status(400).json({
					message: `${msgPrefix}/INVALID_CHATROOM_ID`
				});
				return;
			}
		}
		next();
	} catch (err) {
		next(err);
	}
}

const checkChatRoomId = checkId(msgPrefix, 'chatRoomId');

const checkChatRoomExist = async (
	req: ICreateChatRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		req.room = await ChatRoom.findOne({
			_id: req.chatRoomId,
			users: req.auth.user._id
		});
		if (!req.room) {
			res.status(400).json({
				message: `${msgPrefix}/CHATROOM_NOT_EXIST`
			});
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

const getRecipient = async (
	req: ICreateChatRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		req.recipient = await User.findOne({
			_id: req.room.users.find(
				v => v.toString() !== req.auth.user._id.toString()
			)
		});
		if (!req.recipient) {
			res.status(400).json({
				message: `${msgPrefix}/RECIPIENT_NOT_EXIST`
			});
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

const saveChat = async (
	req: ICreateChatRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		req.chat = {
			content: req.body.content,
			user: req.auth.user._id.toString(),
			createdAt: new Date()
		};
		req.room.chats.push(req.chat);
		await req.room.save();
		res.status(200).json({
			createdAt: req.chat.createdAt,
		});
		next();
	} catch (err) {
		next(err);
	}
}

const sendChat = async (
	req: ICreateChatRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		const { content, createdAt } = req.chat;

		req.recipient.wsSend(req.wsClients, {
			type: WsMessageType.chat,
			item: {
				content,
				createdAt,
				user: req.auth.user.nickname
			}
		});
		next();
	} catch (err) {
		next(err);
	}
}

export default [
	checkInput,
	decryptChatRoomId,
	checkChatRoomId,
	checkChatRoomExist,
	getRecipient,
	saveChat,
	sendChat
];