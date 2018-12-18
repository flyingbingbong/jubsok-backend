import * as http from 'http';
import { Server } from 'ws';
import { IWss } from '../../types';
import addWsMessageRouter from './wsMessageRouter';
import addClientManager from './wsClientManager';
import onConnectionCb from './onConnection';
import { UserRouter } from '../../routes/ws';

export default (server: http.Server): IWss => {
	var wss: IWss = <IWss>(new Server({ server }));

	addClientManager(wss);
	addWsMessageRouter(wss);
	wss.onMessage('user', UserRouter);
	wss.on('connection', onConnectionCb(wss));
	return wss;
}