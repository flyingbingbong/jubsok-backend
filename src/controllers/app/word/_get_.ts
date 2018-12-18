import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../../types';
import { Word, IWordDocument } from '../../../models';

const msgPrefix: string = 'word/get';
const pageSize: number = 30;

interface IGetWordRequest extends IAuthRequest {
	page: number
}

const checkInput = async (
	req: IGetWordRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		const { query, page } = req.query;

		if (!query) {
			res.status(400).json({
				message: `${msgPrefix}/QUERY_NOT_EXIST`
			});
			return;
		}
		req.page = parseInt(page);
		req.page = isNaN(req.page) ? 1 : req.page;
		next();
	} catch (err) {
		next(err);
	}
}

const _get_ = async (
	req: IGetWordRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		var words: Array<IWordDocument>;
		
		words = await Word.getByText(
			req.query.query,
			req.page,
			pageSize,
			{}
		);
		res.status(200).json({
			items: words,
			next: req.page + 1
		});
		next();
	} catch (err) {
		next(err);
	}
}

export default [
	checkInput,
	_get_,
];