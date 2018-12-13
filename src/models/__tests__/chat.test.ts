import * as chai from 'chai';
import { ChatRoom, IChatRoomDocument, User, IUserDocument, IChatDocument } from '../';
import * as setupTest from '../../setupTest';
import { IUser, IChat, IChatOutput } from '../../types';

const expect = chai.expect;

describe('Chat model', () => {
	var usersData: Array<IUser>;
	var users: Array<IUserDocument>;
	var chatRoom: IChatRoomDocument;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			usersData = [ 
				{
					nickname: 'pat',
					facebookProvider : { id: 'id1', token: 'token1' },
					gender: 'female'
				},
				{
					nickname: 'mat',
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

	it('should push new chat', async () => {
		try {
			var chat: IChat;

			expect(chatRoom.users.length).to.equal(2);
			chat = { content: 'tweet', user: users[0]._id };
			chatRoom.chats.push(chat);
			await chatRoom.save();
			expect(chatRoom.chats.length).to.equal(1);
		} catch (err) {
			throw err;
		}
	});

	describe('getChats', async () => {
		const pageSize: number = 5;
		var chats: Array<IChatDocument>

		beforeEach(async () => {
			try {
				var i: number = 0;

				while (i < pageSize * 2) {
					chatRoom.chats.push({
						content: `haha${i}`, user: users[i % 2]._id
					});
					i++;
				}
				await chatRoom.save();
				chats = <Array<IChatDocument>>chatRoom.chats;
			} catch (err) {
				throw err;
			}
		});

		it('should paginated', async () => {
			try {
				var page1: Array<IChatOutput>;
				var page2: Array<IChatOutput>;
				var expectedPage1: Array<IChatDocument>;
				var expectedPage2: Array<IChatDocument>;
				var i: number = 0;

				chats.sort((a, b) => (a._id > b._id) ? -1 : 1);
				expectedPage1 = chats.slice(0, pageSize);
				expectedPage2 = chats.slice(pageSize, pageSize * 2);
				page1 = await chatRoom.getChats(null, pageSize, {});
				page2 = await chatRoom.getChats(
					page1[pageSize - 1]._id.toString(), pageSize, {}
				);
				expect(page1.length).to.not.equal(0);
				while (i < pageSize) {
					expect(page1[i]._id.toString())
						.to.equal(expectedPage1[i]._id.toString());
					i++;
				}
				i = 0;
				expect(page2.length).to.not.equal(0);
				while (i < pageSize) {
					expect(page2[i]._id.toString())
						.to.equal(expectedPage2[i]._id.toString());
					i++;
				}
			} catch (err) {
				throw err;
			}
		});
	});

	afterEach(async () => {
		try {
			await setupTest.resetTestDB();
		} catch (err) {
			throw err;
		}
	});
})
