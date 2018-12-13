import { Message, User, IUserDocument } from '../../../models';
import { IAuthRequest } from '../../../types';
import { Response, NextFunction } from 'express';
import { MessageValidator, validateInput } from '../../../validators';
import { WsMessageType } from '../../../utils';

interface ICreateMessageRequest extends IAuthRequest{
	to: IUserDocument | null
}

const msgPrefix: string = 'message/create';

const checkInput = async (
	req: IAuthRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		try {
			await validateInput(req.body, MessageValidator.validationMap);
		} catch (err) {
			res.status(400).json({
				message: `${msgPrefix}/${err.message}`
			});
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

const checkRecipientExist = async (
	req: ICreateMessageRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		req.to = await User.findOne({ nickname: req.body.to });
		if (!req.to) {
			res.status(400).json({
				message: `${msgPrefix}/USER_TO_SEND_NOT_FOUND`
			});
			return;
		}
		next();
	} catch (err) {
		next(err);
	}
}

const create = async (
	req: ICreateMessageRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		const from: IUserDocument = req.auth.user;

		delete req.body.to;
		await Message._create_(from, req.to, req.body);
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

const send = async (
	req: ICreateMessageRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		req.to.wsSend(req.wsClients, {
			type: WsMessageType.message,
			item: { from: req.auth.user.nickname }
		});
		next();
	} catch (err) {
		next(err);
	}
}

export default [ checkInput, checkRecipientExist, create, send ];