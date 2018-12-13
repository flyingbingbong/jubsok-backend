import * as http from 'http';
import { Server } from 'ws';
import { IWss } from '../../types';
import addWsMessageRouter from './wsMessageRouter';
import addClientManager from './wsClientManager';
import onConnectionCb from './onConnection';
import { User } from '../../models';

export default (server: http.Server): IWss => {
	var wss: IWss = <IWss>(new Server({ server }));

	addClientManager(wss);
	addWsMessageRouter(wss);
	// add all router with .onMessage function

	/* below lines will be removed */
	// wss.onMessage('bye',
	// 	async (req, data, next) => {
	// 		try {
	// 			const user = new User({ nickname: 'aaa' });
	// 			console.log('user create');
	// 			await user.save();
	// 			req.user = user;
	// 			next();
	// 			console.log('well done 1');
	// 		} catch (err) {
	// 			console.log('1 error');
	// 			next(err);
	// 		}
	// 	},
	// 	async (req, data, next) => {
	// 		try {
	// 			console.log('user update');
	// 			req.user.gender = 'male';
	// 			await req.user.save();
	// 			next();
	// 			console.log('well done 2');
	// 		} catch (err) {
	// 			console.log('2 error');
	// 			next(err);
	// 		}
	// 	},
	// 	async (req, data, next) => {
	// 		try {
	// 			console.log('user remove');
	// 			await req.user.remove();
	// 			next();
	// 		} catch (err) {
	// 			console.log('3 error');
	// 			next(err);
	// 		}
	// 	},
	// )
	wss.on('connection', onConnectionCb(wss));
	return wss;
}