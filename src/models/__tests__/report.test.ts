import * as chai from 'chai';
import { Report, IReportDocument, ChatRoom, IChatRoomDocument, User, IUserDocument } from '../';
import * as setupTest from '../../setupTest';
import { IUser, IChat } from '../../types';

const expect = chai.expect;

describe('Report model', () => {
	var usersData: Array<IUser>;
	var users: Array<IUserDocument>;
	var chatRoom: IChatRoomDocument;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			usersData = [ 
				{
					facebookProvider : { id: 'id1', token: 'token1' },
					gender: 'female'
				},
				{
					facebookProvider : { id: 'id2', token: 'token2' },
					gender: 'male'
				}
			];
			users = await User.insertMany(usersData);
			chatRoom = new ChatRoom({
				users: users.map(v => v._id),
				keys: [ 'key1' ]
			});
			await chatRoom.save();
		} catch (err) {
			throw err;
		}
	});

	it('should save report', async () => {
		try {
			var report: IReportDocument;

			report = new Report({
				chatRoom: chatRoom._id,
				from: users[0]._id,
				content: '욕설',
				roomKey: 'roomkey'
			});
			await report.save();
			expect(report.createdAt).to.be.instanceof(Date);
		} catch (err) {
			throw err;
		}
	});

	afterEach(async () => {
		try {
			await setupTest.resetTestDB();
		} catch (err) {
			throw err;
		}
	});
});
