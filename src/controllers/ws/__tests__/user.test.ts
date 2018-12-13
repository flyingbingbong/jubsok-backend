import * as chai from 'chai';
import { SinonSpy } from 'sinon';
import * as sinon from 'sinon';
import * as setupTest from '../../../setupTest';
import { UserController } from '../';
import { User, IUserDocument, Friend, activeUserSeconds } from '../../../models';

const expect = chai.expect;

describe('ws user controller', () => {
	var req: any;
	var user: IUserDocument;
	var next: SinonSpy;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			req = setupTest.mockWsReq();
			next = sinon.spy(setupTest.mockNext());
			user = new User({
				nickname: 'foo',
				sessions: [{ refreshToken: 'rtoken', publicKey: 'pkey' }]
			});
			await user.save();
		} catch (err) {
			throw err;
		}
	});

	describe('getUser', () => {
		const getUser: Function = UserController.getUser;

		it('should contain user in req.auth.user', async () => {
			try {
				req.ws.userId = user._id.toString();
				await getUser(req, {}, next);
				expect(req.auth.user._id.toString()).to.equal(user._id.toString());
				sinon.assert.notCalled(req.ws.send);
				sinon.assert.calledOnce(next);
			} catch (err) {
				throw err;
			}
		});

		it('should send error', async () => {
			try {
				req.ws.userId = (new User())._id;
				await getUser(req, {}, next);
				sinon.assert.calledOnce(req.ws.send);
				sinon.assert.notCalled(next);
			} catch (err) {
				throw err;
			}
		});
	});

	describe('heartbeat', () => {
		const heartbeat: Function = UserController.heartbeat;
		const now: Date = new Date();
		var clock: sinon.SinonFakeTimers;

		beforeEach(async () => {
			try {
				req.auth = { user };
				req.ws.sessionId = req.auth.user.sessions[0]._id.toString();
				clock = sinon.useFakeTimers(now);
			} catch (err) {
				throw err;
			}
		})

		it('should update user and send data of users to track', async () => {
			try {
				await heartbeat(req, {}, next);
				expect(req.ws.isAlive).to.equal(true);
				expect(req.auth.user.lastSeen.getTime()).to.equal(now.getTime());
				expect(req.auth.user.sessions[0].lastSeen.getTime()).to.equal(now.getTime());	
				sinon.assert.calledOnce(next);
			} catch (err) {
				throw err;
			}
		});
	})

	describe('broadcastConnection', () => {
		enum broadcastConnection {
			getSessions=0,
			broadcast
		}
		const now: Date = new Date();
		var friends: Array<IUserDocument>;
		var clock: sinon.SinonFakeTimers;

		beforeEach(async () => {
			try {
				req.auth = {};
				clock = sinon.useFakeTimers(now);
				friends = [
					new User({
						nickname: 'friend1',
						sessions: [
							{
								refreshToken: 'token1', publicKey: 'key1',
								lastSeen: new Date()
							},
							{
								refreshToken: 'token2', publicKey: 'key2',
								lastSeen: new Date()
							},
						]
					}),
					new User({
						nickname: 'friend2',
						sessions: [
							{
								refreshToken: 'token3', publicKey: 'key3',
								lastSeen: new Date()
							},
							{
								refreshToken: 'token4', publicKey: 'key4',
								lastSeen: (new Date()).setSeconds(
									now.getSeconds() - (activeUserSeconds * 2)
								)
							},
						]
					})
				];
				await User.insertMany(friends);
				await Friend.insertMany([
					{ users: [ user._id, friends[0]._id ]},
					{ users: [ user._id, friends[1]._id ]},
				]);
				for (let f of friends) {
					for (let s of f.sessions) {
						req.clients[s._id.toString()] = setupTest.mockWsClient();
					}
				}
			} catch (err) {
				throw err;
			}
		})

		describe('getSessions', () => {
			const getSessions: Function = UserController.broadcastConnection[
				broadcastConnection.getSessions
			];

			it('should get friends sessions', async () => {
				try {
					req.auth.user = user;
					await getSessions(req, {}, next);
					expect(req.sessions.length).to.equal(3);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})
		})

		describe('broadcast', () => {
			const broadcast: Function = UserController.broadcastConnection[
				broadcastConnection.broadcast
			];

			it('should send message', async () => {
				try {
					req.sessions = [];
					req.auth.user = user;
					for (let f of friends) {
						for (let s of f.sessions) {
							req.sessions.push(s._id.toString());
						}
					}
					await broadcast(req, {}, next);
					for (let f of friends) {
						for (let s of f.sessions) {
							sinon.assert.calledOnce(req.clients[s._id.toString()].send);
						}
					}
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})
		})
	})

	describe('welcome', () => {
		enum welcome {
			checkInput=0,
			checkUser,
			checkUserIsFriend,
			sendMessage,
		}
		var friend: IUserDocument;

		beforeEach(async () => {
			try {
				friend = new User({
					nickname: 'friend',
					sessions: [
						{ refreshToken: 'token1', publicKey: 'key1' },
						{ refreshToken: 'token2', publicKey: 'key2' },
					]
				});
				await friend.save();
				for (let s of friend.sessions) {
					req.clients[s._id.toString()] = setupTest.mockWsClient();
				}
				req.auth = { user };
			} catch (err) {
				throw err;
			}
		})

		describe('checkInput', () => {
			const checkInput: Function = UserController.welcome[
				welcome.checkInput
			];

			it('should success', async () => {
				try {
					await checkInput(req, { to: friend.nickname }, next);
					sinon.assert.notCalled(req.ws.send);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})

			it('should send error', async () => {
				try {
					await checkInput(req, {}, next);
					sinon.assert.calledOnce(req.ws.send);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			})
		})

		describe('checkUser', () => {
			const checkUser: Function = UserController.welcome[
				welcome.checkUser
			];

			it('should success', async () => {
				try {
					await checkUser(req, { to: friend.nickname }, next);
					expect(req.friend._id.toString()).to.equal(friend._id.toString());
					sinon.assert.notCalled(req.ws.send);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})

			it('should send error', async () => {
				try {
					await checkUser(req, {}, next);
					sinon.assert.calledOnce(req.ws.send);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			})
		})

		describe('checkUserIsFriend', () => {
			const checkUserIsFriend: Function = UserController.welcome[
				welcome.checkUserIsFriend
			];

			it('should success', async () => {
				try {
					await Friend.create({ users: [ req.auth.user._id, friend._id ] });
					req.friend = friend;
					await checkUserIsFriend(req, {}, next);
					sinon.assert.notCalled(req.ws.send);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})

			it('should send error', async () => {
				try {
					req.friend = friend;
					await checkUserIsFriend(req, {}, next);
					sinon.assert.calledOnce(req.ws.send);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			})
		})

		describe('sendMessage', () => {
			const sendMessage: Function = UserController.welcome[
				welcome.sendMessage
			];

			it('should success', async () => {
				try {
					await Friend.create({ users: [ req.auth.user._id, friend._id ] });
					req.friend = friend;
					await sendMessage(req, {}, next);
					for (let s of friend.sessions) {
						sinon.assert.calledOnce(req.clients[s._id.toString()].send);
					}
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})
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