import { Response, NextFunction } from 'express';
import { IAuthRequest, ISearchedUser } from '../../../types';
import { User, activeUserSeconds } from '../../../models';
import { UserValidator, validateInput } from '../../../validators';
import { FieldHelper, CursorPagination, checkId } from '../helpers';

interface ISearchUserRequest extends IAuthRequest {
	items: Array<ISearchedUser>,
}

const msgPrefix: string = 'user/search';
const pageSize: number = 30;

const checkInput = async (
	req: ISearchUserRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		if (!(req.query.gender || req.query.weeklyTastes || req.query.text)) {
			res.status(400).json({
				message: `${msgPrefix}/INSUFFICIENT_QUERY`
			});
			return;
		}
		try {
			if (req.query.weeklyTastes)
				req.query.weeklyTastes = req.query.weeklyTastes.map(v => parseInt(v));
			await validateInput(req.query, UserValidator.searchValidationMap);
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

const search = async (
	req: ISearchUserRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		const now: Date = new Date();
		const activeTime: Date = new Date();

		activeTime.setSeconds(now.getSeconds() - activeUserSeconds)
		req.items = await User.randomSearch(
			req.query.gender || null,
			req.query.weeklyTastes || null,
			req.query.text || null,
			pageSize,
			{ lastSeen: { $gt: activeTime }}
		);
		if (req.items.length < pageSize) {
			req.items = req.items.concat(await User.randomSearch(
				req.query.gender || null,
				req.query.weeklyTastes || null,
				req.query.text || null,
				pageSize,
				{ _id: { $nin: req.items.map(v => v._id) }}
			));
			req.items = req.items.slice(0, pageSize);
		}
		next();
	} catch (err) {
		next(err);
	}
}

const modifyField = async (
	req: ISearchUserRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		const { _delete_ } = FieldHelper;

		req.items.forEach(_delete_('_id'));
		res.status(200).json({
			items: req.items
		});
		next();
	} catch (err) {
		next(err);
	}
}

export default [
	checkInput,
	search,
	modifyField,
];