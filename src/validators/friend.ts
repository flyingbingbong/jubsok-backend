import { IValidator } from '../types';
import { Schema } from 'mongoose';

const MSG = {
	INVALID_USER_COUNT: 'INVALID_USER_COUNT',
	USER_DUPLICATE: 'USER_DUPLICATE',
}

export const userCount: IValidator = {
	validator: async (v: Array<Schema.Types.ObjectId>): Promise<boolean> => (
		v.length === 2
	),
	message: MSG.INVALID_USER_COUNT
}

export const userNotDuplicate: IValidator = {
	validator: async (v: Array<Schema.Types.ObjectId>): Promise<boolean> => (
		v.filter((v2, i, a) => a.indexOf(v2) === i).length === v.length
	),
	message: MSG.USER_DUPLICATE
}