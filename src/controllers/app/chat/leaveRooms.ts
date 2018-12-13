import { IAuthRequest } from '../../../types';
import { Response, NextFunction } from 'express';
import { ChatRoom, IChatRoomDocument } from '../../../models';

interface ILeaveRoomRequest extends IAuthRequest {
	room: IChatRoomDocument
}

export default async function(
	req: ILeaveRoomRequest, res: Response, next: NextFunction
): Promise<void> {
	try {
		await ChatRoom.updateMany(
			{
				users: req.auth.user._id,
				_id: { $ne: (req.room) ? req.room._id : null }
			},
			{ $pull: { users: req.auth.user._id }}
		);
		next();
	} catch (err) {
		next(err);
	}
}