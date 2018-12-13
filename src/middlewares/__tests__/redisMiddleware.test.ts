import * as chai from 'chai';
import * as setupTest from '../../setupTest';
import { SinonSpy } from 'sinon';
import * as sinon from 'sinon';
import { addRedisPerRequest } from '../';
import { IRedisClient } from '../../types';

const expect = chai.expect;

describe('redis middleware', () => {
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

	describe('addRedisPerRequest', async () => {
		it('should contain redis in req', async () => {
			try {
				const mockRedis: any = { foo: 'bar' };
				await addRedisPerRequest(<IRedisClient>mockRedis)(req, res, next);
				expect(req.redis).to.deep.equal(mockRedis);
			} catch (err) {
				throw err;
			}
		})
	})

	afterEach(async () => {
		try {
			await setupTest.resetTestDB();
		} catch (err) {
			throw err;
		}
	});
})