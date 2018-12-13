import * as chai from 'chai';
import { Message, IMessageDocument, User, IUserDocument } from '../';
import { IUser, IMessage } from '../../types';
import * as setupTest from '../../setupTest';

const expect = chai.expect;

describe('Message model', () => {
	var usersData: Array<IUser>;
	var users: Array<IUserDocument>;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			usersData = [ 
				{
					nickname: 'sender',
					facebookProvider : { id: 'id1', token: 'token1' },
					gender: 'female'
				},
				{
					nickname: 'receiver',
					facebookProvider : { id: 'id2', token: 'token2' },
					gender: 'male'
				}
			];
			users = await User.insertMany(usersData);
		} catch (err) {
			throw err;
		}
	});

	it('should save message', async () => {
		try {
			var msg: IMessageDocument;

			msg = new Message({
				from: users[0]._id,
				to: users[1]._id,
				content: 'msg to u',
				type: 'message'
			});
			await msg.save();
			expect(msg.read).to.equal(false);
		} catch (err) {
			throw err;
		}
	});

	describe('get received message', async () => {
		const pageSize: number = 5;
		var messages: Array<IMessageDocument>;

		beforeEach(async () => {
			try {
				var i: number = 0;

				messages = [];
				while (i < pageSize * 2) {
					messages.push(new Message({
						from: users[0]._id,
						to: users[1]._id,
						content: 'msg to u ' + i,
						type: 'message'
					}))
					i++;
				}
				await Message.insertMany(messages);
			} catch (err) {
				throw err;
			}
		});

		it('should be paginated', async () => {
			try {
				var page1: Array<IMessageDocument>;
				var page2: Array<IMessageDocument>;
				var expectedPage1: Array<IMessageDocument>;
				var expectedPage2: Array<IMessageDocument>;
				var i: number = 0;

				messages.sort((a, b) => (a._id > b._id) ? -1 : 1);
				expectedPage1 = messages.slice(0, pageSize);
				expectedPage2 = messages.slice(pageSize, pageSize * 2);
				page1 = await Message.getReceived(users[1], null, pageSize, {});
				page2 = await Message.getReceived(
					users[1], page1[pageSize - 1].id, pageSize, {}
				);
				expect(page1.length).to.not.equal(0);
				while (i < pageSize) {
					expect(page1[i].id.toString())
						.to.equal(expectedPage1[i]._id.toString());
					i++;
				}
				i = 0;
				expect(page2.length).to.not.equal(0);
				while (i < pageSize) {
					expect(page2[i].id.toString())
						.to.equal(expectedPage2[i]._id.toString());
					i++;
				}
			} catch (err) {
				throw err;
			}
		});
	});

	describe('get sent message', async () => {
		const pageSize: number = 5;
		var messages: Array<IMessageDocument>;

		beforeEach(async () => {
			try {
				var i: number = 0;

				messages = [];
				while (i < pageSize * 2) {
					messages.push(new Message({
						from: users[0]._id,
						to: users[1]._id,
						content: 'msg to u ' + i,
						type: 'message'
					}))
					i++;
				}
				await Message.insertMany(messages);
			} catch (err) {
				throw err;
			}
		});

		it('should be paginated', async () => {
			try {
				var page1: Array<IMessageDocument>;
				var page2: Array<IMessageDocument>;
				var expectedPage1: Array<IMessageDocument>;
				var expectedPage2: Array<IMessageDocument>;
				var i: number = 0;

				messages.sort((a, b) => (a._id > b._id) ? -1 : 1);
				expectedPage1 = messages.slice(0, pageSize);
				expectedPage2 = messages.slice(pageSize, pageSize * 2);
				page1 = await Message.getSent(users[0], null, pageSize, {});
				page2 = await Message.getSent(
					users[0], page1[pageSize - 1].id, pageSize, {}
				);
				expect(page1.length).to.not.equal(0);
				while (i < pageSize) {
					expect(page1[i].id.toString())
						.to.equal(expectedPage1[i]._id.toString());
					i++;
				}
				i = 0;
				expect(page2.length).to.not.equal(0);
				while (i < pageSize) {
					expect(page2[i].id.toString())
						.to.equal(expectedPage2[i]._id.toString());
					i++;
				}
			} catch (err) {
				throw err;
			}
		});
	});

	it('should create message', async () => {
		try {
			const from: IUserDocument = users[0];
			const to: IUserDocument = users[1];
			const input: any = {
				type: 'message',
				content: 'bonjour'
			};

			await Message._create_(from, to, input);
		} catch (err) {
			throw err;
		}
	});

	it('should not create message', async () => {
		try {
			const from: IUserDocument = users[0];
			const to: IUserDocument = users[1];
			const input: any = {
				type: 'notype',
				content: 'bonjour'
			};

			try {
				await Message._create_(from, to, input);
				throw Error;
			} catch (err) {
				expect(err.name).to.equal('ValidationError');
			}
		} catch (err) {
			throw err;
		}
	})

	describe('delete message', async () => {
		var message: IMessageDocument;

		beforeEach(async () => {
			try {
				message = new Message({
					type: 'message',
					content: 'foo bar',
					from: users[0]._id,
					to: users[1]._id
				});
				await message.save();
			} catch (err) {
				throw err;
			}
		})

		it('should flag recipientDelete to true when deleteReceived', async () => {
			try {
				await message.deleteReceived();
				expect(message.recipientDelete).to.equal(true);
			} catch (err) {
				throw err;
			}
		});

		it('should remove when deleteReceived', async () => {
			try {
				message.senderDelete = true;
				await message.deleteReceived();
				expect(
					await Message.findOne({ _id: message._id })
				).to.equal(null);
			} catch (err) {
				throw err;
			}
		});

		it('should flag senderDelete to true when deleteSent', async () => {
			try {
				await message.deleteSent();
				expect(message.senderDelete).to.equal(true);
			} catch (err) {
				throw err;
			}
		});

		it('should remove when deleteSent', async () => {
			try {
				message.recipientDelete = true;
				await message.deleteSent();
				expect(
					await Message.findOne({ _id: message._id })
				).to.equal(null);
			} catch (err) {
				throw err;
			}
		});
	});

	it('should flag read to true when hasRead', async () =>{
		try {
			const message: IMessageDocument = new Message({
				type: 'message',
				content: 'foo bar',
				from: users[0]._id,
				to: users[1]._id
			});

			await message.hasRead();
			expect(message.read).to.equal(true);
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
