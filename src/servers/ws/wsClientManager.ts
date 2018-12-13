import { IClientManageWs, ISession, IWsUser, IWsClient } from '../../types';
import { IUserDocument, User } from '../../models';
import * as jwt from 'jsonwebtoken';
import { parse as urlParse } from 'url';
import { parse as queryParse } from 'querystring';

const JWT_SECRET: string = <string>process.env.JWT_SECRET;
const MSG = {
	INSUFFICIENT_QUERY: 'INSUFFICIENT_QUERY',
	ACCESS_TOKEN_EXPIRED: 'ACCESS_TOKEN_EXPIRED',
	USER_NOT_EXIST: 'USER_NOT_EXIST',
	SESSION_NOT_EXIST: 'SESSION_NOT_EXIST',
	INVALID_TOKEN: 'INVALID_TOKEN',
}

export class ClientManager {
	public clients: any;

	constructor() {
		this.clients = {};
	}

	private queryParse(url: string): any {
		const query = urlParse(url || '').query;

		return queryParse(query);
	}

	public async authenticate(ws: IWsClient, url: string): Promise<string | null> {
		try {
			var user: IUserDocument;
			var decoded: any;
			var session: ISession | null;
			const query: any = this.queryParse(url);

			if (!(query['x-auth-token'] && query['refreshToken']))
				return MSG.INSUFFICIENT_QUERY;
			try {
				decoded = await jwt.verify(query['x-auth-token'], JWT_SECRET);
			} catch (err) {
				switch (err.name) {
					case 'TokenExpiredError':
						return MSG.ACCESS_TOKEN_EXPIRED;
					case 'JsonWebTokenError':
						return MSG.INVALID_TOKEN;
					default:
						throw err;
				}
			}
			user = await User.findOne({ 'facebookProvider.id': decoded.id });
			if (!user)
				return MSG.USER_NOT_EXIST;
			session = user.sessions.find(s => s.refreshToken === query['refreshToken']);
			if (!session)
				return MSG.SESSION_NOT_EXIST;
			ws.sessionId = session._id.toString();
			ws.userId = user._id.toString()
			return null;
		} catch (err) {
			throw err;
		}
	}
}

export default (wss: IClientManageWs) => {
	wss.clientManager = new ClientManager();
}