import { connection, Model, Schema, Document, Types } from 'mongoose';
import { IUserDocument, activeUserSeconds } from './';
import { IFriend, IFriendOutput } from '../types';
import { FriendValidator } from '../validators';
import { User } from './user';

export interface IFriendDocument extends IFriend, Document {};
export interface IFriendModel extends Model<IFriendDocument> {
	fromUser(
		user: IUserDocument, cursor: string | null, pageSize: number, extraMatch: any
	): Promise<Array<IFriendOutput>>,
	activeSessions(user: IUserDocument): Promise<Array<string>>
};

interface IFriendsIdAggregate {
	_id: null,
	friendsIds: Array<Schema.Types.ObjectId>
}

const {
	userCount,
	userNotDuplicate
} = FriendValidator;

const FriendSchema: Schema = new Schema({
	users: {
		type: [Schema.Types.ObjectId],
		validate: [
			userCount,
			userNotDuplicate,
		]
	}
},
{
	timestamps: { createdAt: true, updatedAt: false }
});

FriendSchema.statics.fromUser = async function(
	user: IUserDocument,
	cursor: string | null,
	pageSize: number,
	extraMatch: any={}
): Promise<Array<IFriendOutput>> {
	try {
		var friendsIds: IFriendsIdAggregate | undefined;
		var match: any = { _id: {}};

		if (cursor)
			Object.assign(match._id, { $lt: Types.ObjectId(cursor) });
		friendsIds = (await this.aggregate([
			{ $match: { users: user._id }},
			{ $unwind: '$users' },
			{ $match: {
				users: { $ne: user._id }
			}},
			{ $group: {
				_id: null,
				friendsIds: { $addToSet: '$users' }
			}}
		]))[0];
		if (!friendsIds)
			return [];
		Object.assign(match._id, { $in: friendsIds.friendsIds });
		return <Array<IFriendOutput>>(await User.find(
			{ ...match, ...extraMatch },
			{ nickname: 1, gender: 1, lastSeen: 1, comment: 1 },
			{ sort: { _id: -1 }, limit: pageSize }
		).lean());
	} catch (err) {
		throw err;
	}
}

FriendSchema.statics.activeSessions = async function(
	user: IUserDocument
): Promise<Array<string>> {
	try {
		const now: Date = new Date();
		const activeTime: Date = new Date();
		var friendsIds: IFriendsIdAggregate;

		activeTime.setSeconds(now.getSeconds() - activeUserSeconds);
		friendsIds = (await Friend.aggregate([
			{ $match: { users: user._id }},
			{ $unwind: '$users' },
			{ $match:{
				users: { $ne: user._id }
			}},
			{ $group: {
				_id: null,
				friendsIds: { $addToSet: '$users' }
			}}
		]))[0];
		if (!friendsIds)
			return [];
		return (await User.aggregate([
			{ $match: { _id: { $in: friendsIds.friendsIds }}},
			{ $unwind: '$sessions' },
			{ $replaceRoot: { newRoot: '$sessions' }},
			{ $match: {
				'lastSeen': { $gt: activeTime }
			}},
			{ $project: { _id: 1 }}
		])).map(s => s._id.toString());
	} catch (err) {
		throw err;
	}
}

export const Friend: IFriendModel =
	connection.model<IFriendDocument, IFriendModel>('friends', FriendSchema);