import * as jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { IAuthRequest } from '../../../types';
import { RedisHashKey } from '../../../utils';
import { randomBytes } from 'crypto';

interface ITokenRequest extends IAuthRequest {
	accessToken: string,
	refreshToken: string
}

interface ITokens {
	accessToken: string,
	refreshToken?: string
}

const JWT_SECRET: string = <string>process.env.JWT_SECRET;

export const generateAccessToken = async (
	req: ITokenRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		req.accessToken = await jwt.sign(
			{ id: req.auth.id },
			JWT_SECRET,
			{ expiresIn: 60 * 5 }
		);
		next();
	} catch (err) {
		next(err);
	}
}

export const generateRefreshToken = async (
	req: ITokenRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		
		do {
			req.refreshToken = <string>randomBytes(256).toString('hex');
		} while (await req.redis.hget(RedisHashKey.refreshTokens, req.refreshToken));
		await req.redis.hset(RedisHashKey.refreshTokens, req.refreshToken, req.auth.id);
		next();
	} catch (err) {
		next(err);
	}
}

export const sendToken = async (
	req: ITokenRequest, res: Response, next: NextFunction
): Promise<void> => {
	try {
		var tokens: ITokens = {
			accessToken: req.accessToken
		};

		if (req.refreshToken) {
			tokens.refreshToken = req.refreshToken;
		}
		res.status(200).json({ 
			...tokens
		});
		next();
	} catch (err) {
		next(err);
	}
}