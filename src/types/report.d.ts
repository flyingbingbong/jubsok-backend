import { Schema } from 'mongoose';

export interface IReport {
	chatRoom: Schema.Types.ObjectId,
	from: Schema.Types.ObjectId,
	content: string,
	roomKey: string,
	createdAt: Date
}
