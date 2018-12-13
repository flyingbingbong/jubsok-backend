import { RedisClient } from 'redis';
import * as redisCommands from 'redis-commands';
import { IRedisClient } from '../types';

export enum RedisHashKey {
	refreshTokens='refreshTokens'
}

export const redisAsyncDecorator = (client: RedisClient): IRedisClient => {
	for (const prop in client) {
		if (typeof client[prop] === 'function' && redisCommands.list.includes(prop)) {
			client[prop] = decorator(client, client[prop]);
		}
	}
	return <IRedisClient><unknown>client;
}

const decorator = (client: RedisClient, method: Function): Function => {
	return (...args): Promise<void> => new Promise((resolve, reject) => {
		args.push((err: Error, ...results) => {
			if (err) {
				reject(err);
			} else {
				resolve(...results);
			}
		});
		method.apply(client, args);
	});
}