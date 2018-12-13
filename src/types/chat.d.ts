import { Schema } from 'mongoose';

export interface IChat {
	content: string,
	user: Schema.Types.ObjectId
	createdAt?: Date,
}

export interface IChatRoom {
	chats: Array<IChat>,
	users: Array<Schema.Types.ObjectId>,
	keys: Array<string>,
	createdAt?: Date,
	updatedAt?: Date
}

export interface IChatOutput {
	_id?: string,
	content: string,
	user: {
		nickname: string
	},
	createdAt: Date
}