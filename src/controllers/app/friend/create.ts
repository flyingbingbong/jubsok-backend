import { IAuthRequest } from '../../../types';
import { Response, NextFunction } from 'express';
import { AES, WsMessageType } from '../../../utils';
import {
	Friend, Message, User,
	IUserDocument, IMessageDocument, IFriendDocument,
	messageTypes
} from '../../../models';
import { checkId } from '../helpers';

interface ICreateFriendRequest extends IAuthRequest{
	messageId: string | null,
	message: IMessageDocument | null,
	friend: IUserDocument | null,
}

const msgPrefix: string = 'friend/create';
const replyMsgContent: string = '친구 신청을 수락합니다'

const checkInput = async (
	req: ICreateFriendRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		if (!req.body.messageId) {
			res.status(400).json({
				message: `${msgPrefix}/MESSAGE_ID_NOT_EXIST`
			});
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

const decryptMessageId = async (
	req: ICreateFriendRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		try {
			req.messageId = AES.decrypt(req.body.messageId);
		} catch (err) {
			if (err.name === 'TypeError') {
				res.status(400).json({
					message: `${msgPrefix}/INVALID_MESSAGE_ID`
				})
				return;
			}
		}
		next();
	} catch (err) {
		next(err);
	}
}

const checkMessageId = checkId(msgPrefix, 'messageId');

const checkMessageExist = async (
	req: ICreateFriendRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		req.message = await Message.findOne({
			_id: req.messageId,
			to: req.auth.user._id,
			type: messageTypes.friendRequest
		});
		if (!req.message) {
			res.status(400).json({
				message: `${msgPrefix}/MESSAGE_NOT_EXIST`
			});
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

const checkFriendExist = async (
	req: ICreateFriendRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		req.friend = await User.findOne({ _id: req.message.from });
		if (!req.friend) {
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

const checkAlreadyFriend = async (
	req: ICreateFriendRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		var alreadyFriend: IFriendDocument | null;
		
		alreadyFriend = await Friend.findOne({
			users: { $all: [ req.auth.user._id, req.friend._id ] }
		});
		if (alreadyFriend) {
			res.status(400).json({
				message: `${msgPrefix}/ALREADY_FRIEND`
			});
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

const create = async (
	req: ICreateFriendRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		await Friend.create({ users: [ req.auth.user._id, req.friend._id ] });
		res.status(200).end();
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

const createReplyMessage = async (
	req: ICreateFriendRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		await Message._create_(
			req.auth.user,
			req.friend,
			{
				content: replyMsgContent,
				type: messageTypes.receiveFriendRequest
			}
		);
		next();
	} catch (err) {
		next(err);
	}
}

const sendReplyMessage = async (
	req: ICreateFriendRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		req.friend.wsSend(req.wsClients, {
			type: WsMessageType.message,
			item: { from: req.auth.user.nickname }
		});
		next();
	} catch (err) {
		next(err);
	}
}

export default [
	checkInput,
	decryptMessageId,
	checkMessageId,
	checkMessageExist,
	checkFriendExist,
	checkAlreadyFriend,
	create,
	createReplyMessage,
	sendReplyMessage,
];