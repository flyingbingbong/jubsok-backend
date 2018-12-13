import * as chai from 'chai';
import * as sinon from 'sinon';
import { SinonFakeTimers } from 'sinon';
import * as request from 'supertest';
import { response } from 'supertest';
import * as setupTest from '../../../setupTest';
import { UserRouter } from '../';
import * as jwt from 'jsonwebtoken';
import { testHelper } from '../helpers';
import {
	User, IUserDocument, activeUserSeconds, IChatRoomDocument, ChatRoom
} from '../../../models';

const expect = chai.expect;
const JWT_SECRET: string = <string>process.env.JWT_SECRET;

describe('user router', () => {
	var res: response;
	var accessToken: string;
	this.testAuth = testHelper.testAuth;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			this.user = new User({
				nickname: 'bar',
				gender: 'male',
				facebookProvider: { id: 'foo@bar.com' },
				interests: [ '피카츄', '파이리', '이상해씨' ],
				favorites: [
					{ content: '라이츄', point: 5 },
					{ content: 'C', point: 3 },
					{ content: 'C++', point: 1 },
				],
			});
			await this.user.save();
			accessToken = await jwt.sign(
				{ id: this.user.facebookProvider.id },
				JWT_SECRET,
				{ expiresIn: 60 * 5 }
			);
		} catch (err) {
			throw err;
		}
	})

	describe('/user/profile (GET)', () => {
		beforeEach(async () => {
			try {
				this.url = '/user/profile';
				this.app = setupTest.mockApp();
				this.app.use('/user', UserRouter);
			} catch (err) {
				throw err;
			}
		})

		this.testAuth('GET');

		it('should return 200 with profile', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.expect(200);
			} catch (err) {
				throw err;
			}
		})
	})

	describe('/user/search', () => {
		var users: Array<IUserDocument>;
		var now: Date;
		var activeTime: Date;
		var clock: SinonFakeTimers;

		beforeEach(async () => {
			try {
				var i: number = 0;

				this.url = '/user/search';
				this.app = setupTest.mockApp();
				this.app.use('/user', UserRouter);
				now = new Date();
				activeTime = new Date();
				clock = sinon.useFakeTimers(now);
				activeTime.setSeconds(now.getSeconds() - activeUserSeconds);
				users = [];
				while (i < 50) {
					users.push(new User({
						nickname: `nick${i}`,
						gender: 'male',
						lastSeen: (new Date()).setSeconds(now.getSeconds() - i),
						weeklyTastes: [0, 1, 1]
					}));
					i++;
				}
				await User.insertMany(users);
			} catch (err) {
				throw err;
			}
		})

		it('should return 200 with searched user', async () => {
			try {
				const activeUsers: Array<IUserDocument> = users
						.filter(v => v.lastSeen > activeTime);

				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ gender: 'male', weeklyTastes: [ -1, -1, 1 ] })
					.expect(200);
				expect(res.body.items.length).to.equal(30);
				activeUsers.forEach(v => {
					expect(res.body.items.find(item => item.nickname === v.nickname))
						.to.not.equal(undefined);
				});
			} catch (err) {
				throw err;
			}
		})

		it('should return 200 with empty users (gender query)', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ gender: 'female', weeklyTastes: [ -1, -1, 1 ] })
					.expect(200);
				expect(res.body.items.length).to.equal(0);
			} catch (err) {
				throw err;
			}
		})

		it('should return 200 with empty users (weeklyTastes query)', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ gender: 'male', weeklyTastes: [ 1,0, 0 ] })
					.expect(200);
				expect(res.body.items.length).to.equal(0);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when empty query', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.expect(400);
				expect(res.body.message).to.match(/.*INSUFFICIENT_QUERY/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when invalid query (gender)', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ gender: 'notExistGender' })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_GENDER/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when invalid query (weeklyTastes value)', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ weeklyTastes: [ 2, 0, 1 ] })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_WEEKLY_TASTES_VAL/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when invalid query (weeklyTastes length)', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ weeklyTastes: [ 1, 1 ] })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_WEEKLY_TASTES_LEN/);
			} catch (err) {
				throw err;
			}
		})
	})

	describe('/user (DELETE)', () => {
		beforeEach(async () => {
			try {
				this.url = '/user';
				this.app = setupTest.mockApp();
				this.app.use('/user', UserRouter);
			} catch (err) {
				throw err;
			}
		})

		this.testAuth('DELETE');

		it('should return 200', async () => {
			try {
				var user: IUserDocument;

				res = await request(this.app)
					.delete(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ confirm: 'DELETE' })
					.expect(200);
				user = await User.findOne({ _id: this.user._id });
				expect(user).to.equal(null);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when invalid confirm', async () => {
			try {
				res = await request(this.app)
					.delete(this.url)
					.set({ 'x-auth-token': accessToken })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_CONFIRM/);
			} catch (err) {
				throw err;
			}
		})
	})

	describe('/user/profile (PUT)', () => {
		beforeEach(async () => {
			try {
				this.url = '/user/profile';
				this.app = setupTest.mockApp();
				this.app.use('/user', UserRouter);
			} catch (err) {
				throw err;
			}
		})

		this.testAuth('PUT');

		it('should return 200 with update profile', async () => {
			try {
				const input: any = {
					interests: [ '스폰지밥', '징징이', '뚱이' ],
					favorites: [
						{ content: 'TypeScript', point: 4 },
						{ content: 'Python', point: 3 },
						{ content: 'Ruby', point: 2 },
					],
					weeklyTastes: [ 0, 1, 1 ]
				}
				var user: IUserDocument;

				res = await request(this.app)
					.put(this.url)
					.set({ 'x-auth-token': accessToken })
					.send(input)
					.expect(200);
				user = await User.findOne({ _id: this.user._id });
				expect(user.interests).to.deep.equal(input.interests);
				expect(user.weeklyTastes).to.deep.equal(input.weeklyTastes);
				expect(user.favorites.every((v, i) => (
					v.content === input.favorites[i].content
				))).to.equal(true);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when nickname already fixed', async () => {
			try {
				res = await request(this.app)
					.put(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ nickname: 'bar' })
					.expect(400);
				expect(res.body.message).to.match(/.*NICKNAME_ALREADY_FIXED/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when nickname already exist', async () => {
			try {
				const alreadyExistNickname: string = 'nick';

				this.user.nickname = undefined;
				await this.user.save();
				await User.create({ nickname: alreadyExistNickname });
				res = await request(this.app)
					.put(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ nickname: alreadyExistNickname })
					.expect(400);
				expect(res.body.message).to.match(/.*NICKNAME_ALREADY_EXIST/);
			} catch (err) {
				throw err;
			}
		})
		
		it('should return 400 when gender already fixed', async () => {
			try {
				res = await request(this.app)
					.put(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ gender: 'male' })
					.expect(400);
				expect(res.body.message).to.match(/.*GENDER_ALREADY_FIXED/);
			} catch (err) {
				throw err;
			}
		})
		
		it('should return 400 when duplicated interests', async () => {
			try {
				res = await request(this.app)
					.put(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ interests: [ '회덮밥', '회덮밥' ] })
					.expect(400);
				expect(res.body.message).to.match(/.*INTERESTS_DUPLICATE/);
			} catch (err) {
				throw err;
			}
		})
		
		it('should return 400 when invalid weeklyTastes', async () => {
			try {
				res = await request(this.app)
					.put(this.url)
					.set({ 'x-auth-token': accessToken })
					.send({ weeklyTastes: [-1, 0, 2] })
					.expect(400);
				expect(res.body.message).to.match(/.*INVALID_WEEKLY_TASTES_VAL/);
			} catch (err) {
				throw err;
			}
		})
	})

	describe('/user/publickeys', () => {
		var userToChat: IUserDocument;

		beforeEach(async () => {
			try {
				this.url = '/user/publickeys';
				this.app = setupTest.mockApp();
				this.app.use('/user', UserRouter);
				await ChatRoom.insertMany([
					{
						users: [ this.user._id, (new User())._id ],
						keys: [ 'key1', 'key2' ]
					},
					{
						users: [ this.user._id, (new User())._id ],
						keys: [ 'key1', 'key2' ]
					},
					{
						users: [ this.user._id, (new User())._id ],
						keys: [ 'key1', 'key2' ]
					}
				]);
				userToChat = new User({
					nickname: 'userToChat',
					sessions: [
						{ refreshToken: 'token1', publicKey: 'key1' },
						{ refreshToken: 'token2', publicKey: 'key2' },
					]
				});
				await userToChat.save();
			} catch (err) {
				throw err;
			}
		})

		this.testAuth('GET');

		it('should return 200 with public keys', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ nickname: userToChat.nickname })
					.expect(200);
				expect(res.body.keys)
					.to.deep.equal(userToChat.sessions.map(s => s.publicKey));
				expect(await ChatRoom.find({ users: this.user._id })).to.deep.equal([]);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when nickname not exist', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.expect(400);
				expect(res.body.message).to.match(/.*NICKNAME_REQUIRED/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when user not exist', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ nickname: 'notExistNickname' })
					.expect(400);
				expect(res.body.message).to.match(/.*USER_NOT_EXIST/);
			} catch (err) {
				throw err;
			}
		})
	})

	describe('/user/info', () => {
		var user;

		beforeEach(async () => {
			try {
				this.url = '/user/info';
				this.app = setupTest.mockApp();
				this.app.use('/user', UserRouter);
				user = new User({
					nickname: 'userToChat',
					comment: 'hi',
					gender: 'female',
					weeklyTastes: [ 1, 0, 1 ],
					interests: [ '피카츄', '파이리', '이상해씨' ],
					favorites: [
						{ content: '라이츄', point: 5 },
						{ content: 'C', point: 3 },
						{ content: 'C++', point: 1 },
					],				
				});
				await user.save();
			} catch (err) {
				throw err;
			}
		})

		this.testAuth('GET');

		it('should return 200 with userinfo', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ nickname: user.nickname })
					.expect(200);
				expect(res.body._id).to.equal(undefined);
				expect(res.body.nickname).to.equal(user.nickname);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when nickname not exist', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.expect(400);
				expect(res.body.message).to.match(/.*USER_NICKNAME_NOT_EXIST/);
			} catch (err) {
				throw err;
			}
		})

		it('should return 400 when nickname not exist', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ nickname: 'notExistNickname' })
					.expect(400);
				expect(res.body.message).to.match(/.*USER_NOT_FOUND/);
			} catch (err) {
				throw err;
			}
		})
	})

	afterEach(async () => {
		try {
			sinon.restore();
			await setupTest.resetTestDB();
		} catch (err) {
			throw err;
		}
	});
});