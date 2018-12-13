import { Message, IMessageDocument } from '../../../models';
import { IAuthRequest } from '../../../types';
import { Response, NextFunction } from 'express';
import { checkId, MessageHelper } from '../helpers';

interface IDeleteMessageRequest extends IAuthRequest {
	messageId: string,
	message: IMessageDocument | null
}

const msgPrefix: string = 'message/deleteReceived';

const checkInput = async(
	req: IDeleteMessageRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		if (!(req.body.id && typeof req.body.id === 'string')) {
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

const decryptMessageId = MessageHelper.decryptMessageId(msgPrefix);

const checkMessageId = checkId(msgPrefix, 'messageId');

const checkMessageExist = async (
	req: IDeleteMessageRequest, res: Response, next: NextFunction	
): Promise<void> => {
	try {
		req.message = await Message.findOne({
			_id: req.messageId,
			to: req.auth.user._id
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

const _delete_ = async (
	req: IDeleteMessageRequest, res: Response, next: NextFunction	
): Promise<void> => {
	try {
		await req.message.deleteReceived();
		res.status(200).end();
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
	_delete_
];