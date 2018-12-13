import { IValidator } from '../types';
import { required } from './base';

const MSG = {
	CONTENT_REQUIRED: 'CONTENT_REQUIRED',
};

export const contentRequired: IValidator = required(MSG.CONTENT_REQUIRED);