import { Schema, Types } from 'mongoose';

export interface IFavorite {
	content: string,
	point: number
}

export interface IfacebookProvider {
	id: string,
	token: string
}

export interface ISession {
	_id: Schema.Types.ObjectId,
	refreshToken: string,
	publicKey: string,
	lastSeen: Date
}

export interface IUser {
	facebookProvider: IfacebookProvider,
	nickname?: string,
	comment?: string,
	lastSeen?: Date,
	favorites?: Array<IFavorite>,
	interests?: Array<string>,
	weeklyTastes?: Array<number>,
	gender?: string,
	sessions?: Types.Array<ISession>,
	createdAt?: Date,
	updatedAt?: Date
}

export interface ISearchedUser {
	_id?: string,
	nickname: string,
	gender: string,
	comment: string,
	favorites: Array<string>,
	lastSeen: Date,
}