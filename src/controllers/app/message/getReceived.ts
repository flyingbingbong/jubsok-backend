import { Message, IMessageDocument } from '../../../models';
import { IAuthRequest } from '../../../types';
import { Response, NextFunction } from 'express';
import { FieldHelper, CursorPagination, checkId } from '../helpers';

interface IGetReceivedRequest extends IAuthRequest {
	cursor: string | null,
	items: Array<IMessageDocument>,
	nextCursor: string | null
}

const msgPrefix: string = 'message/getReceived';
const pageSize: number = 10;
const idField: string = 'id';

const decryptCursor = CursorPagination.decryptCursor(msgPrefix);

const checkCursor = checkId(msgPrefix, 'cursor');

const _get_ = async (
	req: IGetReceivedRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		var extraMatch: any = {};

		if (req.query.unread === true)
			extraMatch.read = false;
		req.items = await Message.getReceived(
			req.auth.user,
			req.cursor,
			pageSize,
			extraMatch
		);
		next();
	} catch (err) {
		next(err);
	}
}

const encryptNextCursor = CursorPagination.encryptNextCursor(pageSize, idField);

const modifyField = async (
	req: IGetReceivedRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		const { encrypt, doAll } = FieldHelper;

		req.items.forEach(
			doAll([ encrypt(idField), encrypt('chatRoomId') ])
		);
		res.status(200).json({
			items: req.items,
			next: req.nextCursor
		});
		next();
	} catch (err) {
		next(err);
	}
}

export default [
	decryptCursor,
	checkCursor,
	_get_,
	encryptNextCursor,
	modifyField
];