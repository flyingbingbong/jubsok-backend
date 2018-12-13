import * as chai from 'chai';
import * as sinon from 'sinon';
import * as setupTest from '../../../setupTest';
import onMessage from '../../../servers/ws/onMessage';
import addWsMessageRouter from '../../../servers/ws/wsMessageRouter';
import { UserRouter } from '../';
import { IUserDocument, User, Friend } from '../../../models';
import { WsMessageType } from '../../../utils';

const expect = chai.expect;

describe('ws user router', () => {
	var wss: any;
	var ws: any;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			this.user = new User({
				nickname: 'foo',
				sessions: [{ refreshToken: 'token1', publicKey: 'key1' }]
			});
			await this.user.save();
			wss = {};
			addWsMessageRouter(wss);
			ws = setupTest.mockWsClient();
			ws.userId = this.user._id.toString();
			ws.sessionId = this.user.sessions[0]._id.toString();
			wss.onMessage('user', UserRouter);
		} catch (err) {
			throw err;
		}
	});

	describe('user/broadcastConnection', () => {
		var clients: any;
		var friends: Array<IUserDocument>;

		beforeEach(async () => {
			try {
				this.type = 'user/broadcastConnection';
				friends = await User.insertMany([
					{
						sessions: [ { refreshToken: 'token1', publicKey: 'key1' } ]
					},
					{
						sessions: [
							{ refreshToken: 'token2', publicKey: 'key2' },
							{ refreshToken: 'token3', publicKey: 'key3' }
						]
					},
				]);
				await Friend.insertMany([
					{ users: [ this.user._id, friends[0]._id ] },
					{ users: [ this.user._id, friends[1]._id ] },
				]);
				clients = {};
				for (let f of friends) {
					for (let s of f.sessions) {
						clients[s._id.toString()] = setupTest.mockWsClient()
					}
				}
				this.send = onMessage(ws, clients, wss.messageRouter);
			} catch (err) {
				throw err;
			}
		})

		it('should broadcast to friends sessions', async () => {
			try {
				await this.send(JSON.stringify({
					type: this.type
				}));
				for (let f of friends) {
					for (let s of f.sessions) {
						sinon.assert.calledOnce(clients[s._id.toString()].send);
					}
				}	
			} catch (err) {
				throw err;
			}
		})
	});

	describe('user/heartbeat', () => {
		var now: Date;
		var clock: sinon.SinonFakeTimers;

		beforeEach(async () => {
			try {
				this.type = 'user/heartbeat';
				this.send = onMessage(ws, {}, wss.messageRouter);
				now = new Date();
				clock = sinon.useFakeTimers(now);
			} catch (err) {
				throw err;
			}
		})

		it('should update user lastSeen', async () => {
			try {
				var expectedUser: IUserDocument;

				clock.tick(1000);
				await this.send(JSON.stringify({
					type: this.type
				}));
				expectedUser = await User.findOne({ _id: this.user._id });
				expect(expectedUser.lastSeen.getTime()).to.equal(now.getTime() + 1000);
				expect(expectedUser.sessions[0].lastSeen.getTime())
					.to.equal(now.getTime() + 1000);
			} catch (err) {
				throw err;
			}
		})
	})
	
	describe('user/welcome', () => {
		var friend: IUserDocument;
		var clients: any;

		beforeEach(async () => {
			try {
				this.type = 'user/welcome';
				clients = {};
				friend = await User.create({
					nickname: 'bar',
					sessions: [
						{ refreshToken: 'token1', publicKey: 'key1' },
						{ refreshToken: 'token2', publicKey: 'key2' },
					]
				});
				for (let s of friend.sessions) {
					clients[s._id.toString()] = setupTest.mockWsClient()
				}
				this.send = onMessage(ws, clients, wss.messageRouter);
				await Friend.create({ users: [ this.user._id, friend._id ] });
			} catch (err) {
				throw err;
			}
		})

		it('should send welcome message to friend', async () => {
			try {
				await this.send(JSON.stringify({
					type: this.type,
					data: { to: friend.nickname }
				}));
				for (let s of friend.sessions) {
					sinon.assert.calledOnce(clients[s._id.toString()].send);
				}
			} catch (err) {
				throw err;
			}
		})

		it('should send message when input data not exist', async () => {
			try {
				var message: string;

				await this.send(JSON.stringify({
					type: this.type,
				}));
				message = JSON.parse(ws.send.getCall(0).args[0]).message;
				expect(message).to.match(/.*INSUFFICIENT_INPUT_DATA/);
			} catch (err) {
				throw err;
			}
		})

		it('should send message when user not exist', async () => {
			try {
				var message: string;

				await this.send(JSON.stringify({
					type: this.type,
					data: { to: 'notExistNickname' }
				}));
				message = JSON.parse(ws.send.getCall(0).args[0]).message;
				expect(message).to.match(/.*USER_NOT_EXIST/);
			} catch (err) {
				throw err;
			}
		})

		it('should send message when not friend', async () => {
			try {
				var message: string;

				await Friend.deleteOne({ users: friend._id });
				await this.send(JSON.stringify({
					type: this.type,
					data: { to: friend.nickname }
				}));
				message = JSON.parse(ws.send.getCall(0).args[0]).message;
				expect(message).to.match(/.*NOT_FRIEND/);
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