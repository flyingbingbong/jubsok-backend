import { Schema } from 'mongoose';
import { IValidator } from '../types';
import { required } from './base';

const MSG = {
	CONTENT_REQUIRED: 'CONTENT_REQUIRED',
	INVALID_USER_COUNT: 'INVALID_USER_COUNT',
	USER_DUPLICATE: 'USER_DUPLICATE',
	ROOM_KEY_REQUIRED: 'ROOM_KEY_REQUIRED',
};

export const contentRequired: IValidator = required(MSG.CONTENT_REQUIRED);

export const userCount: IValidator = {
	validator: async (v: Array<Schema.Types.ObjectId>): Promise<boolean> => (
		v.length >= 1 && v.length <= 2
	),
	message: MSG.INVALID_USER_COUNT
};

export const userNotDuplicate: IValidator = {
	validator: async (v: Array<Schema.Types.ObjectId>): Promise<boolean> => (
		v.filter((v, i, a) => a.indexOf(v) === i).length === v.length
	),
	message: MSG.USER_DUPLICATE
}

export const keyExist: IValidator = {
	validator: async (v: Array<string>): Promise<boolean> => (
		v && v.length > 0
	),
	message: MSG.ROOM_KEY_REQUIRED
}