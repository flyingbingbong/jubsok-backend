import * as chai from 'chai';
import * as sinon from 'sinon';
import * as request from 'supertest';
import { response } from 'supertest';
import * as setupTest from '../../../setupTest';
import { ChatRouter } from '../';
import * as jwt from 'jsonwebtoken';
import { testHelper } from '../helpers';
import { AES } from '../../../utils';
import {
	User, IUserDocument, ChatRoom, Message, IChatRoomDocument
} from '../../../models';

const expect = chai.expect;
const JWT_SECRET: string = <string>process.env.JWT_SECRET;

describe('chat router', () => {
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

	describe('/chat/room (POST)', () => {
		var userToChat: IUserDocument;
		var wsClients: any;

		beforeEach(async () => {
			try {
				this.url = '/chat/room';
				this.app = setupTest.mockApp();
				this.app.use('/chat', ChatRouter);
				userToChat = await User.create({
					nickname: 'bar',
					sessions: [
						{ refreshToken: 'token1', publicKey: 'key1' },
						{ refreshToken: 'token2', publicKey: 'key2' },
					]
				});
				await userToChat.save();
				wsClients = {};
				for (let s of userToChat.sessions) {
					wsClients[s._id.toString()] = setupTest.mockWsClient();
				}
				this.app = setupTest.mockApp({ wss: { clients: wsClients }});
				this.app.use('/chat', ChatRouter);
			} catch (err) {
				throw err;
			}
		})

		this.testAuth('POST');

		it('should return 200 with create chatRoom and message', async () => {
			try {
				var AESkeys: Array<string> = [ 'key1', 'key2' ];

				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ nickname: userToChat.nickname, AESkeys })
					.expect(200);
				expect((await ChatRoom.find()).length).to.equal(1);
				expect((await Message.find()).length).to.equal(1);
				for (let s of userToChat.sessions) {
					sinon.assert.calledOnce(wsClients[s._id.toString()].send);
				}
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when nickname not exist', async () => {
			try {
				var AESkeys: Array<string> = [ 'key1', 'key2' ];

				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ AESkeys })
					.expect(400);
				expect(res.body.message).to.match(/.*NICKNAME_REQUIRED/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when AESkeys not exist', async () => {
			try {
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ nickname: userToChat.nickname })
					.expect(400);
				expect(res.body.message).to.match(/.*ROOM_KEY_REQUIRED/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when user not exist', async () => {
			try {
				var AESkeys: Array<string> = [ 'key1', 'key2' ];

				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ nickname: 'notExistNickname', AESkeys })
					.expect(400);
				expect(res.body.message).to.match(/.*USER_NOT_FOUND/);
			} catch (err) {
				throw err;
			}
		})
	})

	describe('/chat/aeskeys', () => {
		var room: IChatRoomDocument;
		var rooms: Array<IChatRoomDocument>;
		var chatRoomId: string;

		beforeEach(async () => {
			try {
				this.url = '/chat/aeskeys';
				this.app = setupTest.mockApp();
				this.app.use('/chat', ChatRouter);
				rooms = await ChatRoom.insertMany([
					{
						users: [ this.user._id, (new User())._id ],
						keys: [ 'key1', 'key2' ]
					},
					{
						users: [ this.user._id, (new User())._id ],
						keys: [ 'key1', 'key2' ]
					},
					{
						users: [ this.user._id, (new User())._id ],
						keys: [ 'key1', 'key2' ]
					}
				]);
				room = rooms[1];
				chatRoomId = AES.encrypt(room._id.toString());
			} catch (err) {
				throw err;
			}
		})

		this.testAuth('GET');

		it('should return 200 with AES keys', async () => {
			try {
				var remainedRooms: Array<IChatRoomDocument>;

				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ chatRoomId })
					.expect(200);
				remainedRooms = await ChatRoom.find({ users: this.user._id });
				expect(remainedRooms.length).to.equal(1);
				expect(remainedRooms[0]._id.toString()).to.equal(room._id.toString());
				expect(res.body.keys).to.deep.equal(room.keys);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when chatRoomId not exist', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.expect(400);
				expect(res.body.message).to.match(/.*CHATROOM_ID_REQUIRED/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when chatRoomId is invalid', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ chatRoomId: 'invalidId' })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_CHATROOM_ID/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when chatRoomId is invalid objectId', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ chatRoomId: AES.encrypt('invalidId') })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_ID/);
			} catch (err) {
				throw err;
			}
		})
		
		it('should return 400 when chatRoom not exist', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ chatRoomId: AES.encrypt((new ChatRoom)._id.toString()) })
					.expect(400);
				expect(res.body.message).to.match(/.*CHATROOM_NOT_EXIST/);
			} catch (err) {
				throw err;
			}
		})
	})

	describe('/chat (GET)', () => {
		var now: Date;
		var room: IChatRoomDocument;
		var chatRoomId: string;

		beforeEach(async () => {
			try {
				var i: number = 0;

				this.url = '/chat';
				this.app = setupTest.mockApp();
				this.app.use('/chat', ChatRouter);
				room = new ChatRoom({
					users: [ this.user._id, (new User())._id ],
					keys: [ 'key1', 'key2' ],
				});
				now = new Date();
				while (i < 50) {
					let createdAt: Date = new Date();

					createdAt.setSeconds(now.getSeconds() + i)
					room.chats.push({
						content: 'hi',
						user: this.user._id,
						createdAt
					});
					i++;
				}
				await room.save();
				chatRoomId = AES.encrypt(room._id.toString());
			} catch (err) {
				throw err;
			}
		})

		this.testAuth('GET');

		it('should return 200 with chats', async () => {
			try {
				var res2: response;

				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ chatRoomId })
					.expect(200);
				res2 = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ chatRoomId, next: res.body.next })
					.expect(200);
				expect(res.body.items.length).to.equal(30);
				expect(res2.body.items.length).to.equal(room.chats.length - 30);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when chatRoomId not exist', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.expect(400);
				expect(res.body.message).to.match(/.*CHATROOM_ID_REQUIRED/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when chatRoomId is invalid', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ chatRoomId: 'invalidId' })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_CHATROOM_ID/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when chatRoomId is invalid objectId', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ chatRoomId: AES.encrypt('invalidId') })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_ID/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when chatRoom not exist', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ chatRoomId: AES.encrypt((new ChatRoom)._id.toString()) })
					.expect(400);
				expect(res.body.message).to.match(/.*CHATROOM_NOT_EXIST/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when invalid next cursor', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ chatRoomId, next: 'invalidCursor' })
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
					.query({ chatRoomId, next: AES.encrypt('invalidId') })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_ID/);
			} catch (err) {
				throw err;
			}
		})
	})

	describe('/chat (POST)', () => {
		var room: IChatRoomDocument;
		var userToChat: IUserDocument;
		var wsClients: any;

		beforeEach(async () => {
			try {
				this.url = '/chat';
				userToChat = await User.create({
					nickname: 'bar',
					sessions: [
						{ refreshToken: 'token1', publicKey: 'key1' },
						{ refreshToken: 'token2', publicKey: 'key2' },
					]
				});
				room = await ChatRoom.create({
					users: [ this.user._id, userToChat._id ],
					keys: [ 'key1' ]
				});
				wsClients = {};
				for (let s of userToChat.sessions) {
					wsClients[s._id.toString()] = setupTest.mockWsClient();
				}
				this.app = setupTest.mockApp({ wss: { clients: wsClients }});
				this.app.use('/chat', ChatRouter);
			} catch (err) {
				throw err;
			}
		})

		this.testAuth('POST');

		it('should return 200 with createdAt of chat', async () => {
			try {
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ content: 'hi', chatRoomId: AES.encrypt(room._id.toString()) })
					.expect(200);
				expect(res.body.createdAt).to.not.equal(undefined);
				expect(
					(await ChatRoom.findOne({ _id: room._id })).chats.length
				).to.equal(1);
				for (let s of userToChat.sessions) {
					sinon.assert.calledOnce(wsClients[s._id.toString()].send);
				}
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when content not exist', async () => {
			try {
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ chatRoomId: AES.encrypt(room._id.toString()) })
					.expect(400);
				expect(res.body.message).to.match(/.*INSUFFICIENT_INPUT_DATA/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when chatRoomId not exist', async () => {
			try {
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ chatRoomId: AES.encrypt(room._id.toString()) })
					.expect(400);
				expect(res.body.message).to.match(/.*INSUFFICIENT_INPUT_DATA/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when chatRoomId is invalid', async () => {
			try {
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ content: 'hi', chatRoomId: 'invalidId' })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_CHATROOM_ID/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when chatRoomId is invalid Objectid', async () => {
			try {
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ content: 'hi', chatRoomId: AES.encrypt('invalidId') })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_ID/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when chatRoom not exist', async () => {
			try {
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({
						content: 'hi',
						chatRoomId: AES.encrypt((new ChatRoom())._id.toString())
					})
					.expect(400);
				expect(res.body.message).to.match(/.*CHATROOM_NOT_EXIST/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when recipient not exist', async () => {
			try {
				room = await ChatRoom.create({
					users: [ this.user._id, (new User())._id ],
					keys: [ 'key1' ]
				});
				res = await request(this.app)
					.post(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ content: 'hi', chatRoomId: AES.encrypt(room._id.toString()) })
					.expect(400);
				expect(res.body.message).to.match(/.*RECIPIENT_NOT_EXIST/);
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