import { connection, Model, Schema, Document, Types } from 'mongoose';
import { IMessage } from '../types';
import { IMessageDocument, IUserDocument } from '../models';
import { MessageValidator } from '../validators';

export const messageTypes = {
	message: 'message',
	friendRequest: 'friendRequest',
	receiveFriendRequest: 'receiveFriendRequest',
	chatRequest: 'chatRequest'
};
export interface IMessageDocument extends IMessage, Document {
	toJSON(): IMessageDocument,
	deleteReceived(): Promise<void>,
	deleteSent(): Promise<void>,
	hasRead(): Promise<void>
};
export interface IMessageModel extends Model<IMessageDocument> {
	getReceived(
		user: IUserDocument, cursor: string | null, pageSize: number, extraOptions: any
	): Promise<Array<IMessageDocument>>,
	getSent(
		user: IUserDocument, cursor: string | null, pageSize: number, extraOptions: any
		): Promise<Array<IMessageDocument>>,
	_create_(
		from: IUserDocument, to: IUserDocument, input: any
	): Promise<IMessageDocument>
};

const {
	typeAllowed
} = MessageValidator;

const MessageSchema: Schema = new Schema({
	from: { type: Schema.Types.ObjectId, required: true },
	to: { type: Schema.Types.ObjectId, required: true },
	content: { type: String, required: true },
	type: {
		type: String,
		required: true,
		validate: typeAllowed
	},
	read: { type: Boolean, default: false },
	senderDelete: { type: Boolean, default: false },
	recipientDelete: { type: Boolean, default: false },
	chatRoomId: Schema.Types.ObjectId
},
{
	timestamps: { createdAt: true, updatedAt: false }
});

MessageSchema.statics.getReceived = async function(
	user: IUserDocument,
	cursor: string | null,
	pageSize: number,
	extraMatch: any={}
): Promise<Array<IMessageDocument>> {
	try {
		var messages: Array<IMessageDocument>;

		if (cursor)
			extraMatch._id = { $lt: Types.ObjectId(cursor) };
		messages = await this.aggregate([
			{ $match: {
				...extraMatch,
				to: user._id,
				recipientDelete: false
			}},
			{ $lookup: {
				from: 'users',
				foreignField: '_id',
				localField: 'from',
				as: 'from'
			}},
			{ $unwind: '$from' },
			{ $sort: { _id: -1 }},
			{ $limit: pageSize },
			{ $project: {
				content: 1,
				type: 1,
				createdAt: 1,
				id: '$_id',
				read: 1,
				chatRoomId: 1,
				from: { nickname: 1, gender: 1 }
			}},
			{ $project: { _id: 0 }}
		]);
		return messages;
	} catch (err) {
		throw err;
	}
}

MessageSchema.statics.getSent = async function(
	user: IUserDocument,
	cursor: string | null,
	pageSize: number,
	extraMatch: any={}
): Promise<Array<IMessageDocument>> {
	try {
		var messages: Array<IMessageDocument>;

		if (cursor)
			extraMatch._id = { $lt: Types.ObjectId(cursor) };
		messages = await Message.aggregate([
			{ $match: {
				...extraMatch,
				from: user._id,
				senderDelete: false
			}},
			{ $lookup: {
				from: 'users',
				foreignField: '_id',
				localField: 'to',
				as: 'to'
			}},
			{ $unwind: '$to' },
			{ $sort: { _id: -1 }},
			{ $limit: pageSize },
			{ $project: {
				content: 1,
				type: 1,
				createdAt: 1,
				id: '$_id',
				to: { nickname: 1, gender: 1 }
			}},
			{ $project: { _id: 0 }}
		]);
		return messages;
	} catch (err) {
		throw err;
	}
}

MessageSchema.statics._create_ = async function(
	from: IUserDocument,
	to: IUserDocument,
	input: any
): Promise<IMessageDocument> {
	try {
		var newMessage: IMessageDocument = new Message({
			...input,
			from: from._id,
			to: to._id
		});

		await newMessage.save();
		return newMessage;
	} catch (err) {
		throw err;
	}
}

MessageSchema.methods.deleteReceived = async function(): Promise<void> {
	try {
		if (this.senderDelete === true) {
			await this.remove();
		} else {
			this.recipientDelete = true;
			await this.save();
		}
	} catch (err) {
		throw err;
	}
}

MessageSchema.methods.deleteSent = async function(): Promise<void> {
	try {
		if (this.recipientDelete === true) {
			await this.remove();
		} else {
			this.senderDelete = true;
			await this.save();
		}
	} catch (err) {
		throw err;
	}
}

MessageSchema.methods.hasRead = async function(): Promise<void> {
	try {
		this.read = true;
		await this.save();
	} catch (err) {
		throw err;
	}
}

export const Message: IMessageModel =
	connection.model<IMessageDocument, IMessageModel>('messages', MessageSchema);