import * as express from 'express';
import { IApp, IRedisClient } from '../types';
import * as sinon from 'sinon';
import { SinonSpy } from 'sinon';
import { mockRedisClient } from './redis';
import { mockWsServer } from './ws';
import { addWsPerRequest, addRedisPerRequest } from '../middlewares';

interface MockApp extends IApp {};

interface MockReq {
	wsClients?: any,
	redis?: any,
	accessToken?: any,
	refreshToken?: any,
	auth?: any,
	user?: any,
	headers?: any,
	header?(key: string): string,
	body?: any,
	query?: any
}

interface MockRes {
	header: SinonSpy,
	json: SinonSpy,
	end: SinonSpy,
	status: SinonSpy,
}

export const mockReq = (): MockReq => {
	var mock: MockReq = {
		wsClients: {},
		redis: mockRedisClient(),
		headers: {},
		header: (key: string): string => mock.headers[key],
		body: {},
		query: {}
	};
	
	return mock;
}

export const mockRes = (): MockRes => {
	var mock: MockRes = {
		header: sinon.spy(),
		json: sinon.spy(),
		end: sinon.spy(),
		status: sinon.spy((code: number) => mock)
	}

	return mock;
}

export const mockNext = () => (err) => {
	if (err)
		throw err;
	return;
}

export const mockApp = (args: any={}): MockApp => {
	const app = <MockApp>express();
	const wss: any = mockWsServer(args.wss || {});
	const redis: IRedisClient = mockRedisClient(args.redis || {});

	app.use(express.json());
	app.use(addWsPerRequest(wss));
	app.use(addRedisPerRequest(redis));
	return app;
}