import * as redis from 'redis';
import { IRedisClient } from '../types';
import { RedisClient } from 'redis';
import { redisAsyncDecorator } from '../utils';

const REDIS_PORT: number = parseInt(<string>process.env['REDIS_PORT'], 10);
const REDIS_HOST: string = <string>process.env['REDIS_HOST'];

export default (): IRedisClient => {
	const client: RedisClient = redis.createClient({
		host: REDIS_HOST,
		port: REDIS_PORT
	});

	return redisAsyncDecorator(client);
}