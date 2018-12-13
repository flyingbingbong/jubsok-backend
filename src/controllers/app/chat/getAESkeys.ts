import { IAuthRequest } from '../../../types';
import { Response, NextFunction } from 'express';
import { AES } from '../../../utils';
import { IChatRoomDocument, ChatRoom } from '../../../models';
import leaveRooms from './leaveRooms';
import { checkId } from '../helpers';

interface IGetAESkeysRequest extends IAuthRequest {
	chatRoomId: string | null,
	room: IChatRoomDocument | null,
}

const msgPrefix: string = 'chat/getAESkeys';

const checkInput = async (
	req: IGetAESkeysRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		if (!req.query.chatRoomId) {
			res.status(400).json({
				message: `${msgPrefix}/CHATROOM_ID_REQUIRED`
			});
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

const decryptChatRoomId = async (
	req: IGetAESkeysRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		try {
			req.chatRoomId = AES.decrypt(req.query.chatRoomId);
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
	req: IGetAESkeysRequest, res: Response, next: NextFunction
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

const getKeys = async (
	req: IGetAESkeysRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		res.status(200).json({
			keys: req.room.keys
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
	leaveRooms,
	getKeys,
];