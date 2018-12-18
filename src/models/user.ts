import { connection, Model, Schema, Document, Types } from 'mongoose';
import { Profile } from 'passport-facebook-token';
import { IUser, IFavorite, ISearchedUser } from '../types';
import { genderSelector } from '../utils';
import { UserValidator } from '../validators';
import { UserHelper } from './helpers';
import { Friend } from './friend';
import { Message } from './message';

export interface IUserDocument extends IUser, Document {
	toJSON(): IUserDocument,
	getProfile(): IUserDocument,
	updateProfile(input: any): Promise<IUserDocument>,
	wsSend(wsClients: any, message: any): void,
	hasOtherActiveSession(currentSession: string, clients: any): boolean,
	updateWords(newWords: Array<string>): Promise<void>,
};
export interface IUserModel extends Model<IUserDocument> {
	facebookLogin(
		accessToken: string, refreshToken: string, profile: Profile
	): Promise<void>,
	search(
		gender: string, weeklyTastes: Array<number>, nickname: string,
		cursor: string | null, pageSize: number, extraMatch: any
	): Promise<Array<ISearchedUser>>,
	randomSearch(
		gender: string | null,
		weeklyTastes: Array<number> | null,
		text: string | null,
		pageSize: number,
		extraMatch: any
	): Promise<Array<ISearchedUser>>,
};

export const activeUserSeconds: number = 5;

const {
	nicknameLen,
	nicknameRegex,
	nicknameUnique,
	favoritesLength,
	favoritesContentRegex,
	favoritesTotalPoint,
	favoritePoint,
	favoritesNotDuplicate,
	favoritesSorted,
	interestsLength,
	interestsContentRegex,
	interestsNotDuplicate,
	weeklyTastesLen,
	weeklyTastesVal,
	validGender,
	sessionCount,
} = UserValidator;

const SessionSchema: Schema = new Schema({
	refreshToken: { type: String, required: true },
	publicKey: { type: String, required: true },
	lastSeen: { type: Date, default: Date.now }
},
{
	timestamps: { createdAt: false, updatedAt: false }
});

const UserSchema: Schema = new Schema({
	nickname: {
		type: String,
		index: {
			unique: true,
			partialFilterExpression: { nickname: { $type: 'string' }}
		},
		validate: [
			nicknameLen,
			nicknameRegex,
		]
	},
	facebookProvider: {
		type: {
			id: String,
			token: String
		},
	},
	comment: String,
	lastSeen: Date,
	favorites: {
		type: [{ content: String, point: Number, _id: false }],
		validate: [
			favoritesLength,
			favoritesContentRegex,
			favoritesTotalPoint,
			favoritePoint,
			favoritesNotDuplicate,
			favoritesSorted,
		],
	},
	interests: {
		type: [ String ],
		validate: [
			interestsLength,
			interestsContentRegex,
			interestsNotDuplicate
		]
	},
	weeklyTastes: {
		type: [ Number ],
		default: [-1, -1, -1],
		validate: [
			weeklyTastesLen,
			weeklyTastesVal,
		]
	},
	gender: {
		type: String,
		validate: validGender
	},
	sessions: {
		type: [ SessionSchema ],
		validate: sessionCount
	}
},
{
	timestamps: { createdAt: true, updatedAt: true },
});

UserSchema.index({ 'facebookProvider.id': 1 }, {
	unique: true,
	partialFilterExpression: { 'facebookProvider.id': { $type: 'string' }}
});

UserSchema.pre('remove', async function(next) {
	try {
		await Friend.deleteMany({ users: this._id });
		await Message.deleteMany({ from: this._id });
		await Message.deleteMany({ to: this._id });
		next();
	} catch (err) {
		throw err;
	}
})

UserSchema.statics.facebookLogin = async function(
	accessToken: string, refreshToken: string, profile: Profile
): Promise<void> {
	try {
		var user: IUserDocument | null =
			await User.findOne({ 'facebookProvider.id': profile.id });

		if (!user) {
			user = new User({
				facebookProvider: { id: profile.id, token: accessToken },
			});
			if (profile.gender)
				user.gender = genderSelector(profile.gender);
			await user.save();
		}
	} catch (err) {
		throw err;
	}
}

UserSchema.statics.search = async function(
	gender: string | null,
	weeklyTastes: Array<number> | null,
	text: string | null,
	cursor: string | null,
	pageSize: number,
	extraMatch: any = {}
): Promise<Array<ISearchedUser>> {
	try {
		var match: any;

		match = UserHelper.searchFilter(gender, weeklyTastes, text);
		if (cursor)
			extraMatch._id = { $lt: Types.ObjectId(cursor) };
		return await this.aggregate([
			{ $match: {
				weeklyTastes: { $ne: -1 }, // only user who submit weeklyTastes
				...match,
				...extraMatch
			}},
			{ $sort: { _id: -1 }},
			{ $limit: pageSize },
			{ $project: {
				nickname: 1,
				gender: 1,
				comment: 1,
				favorites: '$favorites.content',
				lastSeen: 1
			}}
		]);
	} catch (err) {
		throw err;
	}
}

UserSchema.statics.randomSearch = async function(
	gender: string | null,
	weeklyTastes: Array<number> | null,
	text: string | null,
	pageSize: number,
	extraMatch: any = {}
): Promise<Array<ISearchedUser>> {
	try {
		var match: any;

		match = UserHelper.searchFilter(gender, weeklyTastes, text);
		return await this.aggregate([
			{ $match: {
				weeklyTastes: { $ne: -1 }, // only user who submit weeklyTastes
				...match,
				...extraMatch
			}},
			{ $sample: { size: pageSize }},
			{ $project: {
				nickname: 1,
				gender: 1,
				comment: 1,
				favorites: '$favorites.content',
				lastSeen: 1
			}}
		]);
	} catch (err) {
		throw err;
	}
}

UserSchema.methods.getProfile = function(): IUserDocument {
	var user: IUserDocument = this.toJSON();

	delete user._id;
	delete user.__v;
	delete user.sessions;
	delete user.facebookProvider;
	delete user.createdAt;
	delete user.updatedAt;
	return user;
}

UserSchema.methods.updateProfile = async function(input: any): Promise<IUserDocument> {
	try {
		if (input.favorites && Array.isArray(input.favorites)) {
			input.favorites = input.favorites.sort((a: IFavorite, b: IFavorite) => (
				(a.point > b.point) ? -1 : 1 // sort favorites by point DESC
			));
		}
		return await User.findOneAndUpdate(
			{ _id: this._id },
			{ $set: input },
			{ runValidators: true, new: true }
		);
	} catch (err) {
		throw err;
	}
}

UserSchema.methods.wsSend = function(wsClients: any, message: any): void {
	for (let s of this.sessions) {
		if (!wsClients[s._id.toString()])
			continue;
		wsClients[s._id.toString()].send(
			JSON.stringify(message)
		);
	}
}

UserSchema.methods.hasOtherActiveSession = function(
	currentSession: string, clients: any
): boolean {
	for (let s of this.sessions) {
		if (s._id.toString() !== currentSession && clients[s._id.toString()])
			return true;
	}
	return false;
}

export const User: IUserModel =
	connection.model<IUserDocument, IUserModel>('users', UserSchema);