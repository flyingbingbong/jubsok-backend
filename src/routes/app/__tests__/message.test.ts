import * as chai from 'chai';
import * as sinon from 'sinon';
import * as request from 'supertest';
import { response } from 'supertest';
import * as setupTest from '../../../setupTest';
import { MessageRouter } from '../';
import { AES } from '../../../utils';
import * as jwt from 'jsonwebtoken';
import { testHelper } from '../helpers';
import {
	User, IUserDocument, Message, IMessageDocument, messageTypes
} from '../../../models';

const expect = chai.expect;
const JWT_SECRET: string = <string>process.env.JWT_SECRET;

describe('message router', () => {
	var res: response;
	var accessToken: string;
	this.testAuth = testHelper.testAuth;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			this.user = new User({
				facebookProvider: { id: 'foo@bar.com' },
			});
			await this.user.save();
			accessToken = await jwt.sign(
				{ id: this.user.facebookProvider.id },
				JWT_SECRET,
				{ expiresIn: 60 * 5 }
			);
		} catch (err) {
			throw err;
		}
	});

	describe('/message/received (GET)', async () => {
		var messages: Array<IMessageDocument>;
		var users: Array<IUserDocument>;

		beforeEach(async () => {
			try {
				var i: number = 0;

				this.url = '/message/received';
				this.app = setupTest.mockApp();
				this.app.use('/message', MessageRouter);
				users = [
					new User({ nickname: 'sender1' }),
					new User({ nickname: 'sender2' }),
				];
				await User.insertMany(users);
				messages = [];
				while (i < 19) {
					messages.push(new Message({
						to: this.user._id, from: users[i % users.length]._id,
						content: `bonjour${i}`, type: messageTypes.message
					}));
					i++;
				}
				await Message.insertMany(messages);
			} catch (err) {
				throw err;
			}
		})

		this.testAuth('GET');

		it('should return 200 with items', async () => {
			try {
				var res2: response;

				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.expect(200);
				expect(res.body.items.length).to.equal(10);
				expect(res.body.next).to.not.equal(undefined);
				res2 = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ next: res.body.next })
					.expect(200);
				expect(res2.body.items.length).to.equal(9);
				expect(res2.body.next).to.equal(null);
			} catch (err) {
				throw err;
			}
		});

		it('should return 400 when invalid cursor', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ next: 'invalidCursor' })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_CURSOR/);
			} catch (err) {
				throw err;
			}
		});

		it('should return 400 when cursor is invalid objectid', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ next: AES.encrypt('ss') })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_ID/);
			} catch (err) {
				throw err;
			}
		});
	});

	describe('/message/sent (GET)', async () => {
		var messages: Array<IMessageDocument>;
		var users: Array<IUserDocument>;

		beforeEach(async () => {
			try {
				var i: number = 0;

				this.url = '/message/sent';
				this.app = setupTest.mockApp();
				this.app.use('/message', MessageRouter);
				users = [
					new User({ nickname: 'receiver1' }),
					new User({ nickname: 'receiver2' }),
				];
				await User.insertMany(users);
				messages = [];
				while (i < 19) {
					messages.push(new Message({
						from: this.user._id, to: users[i % users.length]._id,
						content: `bonjour${i}`, type: messageTypes.message
					}));
					i++;
				}
				await Message.insertMany(messages);
			} catch (err) {
				throw err;
			}
		})

		this.testAuth('GET');

		it('should return 200 with items', async () => {
			try {
				var res2: response;

				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.expect(200);
				expect(res.body.items.length).to.equal(10);
				expect(res.body.next).to.not.equal(undefined);
				res2 = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ next: res.body.next })
					.expect(200);
				expect(res2.body.items.length).to.equal(9);
				expect(res2.body.next).to.equal(null);
			} catch (err) {
				throw err;
			}
		});

		it('should return 400 when invalid cursor', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ next: 'invalidCursor' })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_CURSOR/);
			} catch (err) {
				throw err;
			}
		});

		it('should return 400 when cursor is invalid objectid', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ next: AES.encrypt('ss') })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_ID/);
			} catch (err) {
				throw err;
			}
		});
	});

	describe('/message (POST)', () => {
		var recipient: IUserDocument;
		var wsClients: any;

		beforeEach(async () => {
			try {
				this.url = '/message';
				recipient = await User.create({
					sessions: [
						{ refreshToken: 'token1', publicKey: 'key1' },
						{ refreshToken: 'token2', publicKey: 'key2' },
					]
				});
				wsClients = {};
				for (let s of recipient.sessions) {
					wsClients[s._id.toString()] = setupTest.mockWsClient();
				}
				this.app = setupTest.mockApp({ wss: { clients: wsClients }});
				this.app.use('/message', MessageRouter);
			} catch (err) {
				throw err;
			}
		})

		this.testAuth('POST');

		it('should return 200', async () => {
			try {
				var message: IMessageDocument;

				this.user.nickname = 'foo';
				this.user.weeklyTastes = [ 0, 1, 0 ];
				await this.user.save();
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({
						type: messageTypes.message,
						content: 'hi',
						to: recipient.nickname
					})
					.expect(200);
				message = await Message.findOne({
					from: this.user._id, to: recipient._id
				});
				expect(message).to.not.equal(null);
				expect(message).to.not.equal(undefined);
				for (let s of recipient.sessions) {
					sinon.assert.calledOnce(wsClients[s._id.toString()].send);
				}
			} catch (err) {
				throw err;
			}
		})

		it('should return 403 when nickname not exist', async () => {
			try {
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.expect(403);
				expect(res.body.message).match(/.*USER_NICKNAME_REQUIRED/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 403 when weeklytastes not exist', async () => {
			try {
				this.user.nickname = 'foo';
				await this.user.save();
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.expect(403);
				expect(res.body.message).match(/.*USER_WEEKLYTASTES_REQUIRED/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when invalid input', async () => {
			try {
				this.user.nickname = 'foo';
				this.user.weeklyTastes = [ 0, 1, 0 ];
				await this.user.save();
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({
						type: 'notExistType',
						content: 'hi',
						to: recipient.nickname
					})
					.expect(400);
				expect(res.body.message).match(/.*TYPE_NOT_ALLOWED/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when recipient not exist', async () => {
			try {
				this.user.nickname = 'foo';
				this.user.weeklyTastes = [ 0, 1, 0 ];
				await this.user.save();
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({
						type: messageTypes.message,
						content: 'hi',
						to: 'notExistNickname'
					})
					.expect(400);
				expect(res.body.message).match(/.*USER_TO_SEND_NOT_FOUND/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when validation error', async () => {
			try {
				const fakeMessageCreate = sinon.stub(Message, '_create_');

				fakeMessageCreate.rejects('ValidationError');
				this.user.nickname = 'foo';
				this.user.weeklyTastes = [ 0, 1, 0 ];
				await this.user.save();
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({
						type: messageTypes.message,
						content: 'hi',
						to: recipient.nickname
					})
					.expect(400);
				expect(res.body.message).match(/.*VALIDATION_ERROR/);
			} catch (err) {
				throw err;
			}
		})
	})

	describe('/message/received (DELETE)', () => {
		var message: IMessageDocument;
		var messageId: string;

		beforeEach(async () => {
			try {
				this.url = '/message/received';
				this.app = setupTest.mockApp();
				this.app.use('/message', MessageRouter);
				message = new Message({
					to: this.user._id,
					from: (new User())._id,
					content: 'hi',
					type: messageTypes.message
				});
				await message.save();
				messageId = AES.encrypt(message._id.toString());
			} catch (err) {
				throw err;
			}
		})

		this.testAuth('DELETE');

		it('should return 200 with recipientDelete to true', async () => {
			try {
				var messageDeleted: IMessageDocument;

				res = await request(this.app)
					.delete(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ id: messageId })
					.expect(200);
				messageDeleted = await Message.findOne({ _id: message._id });
				expect(messageDeleted.recipientDelete).to.equal(true);
			} catch (err) {
				throw err;
			}
		})

		it('should return 200 with delete message', async () => {
			try {
				var messageDeleted: IMessageDocument;

				message.senderDelete = true;
				await message.save();
				res = await request(this.app)
					.delete(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ id: messageId })
					.expect(200);
				messageDeleted = await Message.findOne({ _id: message._id });
				expect(messageDeleted).to.equal(null);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when message id not exist', async () => {
			try {
				res = await request(this.app)
					.delete(this.url)
					.set({ 'x-auth-token': accessToken })
					.expect(400);
				expect(res.body.message).to.match(/.*MESSAGE_ID_NOT_EXIST/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when message invalid', async () => {
			try {
				res = await request(this.app)
					.delete(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ id: 'invalidId' })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_MESSAGE_ID/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when invalid object id', async () => {
			try {
				res = await request(this.app)
					.delete(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ id: AES.encrypt('invalidId') })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_ID/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when message not exist', async () => {
			try {
				res = await request(this.app)
					.delete(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ id: AES.encrypt((new Message())._id.toString()) })
					.expect(400);
				expect(res.body.message).to.match(/.*MESSAGE_NOT_EXIST/);
			} catch (err) {
				throw err;
			}
		})
	})

	describe('/message/sent (DELETE)', () => {
		var message: IMessageDocument;
		var messageId: string;

		beforeEach(async () => {
			try {
				this.url = '/message/sent';
				this.app = setupTest.mockApp();
				this.app.use('/message', MessageRouter);
				message = new Message({
					from: this.user._id,
					to: (new User())._id,
					content: 'hi',
					type: messageTypes.message
				});
				await message.save();
				messageId = AES.encrypt(message._id.toString());
			} catch (err) {
				throw err;
			}
		})

		this.testAuth('DELETE');

		it('should return 200 with senderDelete to true', async () => {
			try {
				var messageDeleted: IMessageDocument;

				res = await request(this.app)
					.delete(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ id: messageId })
					.expect(200);
				messageDeleted = await Message.findOne({ _id: message._id });
				expect(messageDeleted.senderDelete).to.equal(true);
			} catch (err) {
				throw err;
			}
		})

		it('should return 200 with delete message', async () => {
			try {
				var messageDeleted: IMessageDocument;

				message.recipientDelete = true;
				await message.save();
				res = await request(this.app)
					.delete(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ id: messageId })
					.expect(200);
				messageDeleted = await Message.findOne({ _id: message._id });
				expect(messageDeleted).to.equal(null);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when message id not exist', async () => {
			try {
				res = await request(this.app)
					.delete(this.url)
					.set({ 'x-auth-token': accessToken })
					.expect(400);
				expect(res.body.message).to.match(/.*MESSAGE_ID_NOT_EXIST/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when message invalid', async () => {
			try {
				res = await request(this.app)
					.delete(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ id: 'invalidId' })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_MESSAGE_ID/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when invalid object id', async () => {
			try {
				res = await request(this.app)
					.delete(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ id: AES.encrypt('invalidId') })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_ID/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when message not exist', async () => {
			try {
				res = await request(this.app)
					.delete(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ id: AES.encrypt((new Message())._id.toString()) })
					.expect(400);
				expect(res.body.message).to.match(/.*MESSAGE_NOT_EXIST/);
			} catch (err) {
				throw err;
			}
		})
	})

	describe('/message (PUT)', () => {
		var message: IMessageDocument;
		var messageId: string;

		beforeEach(async () => {
			try {
				this.url = '/message';
				this.app = setupTest.mockApp();
				this.app.use('/message', MessageRouter);
				message = new Message({
					to: this.user._id,
					from: (new User())._id,
					content: 'bonjour',
					type: messageTypes.message
				})
				await message.save();
				messageId = AES.encrypt(message._id.toString());
			} catch (err) {
				throw err;
			}
		})

		this.testAuth('PUT');

		it('should return 200 with change read to true', async () => {
			try {
				var messageHasRead: IMessageDocument;

				res = await request(this.app)
					.put(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ id: messageId })
					.expect(200);
				messageHasRead = await Message.findOne({ _id: message._id });
				expect(messageHasRead.read).to.equal(true);
			} catch (err) {
				throw err;
			}
		});

		it('should return 400 when id not exist', async () => {
			try {
				res = await request(this.app)
					.put(this.url)
					.set({ 'x-auth-token': accessToken })
					.expect(400);
				expect(res.body.message).to.match(/.*MESSAGE_ID_NOT_EXIST/);
			} catch (err) {
				throw err;
			}
		});

		it('should return 400 when message invalid', async () => {
			try {
				res = await request(this.app)
					.put(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ id: 'invalidId' })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_MESSAGE_ID/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when invalid object id', async () => {
			try {
				res = await request(this.app)
					.put(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ id: AES.encrypt('invalidId') })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_ID/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when message not exist', async () => {
			try {
				res = await request(this.app)
					.put(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ id: AES.encrypt((new Message())._id.toString()) })
					.expect(400);
				expect(res.body.message).to.match(/.*MESSAGE_NOT_EXIST/);
			} catch (err) {
				throw err;
			}
		})
	})
	
	afterEach(async () => {
		try {
			sinon.restore();
			await setupTest.resetTestDB();
		} catch (err) {
			throw err;
		}
	});
})