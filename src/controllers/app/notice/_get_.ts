import { Response, NextFunction } from 'express';
import { IRequest } from '../../../types';
import { Notice, INoticeDocument } from '../../../models';

export default async function(
	req: IRequest, res: Response, next: NextFunction
): Promise<void> {
	try {
		const notices: Array<INoticeDocument> = await Notice.find(
			{ show: true },
			{ _id: 0, content: 1, createdAt: 1 },
			{ sort: { createdAt: -1 }}
		).lean();

		res.status(200).json({
			items: notices
		});
		next();
	} catch (err) {
		next(err);
	}
}