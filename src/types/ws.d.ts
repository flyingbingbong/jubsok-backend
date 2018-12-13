import { Server } from 'ws';
import { IncomingMessage } from 'http';
import * as WebSocket from 'ws';
import { IUserDocument } from '../models';

export interface IWsClient extends WebSocket {
	sessionId: string,
	userId: string,
	heartbeat: NodeJS.Timer,
	isAlive: boolean
}

export interface IWsData extends IncomingMessage {
	type: string,
	data: any
}

export interface IWsRequest {
	ws: IWsClient,
	clients: any,
	auth?: {
		user: IUserDocument
	}
}

export interface IWsAuthRequest extends IWsRequest {
	auth: {
		user: IUserDocument
	}
}

export interface IMessageRouteWs extends Server {
	messageRouter?: any,
	onMessage?(type: string, router: any): void
}

export interface IClientManageWs extends Server {
	clientManager: {
		clients: any,
		authenticate(ws: IWsClient, url: string): Promise<string | null>
	}
}

export interface IWss extends IMessageRouteWs, IClientManageWs {}