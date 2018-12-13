import { IFavorite, IValidator, ISession } from '../types';
import { sumOf } from '../utils';
import { User, IUserDocument } from '../models';

const MAX_NICKNAME_LEN: number = 20;
const MIN_NICKNAME_LEN: number = 2;
const MAX_FAVORITES_LEN: number = 5;
const MAX_FAVORITES_POINT: number = 15;
const MAX_FAVORITE_POINT: number = 5;
const MIN_FAVORITE_POINT: number = 1;
const MAX_INTERESTS_LEN: number = 10;
const WEEKLY_TASTES_LEN: number = 3;
const VALID_GENDERS: Array<string> = ['male', 'female'];
const MAX_SESSION_COUNT: number = 5;
const MSG = {
	INVALID_NICKNAME_LEN: 'INVALID_NICKNAME_LEN',
	INVALID_NICKNAME_REGEX: 'INVALID_NICKNAME_REGEX',
	NICKNAME_ALREADY_EXIST: 'NICKNAME_ALREADY_EXIST',
	NICKNAME_ALREADY_FIXED: 'NICKNAME_ALREADY_FIXED',
	INVALID_FAVORITES_LEN: 'INVALID_FAVORITES_LEN',
	INVALID_FAVORITES_TOTAL_POINT: 'INVALID_FAVORITES_TOTAL_POINT',
	INVALID_FAVORITE_POINT: 'INVALID_FAVORITE_POINT',
	FAVORITES_DUPLICATE: 'FAVORITES_DUPLICATE',
	FAVORITES_NOT_SORTED: 'FAVORITES_NOT_SORTED',
	INVALID_INTERESTS_LEN: 'INVALID_INTERESTS_LEN',
	INTERESTS_DUPLICATE: 'INTERESTS_DUPLICATE',
	INVALID_WEEKLY_TASTES_LEN: 'INVALID_WEEKLY_TASTES_LEN',
	INVALID_WEEKLY_TASTES_VAL: 'INVALID_WEEKLY_TASTES_VAL',
	INVALID_GENDER: 'INVALID_GENDER',
	GENDER_ALREADY_FIXED: 'GENDER_ALREADY_FIXED',
	SESSION_COUNT_OVER: 'SESSION_COUNT_OVER'
}

export const nicknameLen: IValidator = {
	validator: async (v: string): Promise<boolean> => (
		v.length >= MIN_NICKNAME_LEN && v.length <= MAX_NICKNAME_LEN
	),
	message: MSG.INVALID_NICKNAME_LEN
}

export const nicknameRegex: IValidator = {
	validator: async (v: string): Promise<boolean> => (		
		/^[a-zA-Z가-힣0-9_]*[a-zA-Z가-힣0-9][a-zA-Z가-힣0-9_]*$/.test(v)
	),
	message: MSG.INVALID_NICKNAME_REGEX
}

export const nicknameUnique: IValidator = {
	validator: async (v: string): Promise<boolean> => {
		const user: IUserDocument | null = await User.findOne({ nickname: v });

		if (user)
			return false;
		return true;
	},
	message: MSG.NICKNAME_ALREADY_EXIST
}

export const nicknameNeverModified = (user: IUserDocument) => {
	return {
		validator: async (v: string): Promise<boolean> => {
			if (user.nickname)
				return false;
			return true;
		},
		message: MSG.NICKNAME_ALREADY_FIXED
	}
}

export const favoritesLength: IValidator = {
	validator: async (v: Array<IFavorite>): Promise<boolean> => (
		v.length <= MAX_FAVORITES_LEN
	),
	message: MSG.INVALID_FAVORITES_LEN
}

export const favoritesTotalPoint: IValidator = {
	validator: async (v: Array<IFavorite>): Promise<boolean> => (
		sumOf(v, 'point') <= MAX_FAVORITES_POINT
	),
	message: MSG.INVALID_FAVORITES_TOTAL_POINT
}

export const favoritePoint: IValidator = {
	validator: async (v: Array<IFavorite>): Promise<boolean> => (
		v.every((fav: IFavorite) => (
			fav.point >= MIN_FAVORITE_POINT &&
			fav.point <= MAX_FAVORITE_POINT
		))
	),
	message: MSG.INVALID_FAVORITE_POINT
}

export const favoritesNotDuplicate: IValidator = {
	validator: async (v: Array<IFavorite>): Promise<boolean> => {
		const onlyContent = v.map((f: IFavorite) => f.content);

		return onlyContent.length ===
			onlyContent.filter((v, i, a) => a.indexOf(v) === i).length;
	},
	message: MSG.FAVORITES_DUPLICATE
}

// only in model not in controller
export const favoritesSorted: IValidator = {
	validator: async (v: Array<IFavorite>): Promise<boolean> => (
		v.every((f: IFavorite, i: number) => !i || (f.point <= v[i - 1].point))
	),
	message: MSG.FAVORITES_NOT_SORTED
}

export const interestsLength: IValidator = {
	validator: async (v: Array<string>): Promise<boolean> => (
		v.length <= MAX_INTERESTS_LEN
	),
	message: MSG.INVALID_INTERESTS_LEN
}

export const interestsNotDuplicate: IValidator = {
	validator: async (v: Array<string>): Promise<boolean> => (
		v.filter((v, i, a) => a.indexOf(v) === i).length === v.length
	),
	message: MSG.INTERESTS_DUPLICATE
}

export const weeklyTastesLen: IValidator = {
	validator: async (v: Array<number>): Promise<boolean> => (
		v.length == WEEKLY_TASTES_LEN
	),
	message: MSG.INVALID_WEEKLY_TASTES_LEN
}

export const weeklyTastesVal: IValidator = {
	validator: async (v: Array<number>): Promise<boolean> => (
		v.every((x: number) => [-1, 0, 1].indexOf(x) !== -1)
	),
	message: MSG.INVALID_WEEKLY_TASTES_VAL
}

export const validGender: IValidator = {
	validator: async (v: string): Promise<boolean> => (
		typeof v === 'string' && VALID_GENDERS.indexOf(v) !== -1
	),
	message: MSG.INVALID_GENDER
}

export const genderNeverModified = (user: IUserDocument) => {
	return {
		validator: async (v: string): Promise<boolean> => {
			if (user.gender)
				return false;
			return true;
		},
		message: MSG.GENDER_ALREADY_FIXED
	}
}

export const sessionCount: IValidator = {
	validator: async (v: Array<ISession>) => (
		v.length <= MAX_SESSION_COUNT
	),
	message: MSG.SESSION_COUNT_OVER
}

export const validationMap = {
	nickname: [
		nicknameLen,
		nicknameRegex,
		nicknameUnique
	],
	favorites: [
		favoritesLength,
		favoritePoint,
		favoritesTotalPoint,
		favoritesNotDuplicate,
	],
	interests: [
		interestsLength,
		interestsNotDuplicate
	],
	weeklyTastes: [
		weeklyTastesLen,
		weeklyTastesVal
	],
	gender: [
		validGender
	]
};

export const searchValidationMap = {
	gender: [
		validGender
	],
	weeklyTastes: [
		weeklyTastesLen,
		weeklyTastesVal
	]
}