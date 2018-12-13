import { SinonSpy } from 'sinon';
import * as sinon from 'sinon';

interface MockWsServer {
	clientManager: any,
	messageRouter: any,
	onMessage(Function): void
}

interface MockWsClient {
	send: SinonSpy,
	close: SinonSpy,
	ping: SinonSpy,
	session_id?: string,
	user_id?: string,
	isAlive?: boolean,
	heartbeat?: NodeJS.Timer,
}

interface MockWsReq {
	clients: any,
	ws: MockWsClient,
}

export const mockWsServer = (args: any={}): MockWsServer => {
	return {
		clientManager: {
			clients: args.clients || {},
			authenticate: sinon.spy()
		},
		messageRouter: {
			handle: sinon.spy()
		},
		onMessage: sinon.spy()
	}
}

export const mockWsClient = (): MockWsClient => {
	return {
		send: sinon.spy(),
		close: sinon.spy(),
		ping: sinon.spy(),
	}
}

export const mockWsReq = (): MockWsReq => {
	return {
		clients: {},
		ws: mockWsClient()
	}
}