export interface IRedisClient {
	hset(key: string, field: string, value: string): Promise<void>,
	hget(key: string, field: string): Promise<string>,
	hdel(key: string, field: string): Promise<void>,
	flushdb(): Promise<void>
}