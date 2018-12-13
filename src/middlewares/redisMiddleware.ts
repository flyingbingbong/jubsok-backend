import { Response, NextFunction } from 'express';
import { IRequest, IRedisClient } from '../types';

export const addRedisPerRequest = (redis: IRedisClient) =>
	(req: IRequest, res: Response, next: NextFunction) => {
		req.redis = redis;
		next();
	}