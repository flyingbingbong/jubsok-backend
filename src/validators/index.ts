import { required, validateInput, ATTR_NOT_EXIST } from './base';
import * as UserValidator from './user';
import * as ChatValidator from './chat';
import * as MessageValidator from './message';
import * as NoticeValidator from './notice';
import * as WeeklyTasteValidator from './weeklyTaste';
import * as FriendValidator from './friend';

export {
	required, validateInput, ATTR_NOT_EXIST,
	UserValidator,
	ChatValidator,
	MessageValidator,
	NoticeValidator,
	WeeklyTasteValidator,
	FriendValidator,
};