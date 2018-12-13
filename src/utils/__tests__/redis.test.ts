import * as chai from 'chai';
import * as redis from 'redis';
import { IRedisClient } from '../../types';
import { redisAsyncDecorator } from '../';
import * as setupTest from '../../setupTest';

const expect = chai.expect;

describe.skip('redis util', () => {
	var client: IRedisClient;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			client = redisAsyncDecorator(
				redis.createClient({
					host: process.env.REDIS_HOST,
					port: parseInt(process.env.REDIS_PORT),
				})
			)
		} catch (err) {
			throw err;
		}
	});

	it('should hset, hget', async () => {
		try {
			const value: string = 'timon';
			const key: string = 'foo';
			const field: string = 'bar';

			await client.hset(key, field, value);
			expect(await client.hget(key, field)).to.equal(value);
		} catch (err) {
			throw err;
		}
	});

	afterEach(async () => {
		try {
			await client.flushdb();
			await setupTest.resetTestDB();
		} catch (err) {
			throw err;
		}
	});
})