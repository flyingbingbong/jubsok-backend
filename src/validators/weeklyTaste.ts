import { IValidator } from '../types';

const LIST_LENGTH: number = 3;
const GROUP_LENGTH: number = 2;
const MSG = {
	INVALID_LIST_LENGTH: 'INVALID_LIST_LENGTH',
	INVALID_GROUP_LENGTH: 'INVALID_GROUP_LENGTH',
}

export const listLength: IValidator = {
	validator: async (v: Array<Array<string>>): Promise<boolean> => (
		Promise.resolve(v.length == LIST_LENGTH)
	),
	message: MSG.INVALID_LIST_LENGTH
}

export const groupLength: IValidator = {
	validator: async (v: Array<Array<string>>): Promise<boolean> => (
		Promise.resolve(
			v.every((g: Array<string>) => g.length == GROUP_LENGTH)
		)
	),
	message: MSG.INVALID_GROUP_LENGTH
}