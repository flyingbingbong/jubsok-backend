import * as chai from 'chai';
import * as sinon from 'sinon';
import * as request from 'supertest';
import { response } from 'supertest';
import * as setupTest from '../../../setupTest';
import { FriendRouter } from '../';
import * as jwt from 'jsonwebtoken';
import { testHelper } from '../helpers';
import { AES } from '../../../utils';
import {
	User, IUserDocument, Message, IFriendDocument, Friend, IMessageDocument, messageTypes
} from '../../../models';

const expect = chai.expect;
const JWT_SECRET: string = <string>process.env.JWT_SECRET;

describe('friend router', () => {
	var res: response;
	var accessToken: string;
	this.testAuth = testHelper.testAuth;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			this.user = new User({
				nickname: 'foo',
				gender: 'female',
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
	})

	describe('/friend (GET)', () => {
		var users: Array<IUserDocument>;
		var friends: Array<IFriendDocument>;
		var f: IUserDocument;

		beforeEach(async () => {
			try {
				var i: number = 0;

				this.url = '/friend';
				this.app = setupTest.mockApp();
				this.app.use('/friend', FriendRouter);
				users = [];
				friends = [];
				while (i < 50) {
					f = new User();
					users.push(f);
					friends.push(new Friend({ users: [ this.user._id, f._id ] }));
					i++;
				}
				await User.insertMany(users);
				await Friend.insertMany(friends);
			} catch (err) {
				throw err;
			}
		})

		this.testAuth('GET');

		it('should return 200 with friends', async () => {
			try {
				var res2: response;

				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.expect(200);
				res2 = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ next: res.body.next })
					.expect(200);
				expect(res.body.items.length).to.equal(30);
				expect(res2.body.items.length).to.equal(friends.length - 30);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when invalid next cursor', async () => {
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
		})

		it('should return 400 when invalid next cursor objectId', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ next: AES.encrypt('invalidCursor') })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_ID/);
			} catch (err) {
				throw err;
			}
		})
	})

	describe('/friend (POST)', () => {
		var message: IMessageDocument;
		var messageId: string;
		var friend: IUserDocument;
		var wsClients: any;

		beforeEach(async () => {
			try {
				this.url = '/friend';
				friend = await User.create({
					sessions: [
						{ refreshToken: 'token1', publicKey: 'key1' },
						{ refreshToken: 'token2', publicKey: 'key2' },
					]
				});
				message = await Message.create({
					from: friend._id,
					to: this.user._id,
					type: messageTypes.friendRequest,
					content: 'hi'
				});
				messageId = AES.encrypt(message._id.toString());
				wsClients = {};
				for (let s of friend.sessions) {
					wsClients[s._id.toString()] = setupTest.mockWsClient();
				}
				this.app = setupTest.mockApp({ wss: { clients: wsClients }});
				this.app.use('/friend', FriendRouter);
			} catch (err) {
				throw err;
			}
		})

		this.testAuth('POST');

		it('should return 200', async () => {
			try {
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ messageId })
					.expect(200);
				expect(await Friend.findOne({
					users: { $all: [ this.user._id, friend._id ]}
				})).to.not.equal(null);
				expect(await Message.findOne({
					from: this.user._id,
					to: friend._id,
					type: messageTypes.receiveFriendRequest
				})).to.not.equal(null);
				for (let s of friend.sessions) {
					sinon.assert.calledOnce(wsClients[s._id.toString()].send);
				}
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when messageId not exist', async () => {
			try {
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.expect(400);
				expect(res.body.message).to.match(/.*MESSAGE_ID_NOT_EXIST/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when invalid messageId', async () => {
			try {
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ messageId: 'invalidId' })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_MESSAGE_ID/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when invalid messageId objectId', async () => {
			try {
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ messageId: AES.encrypt('invalidId') })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_ID/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when message not exist', async () => {
			try {
				message.to = (new User())._id;
				await message.save();
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ messageId })
					.expect(400);
				expect(res.body.message).to.match(/.*MESSAGE_NOT_EXIST/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 friend not exist', async () => {
			try {
				message.from = (new User())._id;
				await message.save();
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ messageId })
					.expect(400);
				expect(res.body.message).to.match(/.*USER_NOT_FOUND/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when already friend', async () => {
			try {
				await Friend.create({ users: [ this.user._id, friend._id ] })
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ messageId })
					.expect(400);
				expect(res.body.message).to.match(/.*ALREADY_FRIEND/);
			} catch (err) {
				throw err;
			}
		})
	})

	describe('/friend (DELETE)', () => {
		var friend: IUserDocument;

		beforeEach(async () => {
			try {
				this.url = '/friend';
				this.app = setupTest.mockApp();
				this.app.use('/friend', FriendRouter);
				friend = new User({ nickname: 'bar' });
				await friend.save();
				await Friend.create({ users: [ this.user._id, friend._id ] });
			} catch (err) {
				throw err;
			}
		})

		this.testAuth('DELETE');

		it('should return 200', async () => {
			try {
				res = await request(this.app)
					.delete(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ nickname: friend.nickname })
					.expect(200);
				expect(await Friend.findOne({
					users: { $all: [ this.user._id, friend._id ]}
				})).to.equal(null);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when nickname not exist', async () => {
			try {
				res = await request(this.app)
					.delete(this.url)
					.set({ 'x-auth-token': accessToken })
					.expect(400);
				expect(res.body.message).to.match(/.*NICKNAME_REQUIRED/);
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
});