import * as chai from 'chai';
import * as sinon from 'sinon';
import { SinonStub } from 'sinon';
import * as request from 'supertest';
import { response } from 'supertest';
import * as passport from 'passport';
import * as setupTest from '../../../setupTest';
import { User, IUserDocument } from '../../../models';
import { IApp } from '../../../types';
import { AuthRouter } from '../';

const expect = chai.expect;

describe('auth router', () => {
	var app: IApp;
	var res: response;
	var url: string;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
		} catch (err) {
			throw err;
		}
	});

	describe('/auth/facebook-login', async () => {
		const facebookId: string = 'jubsok@jubsok.com';
		var user: IUserDocument;
		var fakePassportAuth: SinonStub;

		beforeEach(async () => {
			try {
				url = '/auth/facebook-login';
				app = setupTest.mockApp();
				app.use('/auth', AuthRouter);
				user = new User({ facebookProvider: { id: facebookId } });
				await user.save();
				fakePassportAuth = sinon.stub(passport, 'authenticate');
			} catch (err) {
				throw err;
			}
		})

		it('should return 200 with tokens', async () => {
			try {
				fakePassportAuth.returns(
					async (req, res, next) => { req.user = { id: facebookId } }
				);
				res = await request(app)
					.post(url)
					.send({ publicKey: 'foo' })
					.expect(200);
				expect(res.body.accessToken).to.not.equal(undefined);
				expect(res.body.refreshToken).to.not.equal(undefined);
			} catch (err) {
				throw err;
			}
		});

		it('should return 400 when publicKey is not exist', async () => {
			try {
				res = await request(app)
					.post(url)
					.expect(400);
				expect(res.body.message).to.match(/.*PUBLICKEY_REQUIRED$/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 401 when passport authenticate fail', async () => {
			try {
				fakePassportAuth.returns(
					async (req, res, next) => { req.user = null }
				);
				res = await request(app)
					.post(url)
					.send({ publicKey: 'foo' })
					.expect(401);
				expect(res.body.message).to.match(/.*USER_NOT_FOUND$/);
			} catch (err) {
				throw err;
			}
		});
	});

	describe('/auth/token', () => {
		var fakeRedisHget: SinonStub;

		beforeEach(async () => {
			try {
				fakeRedisHget = sinon.stub();
				url = '/auth/token';
				app = setupTest.mockApp({
					redis: { hget: fakeRedisHget }
				});
				app.use('/auth', AuthRouter);
			} catch (err) {
				throw err;
			}
		})

		it('should return 200', async () => {
			try {
				const id: string = 'id';

				fakeRedisHget.resolves(id);
				res = await request(app)
					.post(url)
					.send({ refreshToken: 'token', id })
					.expect(200);
				expect(res.body.accessToken).to.not.equal(undefined);
			} catch (err) {
				throw err;
			}
		})

		it('should return 401', async () => {
			try {
				const id: string = 'id';

				fakeRedisHget.resolves('notExistId');
				res = await request(app)
					.post(url)
					.send({ refreshToken: 'token', id })
					.expect(401);
				expect(res.body.message).to.match(/.*USER_NOT_FOUND$/);
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