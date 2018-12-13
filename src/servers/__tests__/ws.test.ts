import * as chai from 'chai';
import * as sinon from 'sinon';
import { SinonSpy, SinonStub } from 'sinon';
import * as wsMessageRouter from '../ws/wsMessageRouter';
import * as wsClientManager from '../ws/wsClientManager';
import onMessageCb from '../ws/onMessage';
import onConnectionCb, { ping } from '../ws/onConnection';
import onCloseCb, { broadcastDisconnection } from '../ws/onClose';
import * as setupTest from '../../setupTest';
import { IWsData } from '../../types';
import * as jwt from 'jsonwebtoken';
import { User, Friend, IUserDocument, activeUserSeconds } from '../../models';
import { Data } from 'ws';

const expect = chai.expect;

describe('ws server', () => {
	var wss: any;
	var ws: any;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			wss = {};
			ws = setupTest.mockWsClient();;
		} catch (err) {
			throw err;
		}
	});

	describe('wsMessageRouter', async () => {
		var router: wsMessageRouter.MessageRouter;
		var signal: SinonSpy;
		var type: string;

		beforeEach(async () => {
			try {
				router = new wsMessageRouter.MessageRouter();
				signal = sinon.spy();
				type = 'foo';
			} catch (err) {
				throw err;
			}
		});

		describe('MessageRouter', () => {
			describe('handle', () => {
				it('should execute functions when router.handle', async () => {
					try {
						const data: IWsData = <IWsData>{ type };
	
						var req: any = { ws };
						var f1: Function = (req, data, next) => {
							req.foo = 1;
							signal();
							next();
						};
						var f2: Function = (req, data, next) => {
							expect(req.foo).to.equal(1);
							signal();
							next();
						};
		
						router.stackMap = {
							[type]: [ f1, f2 ]
						}
						await router.handle(req, data, 'msgPrefix');
						expect(signal.callCount).to.equal(2);
					} catch (err) {
						throw err;
					}
				})
		
				it('should not call next function when throw error', async () => {
					try {
						const data: IWsData = <IWsData>{ type };
						var req: any = { ws };
						var f1: Function = (req, data, next) => {
							req.foo = 1;
							signal();
							next(Error('err'));
						};
						var f2: SinonSpy = sinon.spy();
		
						router.stackMap = {
							[type]: [ f1, f2 ]
						}
						await router.handle(req, data, 'msgPrefix');
						sinon.assert.calledOnce(signal);
						sinon.assert.notCalled(f2);
					} catch (err) {
						throw err;
					}
				});
			})

			describe('use', () => {
				it('should push in stack', async () => {
					try {
						var arr: Array<number> = [];
						const f1: Function = () => { arr.push(1) };
						const f2: Function = () => { arr.push(2) };
						const f3: Function = () => { arr.push(3) };
						const f4: Function = () => { arr.push(4) };
						const f5: Function = () => { arr.push(5) };

						router.use(
							type,
							f1,
							[ f2, [f3, f4], f5 ]
						);
						router.stackMap[type].forEach(f => f());
						expect(arr).to.deep.equal([ 1,2,3,4,5 ]);	
					} catch (err) {
						throw err;
					}
				})
			})
		})

		describe('addOnMessage', async () => {
			var userRouter: wsMessageRouter.MessageRouter;

			beforeEach(async () => {
				try {
					userRouter = new wsMessageRouter.MessageRouter();
				} catch (err) {
					throw err;
				}
			})

			it('should push stack with router', async () => {
				try {
					var arr: Array<number> = [];

					wss.messageRouter = new wsMessageRouter.MessageRouter();
					wsMessageRouter.addOnMessage(wss);
					userRouter.use('hi', () => { arr.push(1) });
					userRouter.use('bye', () => { arr.push(2) });
					wss.onMessage('user', userRouter);
					wss.messageRouter.stackMap['user/hi'][0]();
					expect(arr.pop()).to.equal(1);
					wss.messageRouter.stackMap['user/bye'][0]();
					expect(arr.pop()).to.equal(2);
				} catch (err) {
					throw err;
				}
			});
		})
	});

	describe('wsClientManager', async () => {
		var manager: wsClientManager.ClientManager;
		var user: IUserDocument;
		var fakeJwtVerify: SinonStub;

		beforeEach(async () => {
			try {
				manager = new wsClientManager.ClientManager();
				user = new User({
					facebookProvider: { id: 'nao@gmail.com' },
					sessions: [
						{ refreshToken: 'token1', publicKey: 'key1' },
						{ refreshToken: 'token2', publicKey: 'key2' },
					]
				});
				await user.save();
				fakeJwtVerify = sinon.stub(jwt, 'verify');
			} catch (err) {
				throw err;
			}
		});

		describe('authenticate', async () => {
			it('should set userId, sessionId to ws', async () => {
				try {
					const url: string
						= `/?x-auth-token=xtoken&refreshToken=${user.sessions[0].refreshToken}`;
					var result: string | null;
	
					fakeJwtVerify.resolves({ id: user.facebookProvider.id });
					result = await manager.authenticate(ws, url);
					expect(result).to.equal(null);
					expect(ws.sessionId).to.equal(user.sessions[0]._id.toString());
					expect(ws.userId).to.equal(user._id.toString());
				} catch (err) {
					throw err;
				}
			});
	
			it('should return error message when query insufficient', async () => {
				try {
					const url: string = '';
					var result: string | null;
	
					result = await manager.authenticate(ws, url);
					expect(typeof result).to.equal('string');
					expect(ws.sessionId).to.equal(undefined);
					expect(ws.userId).to.equal(undefined);
				} catch (err) {
					throw err;
				}
			});
	
			it('should return error message when token expired', async () => {
				try {
					const url: string
						= `/?x-auth-token=xtoken&refreshToken=${user.sessions[0].refreshToken}`;
					var result: string | null;
	
					fakeJwtVerify.rejects('TokenExpiredError');
					result = await manager.authenticate(ws, url);
					expect(typeof result).to.equal('string');
					expect(ws.sessionId).to.equal(undefined);
					expect(ws.userId).to.equal(undefined);
				} catch (err) {
					throw err;
				}
			});

			it('should return error message when invalid token', async () => {
				try {
					const url: string
						= `/?x-auth-token=xtoken&refreshToken=${user.sessions[0].refreshToken}`;
					var result: string | null;
	
					fakeJwtVerify.rejects('JsonWebTokenError');
					result = await manager.authenticate(ws, url);
					expect(typeof result).to.equal('string');
					expect(ws.sessionId).to.equal(undefined);
					expect(ws.userId).to.equal(undefined);
				} catch (err) {
					throw err;
				}
			});

			it('should throw error when jwt verify other error', async () => {
				try {
					const url: string
						= `/?x-auth-token=xtoken&refreshToken=${user.sessions[0].refreshToken}`;
					var result: string | null;
	
					fakeJwtVerify.rejects('myError');
					result = await manager.authenticate(ws, url);
				} catch (err) {
					if (err.name === 'myError')
						return;
					throw err;
				}
			});
	
			it('should return error message when user not exist', async () => {
				try {
					const notExistToken: string = 'notExistToken';
					const url: string = `/?x-auth-token=xtoken&refreshToken=${notExistToken}`;
					var result: string | null;
	
					fakeJwtVerify.resolves({ id: 'notExistId' });
					result = await manager.authenticate(ws, url);
					expect(typeof result).to.equal('string');
					expect(ws.sessionId).to.equal(undefined);
					expect(ws.userId).to.equal(undefined);
				} catch (err) {
					throw err;
				}
			})

			it('should return error message when invalid session token', async () => {
				try {
					const notExistToken: string = 'notExistToken';
					const url: string = `/?x-auth-token=xtoken&refreshToken=${notExistToken}`;
					var result: string | null;
	
					fakeJwtVerify.resolves({ id: user.facebookProvider.id });
					result = await manager.authenticate(ws, url);
					expect(typeof result).to.equal('string');
					expect(ws.sessionId).to.equal(undefined);
					expect(ws.userId).to.equal(undefined);
				} catch (err) {
					throw err;
				}
			})
		})
	});

	describe('onMessage', async () => {
		var fakeMessageRouterHandle: SinonStub;
		var messageRouter: wsMessageRouter.MessageRouter;

		beforeEach(async () => {
			try {
				messageRouter = new wsMessageRouter.MessageRouter();
				fakeMessageRouterHandle = sinon.stub(messageRouter, 'handle');
			} catch (err) {
				throw err;
			}
		});

		it('should successfully call handle', async () => {
			try {
				const data = '{"foo": "bar"}';

				await onMessageCb(ws, {}, messageRouter)(<Data>data);
				sinon.assert.calledOnce(fakeMessageRouterHandle);
			} catch (err) {
				throw err;
			}
		});

		it('should be quiet when data is empty', async () => {
			try {
				await onMessageCb(ws, {}, messageRouter)('');
				sinon.assert.notCalled(fakeMessageRouterHandle);
			} catch (err) {
				throw err;
			}
		});

		it('should call ws.send when JSON parse error', async () => {
			try {
				const data = '{"foo"": "bar"}';

				await onMessageCb(ws, {}, messageRouter)(data);
				sinon.assert.calledOnce(ws.send);
			} catch (err) {
				throw err;
			}
		});
	});

	describe('onConnection', async () => {
		beforeEach(async () => {
			try {
				wss = setupTest.mockWsServer();
			} catch (err) {
				throw err;
			}
		});

		describe('ping', async () => {
			it('should ping', async () => {
				try {
					ws.isAlive = true;
					ping(ws)();
					expect(ws.isAlive).to.equal(false);
					sinon.assert.calledOnce(ws.ping);
				} catch (err) {
					throw err;
				}
			});
	
			it('should not ping', async () => {
				try {
					ws.isAlive = false;
					ping(ws)();
					sinon.assert.calledOnce(ws.close);
				} catch (err) {
					throw err;
				}
			});
		})
		
		describe('onConnectionCb', async () => {
			beforeEach(async () => {
				try {
					wss.clientManager.authenticate = sinon.stub();
				} catch (err) {
					throw err;
				}
			})

			it('should successfully assign properties', async () => {
				try {
					const sessionId: string = 'sessionId';
					const userId: string = 'userId';

					wss.clientManager.authenticate.callsFake(() => {
						ws.sessionId = sessionId;
						ws.userId = userId;
					});
					await onConnectionCb(wss)(ws, {url: 'foo'});
					expect(wss.clientManager.clients[sessionId]).to.equal(ws);
					expect(ws.sessionId).to.equal(sessionId);
					expect(ws.userId).to.equal(userId);
					expect(ws.isAlive).to.equal(true);
				} catch (err) {
					throw err;
				}
			});

			it('should call ws.send & ws.close when authenticate error', async () => {
				try {
					wss.clientManager.authenticate.resolves('auth fail');
					await onConnectionCb(wss)(ws, {url: 'foo'});
					expect(ws.heartbeat).to.equal(undefined);
					sinon.assert.calledOnce(ws.close);
					sinon.assert.calledOnce(ws.send);
				} catch (err) {
					throw err;
				}
			});

			it('should call ws.close when error', async () => {
				try {
					wss.clientManager.authenticate.rejects('db error');
					await onConnectionCb(wss)(ws, {url: 'foo'});
					expect(ws.heartbeat).to.equal(undefined);
					sinon.assert.calledOnce(ws.close);
				} catch (err) {
					throw err;
				}
			});
		})
	})

	describe('onClose', () => {
		var user: IUserDocument;
		const now: Date = new Date();
		var friends: Array<IUserDocument>;
		var clock: sinon.SinonFakeTimers;

		beforeEach(async () => {
			try {
				clock = sinon.useFakeTimers(now);
				wss = setupTest.mockWsServer();
				user = new User({
					nickname: 'foo',
					sessions: [
						{ refreshToken: 'token1', 'publicKey': 'key1' },
						{ refreshToken: 'token2', 'publicKey': 'key2' },
					]
				});
				friends = [
					new User({
						nickname: 'friend1',
						sessions: [
							{
								refreshToken: 'token3', publicKey: 'key3',
								lastSeen: new Date()
							},
							{
								refreshToken: 'token4', publicKey: 'key4',
								lastSeen: new Date()
							},
						]
					}),
					new User({
						nickname: 'friend2',
						sessions: [
							{
								refreshToken: 'token5', publicKey: 'key5',
								lastSeen: new Date()
							},
							{
								refreshToken: 'token6', publicKey: 'key6',
								lastSeen: new Date()
							},
						]
					})
				];
				await user.save();
				await User.insertMany(friends);
				await Friend.insertMany([
					{ users: [ user._id, friends[0]._id ]},
					{ users: [ user._id, friends[1]._id ]},
				]);
				for (let f of friends) {
					for (let s of f.sessions) {
						wss.clientManager.clients[s._id.toString()]
							= setupTest.mockWsClient();
					}
				}
			} catch (err) {
				throw err;
			}
		})

		describe('broadcastDisconnection', () => {
			it('should send disconnecton to friend', async () => {
				try {
					var clients: any = wss.clientManager.clients;
				
					await broadcastDisconnection(user, clients);
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

		describe('onCloseCb', () => {
			var flag: boolean;

			beforeEach(async () => {
				try {
					flag = true;
					ws.userId = user._id.toString();
					ws.sessionId = user.sessions[0]._id.toString();
					ws.heartbeat = setInterval(() => { flag = false }, 3000);
					wss.clientManager.clients[ws.sessionId] = ws;
				} catch (err) {
					throw err;
				}
			})

			it('should stop heartbeat, delete clients, broadcast disconnection', async () => {
				try {
					var clients: any = wss.clientManager.clients;

					const u = new User({ nickname: 'ni' });
					await u.save();
					await onCloseCb(wss, ws)();
					clock.tick(4000);
					expect(clients[ws.sessionId]).to.equal(undefined);
					expect(flag).to.equal(true);
					for (let f of friends) {
						for (let s of f.sessions) {
							sinon.assert.calledOnce(clients[s._id.toString()].send);
						}	
					}
				} catch (err) {
					throw err;
				}
			})

			it('should stop heartbeat, delete clients', async () => {
				try {
					var clients: any = wss.clientManager.clients;
	
					clients[user.sessions[1]._id.toString()] = setupTest.mockWsClient();
					await onCloseCb(wss, ws)();
					clock.tick(4000);
					expect(clients[ws.sessionId]).to.equal(undefined);
					expect(flag).to.equal(true);
					for (let f of friends) {
						for (let s of f.sessions) {
							sinon.assert.notCalled(clients[s._id.toString()].send);
						}	
					}
				} catch (err) {
					throw err;
				}
			});
		})
	});

	afterEach(async () => {
		try {
			sinon.restore();
			await setupTest.resetTestDB();
		} catch (err) {
			throw err;
		}
	});
})