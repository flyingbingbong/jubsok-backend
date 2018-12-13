import * as chai from 'chai';
import { response } from 'supertest';
import * as request from 'supertest';
import * as jwt from 'jsonwebtoken';

const expect = chai.expect;
const JWT_SECRET: string = <string>process.env.JWT_SECRET;

export const testAuth = function(method: string) {
	describe('authenticate', () => {
		var req;
		var res: response;
		var accessToken: string;
		
		beforeEach(async () => {
			try {
				switch (method) {
					case 'GET':
						req = request(this.app).get(this.url);
						break;
					case 'POST':
						req = request(this.app).post(this.url);
						break;
					case 'PUT':
						req = request(this.app).put(this.url);
						break;
					case 'DELETE':
						req = request(this.app).delete(this.url);
						break;
				}		
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when access token not exist', async () => {
			try {
				res = await req
					.expect(400);
				expect(res.body.message).to.match(/.*ACCESS_TOKEN_NOT_EXIST$/);
			} catch (err) {
				throw err;
			}
		});
	
		it('should return 401 when token expired', async () => {
			try {
				accessToken = await jwt.sign(
					{ id: this.user.facebookProvider.id },
					JWT_SECRET,
					{ expiresIn: 0 }
				);
				res = await req
					.set({ 'x-auth-token': accessToken })
					.expect(401);
				expect(res.body.message).to.match(/.*ACCESS_TOKEN_EXPIRED/);
			} catch (err) {
				throw err;
			}
		});
	
		it('should return 401 when invalid token', async () => {
			try {
				res = await req
					.set({ 'x-auth-token': 'invalidToken' })
					.expect(401);
				expect(res.body.message).to.match(/.*INVALID_TOKEN/);
			} catch (err) {
				throw err;
			}
		});
	
		it('should return 401 when this.user not found', async () => {
			try {
				accessToken = await jwt.sign(
					{ id: 'notExistId' },
					JWT_SECRET,
					{ expiresIn: 60 * 5 }
				);
				res = await req
					.set({ 'x-auth-token': accessToken })
					.expect(401);
				expect(res.body.message).to.match(/.*USER_NOT_FOUND/);
			} catch (err) {
				throw err;
			}
		});
	})
}