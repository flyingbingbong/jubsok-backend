import { Response, NextFunction } from 'express';
import { IAuthRequest, IChatOutput } from '../../../types';
import { ChatRoom, IChatRoomDocument } from '../../../models';
import { AES } from '../../../utils';
import { FieldHelper, CursorPagination, checkId } from '../helpers';

interface IGetChatsRequest extends IAuthRequest {
	cursor: string | null,
	chatRoomId: string | null,
	items: Array<IChatOutput>,
	room: IChatRoomDocument | null,
	nextCursor: string | null,
}

const msgPrefix: string = 'chat/getChats';
const pageSize: number = 30;

const checkInput = async (
	req: IGetChatsRequest, res: Response, next: NextFunction
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
	req: IGetChatsRequest, res: Response, next: NextFunction
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
	req: IGetChatsRequest, res: Response, next: NextFunction
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

const decryptCursor = CursorPagination.decryptCursor(msgPrefix);

const checkCursor = checkId(msgPrefix, 'cursor');

const _get_ = async (
	req: IGetChatsRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		req.items = await req.room.getChats(
			req.cursor,
			pageSize,
			{}
		);
		next();
	} catch (err) {
		next(err);
	}
}

const encryptNextCursor = CursorPagination.encryptNextCursor(pageSize, '_id');

const modifyField = async (
	req: IGetChatsRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		const { _delete_ } = FieldHelper;

		req.items.forEach(_delete_('_id'));
		res.status(200).json({
			items: req.items,
			next: req.nextCursor,
			createdAt: req.room.createdAt
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
	decryptCursor,
	checkCursor,
	_get_,
	encryptNextCursor,
	modifyField
];