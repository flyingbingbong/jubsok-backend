import { IRedisClient } from '../types';
import * as sinon from 'sinon';

export const mockRedisClient = (args: any={}): IRedisClient => {
	return {
		hset: args.hset || sinon.spy(),
		hget: args.hget || sinon.spy(),
		hdel: args.hdel || sinon.spy(),
		flushdb: args.flushdb || sinon.spy()
	};
}