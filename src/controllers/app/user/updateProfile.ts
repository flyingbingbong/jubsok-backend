import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../../types';
import { UserValidator, validateInput } from '../../../validators';
import { Word, IUserDocument } from '../../../models';

const msgPrefix: string = 'user/updateProfile';

interface IUpdateProfileRequest extends IAuthRequest {
	oldWords: Array<string>
}

const checkInput = async (
	req: IUpdateProfileRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		const { nicknameNeverModified, genderNeverModified } = UserValidator;
		var extraValidators: any;

		extraValidators = {
			nickname: nicknameNeverModified(req.auth.user),
			gender: genderNeverModified(req.auth.user)
		};
		try {
			await validateInput(req.body, UserValidator.validationMap, extraValidators);
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

const assignWordsBeforeUpdate = async (
	req: IUpdateProfileRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		if (req.body.favorites || req.body.interests) {
			req.oldWords = req.auth.user.favorites
				.map(v => v.content)
				.concat(req.auth.user.interests);
		}
		next();
	} catch (err) {
		next(err);
	}
}

const updateProfile = async (
	req: IUpdateProfileRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		req.auth.user = await req.auth.user.updateProfile(req.body);
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

const updateWords = async (
	req: IUpdateProfileRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		var newWords: Array<string>;
		var toUpdate: Array<string>;

		if (req.oldWords) {
			newWords = req.auth.user.favorites
				.map(v => v.content)
				.concat(req.auth.user.interests);
			await Word.updateMany(
				{ content: { $in: req.oldWords }},
				{ $inc: { freq: -1 }}
			);
			toUpdate = (await Word.find({ content: { $in: newWords }}))
				.map(w => w.content);
			await Word.updateMany(
				{ content: { $in: toUpdate }},
				{ $inc: { freq: 1 }}
			);
			await Word.insertMany(
				newWords
					.filter(w => toUpdate.indexOf(w) === -1)
					.filter((w, i, self) => self.indexOf(w) === i)
					.map(w => ({ content: w }))
			);
			await Word.deleteMany({ freq: { $lte: 0 }});
		}
		res.status(200).end();
		next();
	} catch (err) {
		next(err);
	}
}

export default [
	checkInput,
	assignWordsBeforeUpdate,	
	updateProfile,
	updateWords,
];