import { Schema } from 'mongoose';

export interface IFriendInput {
	nickname: string
}

export interface IFriend {
	users: Array<Schema.Types.ObjectId>,
	createdAt?: Date
}

export interface IFriendOutput {
	_id?: string,
	nickname: string,
	gender: string
}