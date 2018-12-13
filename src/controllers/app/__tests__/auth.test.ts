import * as chai from 'chai';
import { SinonStub, SinonSpy } from 'sinon';
import * as sinon from 'sinon';
import * as passport from 'passport';
import * as jwt from 'jsonwebtoken';
import { AuthController } from '../';
import { User, IUserDocument } from '../../../models';
import * as setupTest from '../../../setupTest';

const expect = chai.expect;

describe('Auth controller', () => {
	var req: any;
	var res: any;
	var next: SinonSpy;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			req = setupTest.mockReq();
			res = setupTest.mockRes();
			next = sinon.spy(setupTest.mockNext());
		} catch (err) {
			throw err;
		}
	});

	describe('facebookLogin', () => {
		enum facebookLogin {
			checkPublicKeyExist=0,
			login
		}
		
		describe('checkPublicKeyExist', () => {
			const checkPublicKeyExist: Function = AuthController.facebookLogin[
				facebookLogin.checkPublicKeyExist
			];

			it('should success', async () => {
				try {
					req.body.publicKey = 'key';
					await checkPublicKeyExist(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})

			it('should return 400', async () => {
				try {
					await checkPublicKeyExist(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			})
		});

		describe('login', () => {
			const login: Function = AuthController.facebookLogin[
				facebookLogin.login
			];
			var fakePassportAuth: SinonStub;
			var user: IUserDocument;

			beforeEach(async () => {
				try {
					fakePassportAuth = sinon.stub(passport, 'authenticate');
					user = new User({
						nickname: 'foo',
						facebookProvider: {
							id: 'bar'
						}
					});
					await user.save();
				} catch (err) {
					throw err;
				}
			});

			it('should success', async () => {
				try {
					fakePassportAuth.returns(async (req, res, next) => {
						req.user = { id: user.facebookProvider.id }
					});
					await login(req, res, next);
					expect(req.auth.id).to.equal(user.facebookProvider.id);
					expect(req.auth.user._id.toString()).to.equal(user._id.toString());
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 401', async () => {
				try {
					fakePassportAuth.returns(async (req, res, next) => {});
					await login(req, res, next);
					sinon.assert.calledWith(res.status, 401);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})
	});

	describe('generateAccessToken', async () => {
		const generateAccessToken: Function = AuthController.generateAccessToken;

		it('should generate accessToken', async () => {
			try {
				req.auth = { id: 'userid' };
				await generateAccessToken(req, res, next);
				expect(req.accessToken).to.not.equal(undefined);
				expect(req.accessToken).to.not.equal(null);
				sinon.assert.calledOnce(next);
			} catch (err) {
				throw err;
			}
		});
	})
	
	describe('generateRefreshToken', async () => {
		const generateRefreshToken: Function = AuthController.generateRefreshToken;

		it('should generate refreshToken', async () => {
			try {
				req.auth = { id: 'userid' };
				await generateRefreshToken(req, res, next);
				expect(req.refreshToken).to.not.equal(undefined);
				expect(req.refreshToken).to.not.equal(null);
				sinon.assert.calledOnce(req.redis.hset);
				sinon.assert.calledOnce(next);
			} catch (err) {
				throw err;
			}
		});
	});

	describe('sendToken', async () => {
		const sendToken: Function = AuthController.sendToken;

		it('should send tokens', async () => {
			try {
				req.accessToken = 'accessToken';
				req.refreshToken = 'refreshToken';
				req.auth = { id: 'userid' };
				await sendToken(req, res, next);
				sinon.assert.calledWith(res.status, 200);
				sinon.assert.calledWith(res.json, {
					accessToken: req.accessToken,
					refreshToken: req.refreshToken,
				});
				sinon.assert.calledOnce(next);
			} catch (err) {
				throw err;
			}
		});
	});

	describe('validateRefreshToken', async () => {
		enum validateRefreshToken {
			checkInput=0,
			validateToken
		}

		describe('checkInput', () => {
			const checkInput: Function = AuthController.validateRefreshToken[
				validateRefreshToken.checkInput
			];

			it('should success', async () => {
				try {
					req.body = { refreshToken: 'token', id: 'id' };
					await checkInput(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400', async () => {
				try {
					await checkInput(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('validateToken', () => {
			const validateToken: Function = AuthController.validateRefreshToken[
				validateRefreshToken.validateToken
			];

			it('should success', async () => {
				try {
					req.body = { refreshToken: 'token', id: 'id' };
					req.redis.hget = sinon.stub().resolves(req.body.id);
					await validateToken(req, res, next);
					expect(req.auth.id).to.equal(req.body.id);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 401', async () => {
				try {
					req.body = { refreshToken: 'token', id: 'wrongId' };
					req.redis.hget = sinon.stub().resolves('id');
					await validateToken(req, res, next);
					sinon.assert.calledWith(res.status, 401);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})
	});

	describe('authenticate', () => {
		enum authenticate {
			checkInput=0,
			verifyToken,
			checkUserExist
		}

		describe('checkInput', () => {
			const checkInput: Function = AuthController.authenticate[
				authenticate.checkInput
			];

			it('should success', async () => {
				try {
					req.headers['x-auth-token'] = 'token';
					await checkInput(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400', async () => {
				try {
					await checkInput(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		});

		describe('verifyToken', () => {
			const verifyToken: Function = AuthController.authenticate[
				authenticate.verifyToken
			];
			var fakeJwtVerify: SinonStub;

			beforeEach(async () => {
				try {
					fakeJwtVerify = sinon.stub(jwt, 'verify');
				} catch (err) {
					throw err;
				}
			});

			it('should success', async () => {
				try {
					var expectedDecoded: string = 'decoded';

					fakeJwtVerify.resolves(expectedDecoded);
					await verifyToken(req, res, next);
					expect(req.decoded).to.equal(expectedDecoded);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 401 when token expired', async () => {
				try {
					fakeJwtVerify.rejects('TokenExpiredError');
					await verifyToken(req, res, next);
					sinon.assert.calledWith(res.status, 401);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 401 when token error', async () => {
				try {
					fakeJwtVerify.rejects('JsonWebTokenError');
					await verifyToken(req, res, next);
					sinon.assert.calledWith(res.status, 401);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});

			it('should call next with error when error', async () => {
				try {
					fakeJwtVerify.rejects('myError');
					await verifyToken(req, res, next);
				} catch (err) {
					if (err.name === 'myError') {
						sinon.assert.notCalled(res.status);
						sinon.assert.calledOnce(next);
						return;
					}
					throw err;
				}
			});
		});

		describe('checkUserExist', () => {
			const checkUserExist: Function = AuthController.authenticate[
				authenticate.checkUserExist
			];
			var user: IUserDocument;

			beforeEach(async () => {
				try {
					user = new User({
						nickname: 'foo',
						facebookProvider: {
							id: 'bar'
						}
					});
					await user.save();
				} catch (err) {
					throw err;
				}
			});

			it('should success', async () => {
				try {
					req.decoded = { id: user.facebookProvider.id };
					await checkUserExist(req, res, next);
					expect(req.auth.id).to.equal(user.facebookProvider.id);
					expect(req.auth.user._id.toString()).to.equal(user._id.toString());
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 401', async () => {
				try {
					req.decoded = { id: 'notExistId' };
					await checkUserExist(req, res, next);
					sinon.assert.calledWith(res.status, 401);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})
	});

	describe('addSession',() => {
		const addSession = AuthController.addSession;
		var user: IUserDocument;

		beforeEach(async () => {
			try {
				user = new User();
				await user.save();
				req.auth = { user };
			} catch (err) {
				throw err;
			}
		});

		it('should push one session', async () => {
			try {
				req.refreshToken = 'refreshToken';
				req.publicKey = 'publicKey';
				await addSession(req, res, next);
				expect(req.auth.user.sessions.length).to.equal(1);
				sinon.assert.calledOnce(next);
			} catch (err) {
				throw err;
			}
		});

		it('should remove one session and push new one', async () => {
			try {
				var i: number = 1;

				while (i <= 5) {
					req.auth.user.sessions.push({
						refreshToken: `token${i}`,
						publicKey: `key${i}`,
						lastSeen: Date.now() + i
					});
					i++;
				}
				await req.auth.user.save();
				req.refreshToken = 'new token';
				req.publicKey = 'new key';
				await addSession(req, res, next);
				expect(req.auth.user.sessions.length).to.equal(5);
				expect(req.auth.user.sessions[4].refreshToken).to.equal(req.refreshToken);
				sinon.assert.calledOnce(next);
			} catch (err) {
				throw err;
			}
		});
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
