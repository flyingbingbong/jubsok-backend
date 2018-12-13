import { Request, Express } from 'express';
import { IUserDocument } from '../models';
import { Server } from 'ws';
import { RedisClient } from 'redis';
import { IRedisClient } from './redis.d';
import { IWss } from './ws.d';

export interface IApp extends Express {
	wss: IWss,
	redis: RedisClient
}

export interface IRequest extends Request {
	wsClients: any,
	redis: IRedisClient,
	auth?: {
		id: string,
		user?: IUserDocument
	},
	accessToken?: string,
	refreshToken?: string,
	user?: any
}

export interface IAuthRequest extends IRequest {
	auth: {
		id: string,
		user: IUserDocument
	}
}