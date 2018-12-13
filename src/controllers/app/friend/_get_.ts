import { Friend, activeUserSeconds } from '../../../models';
import { IAuthRequest, IFriendOutput } from '../../../types';
import { Response, NextFunction } from 'express';
import { FieldHelper, CursorPagination, checkId } from '../helpers';

interface IGetFriendsRequest extends IAuthRequest {
	cursor: string | null,
	items: Array<IFriendOutput>,
	nextCursor: string | null
}

const msgPrefix: string = 'friend/get';
const pageSize: number = 30;

const decryptCursor = CursorPagination.decryptCursor(msgPrefix);

const checkCursor = checkId(msgPrefix, 'cursor');

const _get_ = async (
	req: IGetFriendsRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		const now: Date = new Date();
		const activeTime: Date = new Date();
		var extraMatch: any = {};

		if (req.query.active === true) {
			activeTime.setSeconds(now.getSeconds() - activeUserSeconds)
			extraMatch.lastSeen = {
				$gt: activeTime
			}
		}
		req.items = await Friend.fromUser(
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

const encryptNextCursor = CursorPagination.encryptNextCursor(pageSize, '_id');

const modifyField = async (
	req: IGetFriendsRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		const { _delete_ } = FieldHelper;

		req.items.forEach(_delete_('_id'));
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