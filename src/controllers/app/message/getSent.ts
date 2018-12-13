import { Message, IMessageDocument } from '../../../models';
import { IAuthRequest } from '../../../types';
import { Response, NextFunction } from 'express';
import { FieldHelper, CursorPagination, checkId } from '../helpers';

interface IGetSentRequest extends IAuthRequest {
	cursor: string | null,
	items: Array<IMessageDocument>,
	nextCursor: string | null
}

const msgPrefix: string = 'message/getSent';
const pageSize: number = 10;
const idField: string = 'id';

const decryptCursor = CursorPagination.decryptCursor(msgPrefix);

const checkCursor = checkId(msgPrefix, 'cursor');

const _get_ = async (
	req: IGetSentRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		req.items = await Message.getSent(
			req.auth.user,
			req.cursor,
			pageSize,
			{}
		);
		next();
	} catch (err) {
		next(err);
	}
}

const encryptNextCursor = CursorPagination.encryptNextCursor(pageSize, idField);

const modifyField = async (
	req: IGetSentRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		const { encrypt } = FieldHelper;

		req.items.forEach(encrypt(idField));
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