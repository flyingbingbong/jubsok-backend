import { IValidator } from '../types';
import { required } from './base';
import { messageTypes } from '../models';

const MSG = {
	CONTENT_REQUIRED: 'CONTENT_REQUIRED',
	TYPE_NOT_ALLOWED: 'TYPE_NOT_ALLOWED',
	REPICIENT_REQUIRED: 'REPICIENT_REQUIRED',
};

export const contentRequired: IValidator = required(MSG.CONTENT_REQUIRED);

export const typeAllowed: IValidator = {
	validator: async (v: string): Promise<boolean> => {
		const types: Array<string> = Object.keys(messageTypes).map(k => messageTypes[k]);
		return types.indexOf(v) !== -1;
	},
	message: MSG.TYPE_NOT_ALLOWED
}

export const recipientRequired: IValidator = required(MSG.REPICIENT_REQUIRED);

export const validationMap = {
	type: [ typeAllowed ],
	content: [ contentRequired ],
	to: [ recipientRequired ],
}