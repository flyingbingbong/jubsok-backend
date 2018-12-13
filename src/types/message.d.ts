import { Schema } from 'mongoose';

export interface IMessage {
	from: Schema.Types.ObjectId,
	to: Schema.Types.ObjectId,
	content: string,
	type: string,
	read?: boolean,
	senderDelete?: boolean,
	recipientDelete?: boolean,
	chatRoomId?: Schema.Types.ObjectId,
	createdAt?: Date
}