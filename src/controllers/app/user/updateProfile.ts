import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../../types';
import { UserValidator, validateInput } from '../../../validators';

const msgPrefix: string = 'user/updateProfile';

const checkInput = async (
	req: IAuthRequest, res: Response, next: NextFunction
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

const update = async (
	req: IAuthRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		await req.auth.user.updateProfile(req.body);
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

export default [ checkInput, update ];