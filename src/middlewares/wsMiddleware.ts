import { Response, NextFunction } from 'express';
import { IRequest, IWss } from '../types';

export const addWsPerRequest = (wss: IWss) =>
	(req: IRequest, res: Response, next: NextFunction) => {
		req.wsClients = wss.clientManager.clients;
		next();
	}