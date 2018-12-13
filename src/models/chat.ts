import { connection, Model, Schema, Document, Types } from 'mongoose';
import { IChatRoom, IChat, IChatOutput } from '../types';
import { ChatValidator } from '../validators';

export interface IChatRoomDocument extends IChatRoom, Document {
	getChats(
		cursor: string | null, pageSize: number, extraMatch: any
	): Promise<Array<IChatOutput>>
};
export interface IChatDocument extends IChat, Document {};
export interface IChatRoomModel extends Model<IChatRoomDocument> {};

const {
	userCount,
	userNotDuplicate,
	keyExist
} = ChatValidator;

const ChatSchema: Schema = new Schema({
	content: { type: String, required: true },
	user: { type: Schema.Types.ObjectId, required: true }
},
{
	timestamps: { createdAt: true, updatedAt: false }
});

const ChatRoomSchema: Schema = new Schema({
	chats: [ChatSchema],
	users: {
		type: [Schema.Types.ObjectId],
		validate: [
			userCount,
			userNotDuplicate,
		]
	},
	keys: {
		type: [String],
		validate: keyExist
	}
},
{
	timestamps: { createdAt: true, updatedAt: true }
});

ChatRoomSchema.methods.getChats = async function(
	cursor: string | null,
	pageSize: number,
	extraMatch: any={}
): Promise<Array<IChatOutput>> {
	try {
		if (cursor)
			extraMatch._id = { $lt: Types.ObjectId(cursor) };
		return <Array<IChatOutput>>(await ChatRoom.aggregate([
			{ $match: { _id: this._id }},
			{ $unwind: '$chats' },
			{ $replaceRoot: { newRoot: '$chats' }},
			{ $match: extraMatch },
			{ $lookup: {
				from: 'users',
				foreignField: '_id',
				localField: 'user',
				as: 'user'
			}},
			{ $unwind: '$user' },
			{ $sort: { _id: -1 }},
			{ $limit: pageSize },
			{ $project: {
				content: 1,
				createdAt: 1,
				user: { nickname: 1 }
			}}
		]));
	} catch (err) {
		throw err;
	}
}

export const ChatRoom: IChatRoomModel =
	connection.model<IChatRoomDocument, IChatRoomModel>('chatrooms', ChatRoomSchema);