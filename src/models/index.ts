import { User, IUserDocument, activeUserSeconds } from './user';
import { Friend, IFriendDocument } from './friend';
import { ChatRoom, IChatRoomDocument, IChatDocument } from './chat';
import { Message, IMessageDocument, messageTypes } from './message';
import { Notice, INoticeDocument } from './notice';
import { Report, IReportDocument } from './report';
import { WeeklyTaste, IWeeklyTasteDocument } from './weeklyTaste';

const ENV: any = process.env;
const DB_ADDRESS: string = (
	'mongodb://' +
	ENV['DB_USER'] +
	':' + ENV['DB_PWD'] +
	'@' + ENV['DB_HOST'] +
	':' + ENV['DB_PORT'] +
	'/' + ENV['DB_NAME']
);

export {
	DB_ADDRESS,
	User, IUserDocument, activeUserSeconds,
	Friend, IFriendDocument,
	ChatRoom, IChatRoomDocument, IChatDocument,
	Message, IMessageDocument, messageTypes,
	Notice, INoticeDocument,
	Report, IReportDocument,
	WeeklyTaste, IWeeklyTasteDocument
};