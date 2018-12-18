import * as chai from 'chai';
import * as sinon from 'sinon';
import { SinonFakeTimers } from 'sinon';
import { User, IUserDocument, Message, messageTypes, Friend, IWordDocument, Word } from '../';
import * as setupTest from '../../setupTest';
import { IFavorite, IUser, ISearchedUser } from '../../types';

const expect = chai.expect;

describe('User model', () => {
	var user: IUserDocument;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			user = new User({
				nickname: 'foo',
				facebookProvider : { id: 'abcd@gmail.com', token: 'token1' },
				gender: 'male',
				weeklyTastes: [ -1, -1, -1 ],
				sessions: [
					{ refreshToken: 'rtoken1', publicKey: 'pkey1' },
					{ refreshToken: 'rtoken2', publicKey: 'pkey2' },
				]
			});
			await user.save();
		} catch (err) {
			throw err;
		}
	});

	it('should save validate favorites ', async () => {
		try {
			var goodFavorites: Array<IFavorite>;

			goodFavorites = [
				{ content: 'b', point: 5 },
				{ content: 'a', point: 4 },
				{ content: 'd', point: 4 },
				{ content: 'c', point: 2 },
			];
			user.favorites = goodFavorites;
			await user.save();
			expect(user.toJSON().favorites).to.deep.equal(goodFavorites);
		} catch (err) {
			throw err;
		}
	});

	it('should not save favorites more than max length', async () => {
		try {
			var badFavorites: Array<IFavorite>;

			badFavorites = [
				{ content: 'a', point: 1 },
				{ content: 'b', point: 1 },
				{ content: 'c', point: 1 },
				{ content: 'd', point: 1 },
				{ content: 'e', point: 1 },
				{ content: 'f', point: 1 }
			];
			user.favorites = badFavorites;
			try {
				await user.save();
				throw Error;
			} catch (err) {
				expect(err.name).to.equal('ValidationError');
			}
		} catch (err) {
			throw err;
		}
	});

	it('should not save favorites more than max point', async () => {
		try {
			var badFavorites: Array<IFavorite>

			badFavorites = [
				{ content: 'a', point: 5 },
				{ content: 'b', point: 5 },
				{ content: 'c', point: 5 },
				{ content: 'd', point: 5 },
			];
			user.favorites = badFavorites;
			try {
				await user.save();
				throw Error;
			} catch (err) {
				expect(err.name).to.equal('ValidationError');
			}
		} catch (err) {
			throw err;
		}
	});

	it('should not save favorites less than min point', async () => {
		try {
			var badFavorites: Array<IFavorite>

			badFavorites = [
				{ content: 'a', point: 1 },
				{ content: 'b', point: 0 },
				{ content: 'c', point: 2 },
				{ content: 'd', point: 5 },
			];
			user.favorites = badFavorites;
			try {
				await user.save();
				throw Error;
			} catch (err) {
				expect(err.name).to.equal('ValidationError');
				
			}
		} catch (err) {
			throw err;
		}
	});

	it('should sustain unique on facebookProvider.id', async () => {
		try {
			const newUser: IUserDocument = new User({
				facebookProvider: { id: user.facebookProvider.id, token: 'token' },
				gender: 'female',
			});

			try {
				await newUser.save();
			} catch (err) {
				expect(err.message.indexOf('duplicate key')).not.equal(-1);
			}
		} catch (err) {
			throw err;
		}
	});

	it('should create new user', async () => {
		try {
			const accessToken: string = 'accessToken';
			const refreshToken: string = 'refreshToken';
			const profile: any = { id: 'jubsok@gmail.com', gender: 'female' };
			var newUser: IUserDocument;

			await User.facebookLogin(accessToken, refreshToken, profile);
			newUser = await User.findOne({ 'facebookProvider.id': profile.id }).lean();
			expect(newUser.facebookProvider.id).to.equal(profile.id);
			expect(newUser.gender).to.equal('female');
		} catch (err) {
			throw err;
		}
	});

	it('should not create user when same facebookProvider.id is given', async () => {
		try {
			const accessToken: string = 'accessToken';
			const refreshToken: string = 'refreshToken';
			const profile: any = { id: user.facebookProvider.id, gender: 'female' };

			sinon.spy(sinon.stub(User.prototype, 'save'));
			await User.facebookLogin(accessToken, refreshToken, profile);
			sinon.assert.notCalled(User.prototype.save);
		} catch (err) {
			throw err;
		}
	});

	describe('remove', () => {
		beforeEach(async () => {
			try {
				await Message.create({
					from: user._id,
					to: (new User())._id,
					content: 'hi',
					type: messageTypes.message
				});
				await Message.create({
					to: user._id,
					from: (new User())._id,
					content: 'hi',
					type: messageTypes.message
				});
				await Friend.create({
					users: [ user._id, (new User())._id ]
				});
			} catch (err) {
				throw err;
			}
		})

		it('should remove all friends and message before remove', async () => {
			try {
				await user.remove();
				expect(await Message.findOne()).to.equal(null);
				expect(await Friend.findOne()).to.equal(null);
			} catch (err) {
				throw err;
			}
		})
	})

	describe('getProfile', () => {
		it('should get profile', async () => {
			try {
				const profile: IUserDocument = user.getProfile();
	
				expect(profile).to.not.be.null;
				expect(profile.__v).to.be.undefined;
				expect(profile.updatedAt).to.be.undefined;
				expect(profile._id).to.be.undefined;
			} catch (err) {
				throw err;
			}
		});
	})

	describe('updateProfile', () => {
		it('should edit profile', async () => {
			try {
				var updatedUser: IUserDocument;
				var currentFavorite: IFavorite;
				const input = {
					comment: 'bar',
					favorites: [
						{ content: 'dog', point: 4 },
						{ content: 'cat', point: 2 },
						{ content: 'bird', point: 5 },
					],
					interests: [
						'blockchain',
						'baseball',
						'milk'
					],
					weeklyTastes: [0, -1, 0]
				};
	
				updatedUser = (await user.updateProfile(input)).toObject();
				expect(updatedUser).deep.include(input);
				currentFavorite = updatedUser.favorites[0];
				for (let i=1; i < updatedUser.favorites.length; i++) {
					expect(currentFavorite.point).to.gt(updatedUser.favorites[i].point);
					currentFavorite = updatedUser.favorites[i];
				}
			} catch (err) {
				throw err;
			}
		})

		it('should not edit profile', async () => {
			try {
				const input = {
					nickname: 'foo!',
					comment: 'bar'
				};
				try {
					await user.updateProfile(input);
					throw Error;
				} catch (err) {
					expect(err.name).to.equal('ValidationError');
				}
			} catch (err) {
				throw err;
			}
		});
	})
	
	describe('search', async () => {
		const pageSize: number = 5;
		var users: Array<IUserDocument>

		describe('filter', () => {
			beforeEach(async () => {
				try {
					users = [
						new User({
							nickname: '이상해씨',
							gender: 'male',
							weeklyTastes: [ 0, 0, 1 ],
							favorites: [
								{ content: '블록체인', point: 5 },
								{ content: '강아지', point: 4 },
							],
							interests: [ '포켓볼', '솔라빔', '몸통박치기' ],
						}),
						new User({
							nickname: '파이리',
							gender: 'female',
							weeklyTastes: [ 1, 0, 1 ],
							favorites: [
								{ content: '나옹', point: 4 },
								{ content: '강아지', point: 3 },
							],
							interests: [ '진화', '포켓볼', '꼬리' ],
						}),
						new User({
							nickname: '꼬부기',
							gender: 'male',
							weeklyTastes: [ 0, 1, 1 ],
							favorites: [
								{ content: '뻥튀기', point: 3 },
								{ content: '등껍질', point: 1 },
							],
							interests: [ '부하', '진화', '나옹' ],
						})
					];
					await User.insertMany(users);
				} catch (err) {
					throw err;
				}
			});
	
			it('should be filtered by weeklyTastes', async () => {
				try {
					const weeklyTastesFilter: Array<number> = [ -1, 0, -1 ];
					const items: Array<ISearchedUser> = await User.search(
						null, weeklyTastesFilter, null, null, pageSize, {}
					);
					const expectedUsers: Array<IUserDocument> = users
						.filter((v) => (v.weeklyTastes[1] == weeklyTastesFilter[1]))
						.sort((a, b) => (a._id > b._id) ? -1 : 1); // DESC
	
					expect(items.length).to.equal(expectedUsers.length);
					expectedUsers.forEach((v, i) => {
						expect(v.nickname).to.equal(items[i].nickname)
					});
				} catch (err) {
					throw err;
				}
			});
	
			it('should be filtered by text', async () => {
				try {
					const text: string = '나옹';
					const items = await User.search(
						null, null, text, null, pageSize, {}
					);
					const expectedUsers: Array<IUserDocument> = users
						.filter((v) => (
							v.favorites.map(f => f.content).indexOf(text) !== -1 ||
							v.interests.indexOf(text) !== -1
						))
						.sort((a, b) => (a._id > b._id) ? -1 : 1); // DESC
	
					expect(items.length).to.equal(expectedUsers.length);
					expectedUsers.forEach((v, i) => {
						expect(v.nickname).to.equal(items[i].nickname)
					});
				} catch (err) {
					throw err;
				}
			});
		})

		describe('pagination', () => {
			beforeEach(async () => {
				try {
					var i: number = 0;

					users = [];
					while (i < pageSize * 2) {
						users.push(new User({
							gender: 'female',
							weeklyTastes: [0, 0, 1]
						}));
						i++;
					}
					await User.insertMany(users);
				} catch (err) {
					throw err;
				}
			})

			it('should paginated', async () => {
				try {
					var page1: Array<ISearchedUser>;
					var page2: Array<ISearchedUser>;
					var expectedPage1: Array<IUserDocument>;
					var expectedPage2: Array<IUserDocument>;
					var i: number = 0;

					users.sort((a, b) => (a._id > b._id) ? -1 : 1);
					expectedPage1 = users.slice(0, pageSize);
					expectedPage2 = users.slice(pageSize, pageSize * 2);
					page1 = await User.search('female', null, null, null, pageSize, {});
					page2 = await User.search(
						'female', null, null,
						page1[pageSize - 1]._id.toString(), pageSize, {}
					);
					expect(page1.length).to.not.equal(0);
					while (i < pageSize) {
						expect(page1[i]._id.toString())
							.to.equal(expectedPage1[i]._id.toString());
						i++;
					}
					i = 0;
					expect(page2.length).to.not.equal(0);
					while (i < pageSize) {
						expect(page2[i]._id.toString())
							.to.equal(expectedPage2[i]._id.toString());
						i++;
					}
				} catch (err) {
					throw err;
				}
			});
		})
	})

	describe('wsSend', async () => {
		it('should send per session', () => {
			var wsClients: any = {};
			var flag: boolean = false;

			for (let s of user.sessions) {
				wsClients[s._id.toString()] = setupTest.mockWsClient();;
			}
			user.wsSend(wsClients, { type: 'foo', message: 'bar' });
			for (let s of user.sessions) {
				sinon.assert.calledOnce(wsClients[s._id.toString()].send);
				flag = true;
			}
			expect(flag).to.equal(true);
		})
	})

	describe('hasOtherActiveSession', async () => {
		it('should return true', () => {
			const currentSession: string = user.sessions[0]._id.toString();
			const otherSession: string = user.sessions[1]._id.toString();
			var clients: any = { [otherSession]: 'foo', [currentSession]: 'bar' };

			expect(user.hasOtherActiveSession(currentSession, clients)).to.equal(true);
		})

		it('should return false', () => {
			const currentSession: string = user.sessions[0]._id.toString();
			const otherSession: string = user.sessions[1]._id.toString();
			var clients: any = { [currentSession]: 'foo' };

			expect(user.hasOtherActiveSession(currentSession, clients)).to.equal(false);
		})
	});

	describe('searchRandom', () => {
		var users: Array<IUserDocument>;
		const pageSize: number = 30;

		describe('filter', () => {
			beforeEach(async () => {
				try {
					users = [
						new User({
							nickname: '이상해씨',
							gender: 'male',
							weeklyTastes: [ 0, 0, 1 ],
							favorites: [
								{ content: '블록체인', point: 5 },
								{ content: '강아지', point: 4 },
							],
							interests: [ '포켓볼', '솔라빔', '몸통박치기' ],
						}),
						new User({
							nickname: '파이리',
							gender: 'female',
							weeklyTastes: [ 1, 0, 1 ],
							favorites: [
								{ content: '나옹', point: 4 },
								{ content: '강아지', point: 3 },
							],
							interests: [ '진화', '포켓볼', '꼬리' ],
						}),
						new User({
							nickname: '꼬부기',
							gender: 'male',
							weeklyTastes: [ 0, 1, 1 ],
							favorites: [
								{ content: '뻥튀기', point: 3 },
								{ content: '등껍질', point: 1 },
							],
							interests: [ '부하', '진화', '나옹' ],
						})
					];
					await User.insertMany(users);
				} catch (err) {
					throw err;
				}
			});
	
			it('should be filtered by weeklyTastes', async () => {
				try {
					const weeklyTastesFilter: Array<number> = [ -1, 0, -1 ];
					const items: Array<ISearchedUser> = await User.randomSearch(
						null, weeklyTastesFilter, null, pageSize, {}
					);
					const expectedUsers: Array<IUserDocument> = users
						.filter((v) => (v.weeklyTastes[1] == weeklyTastesFilter[1]));
	
					expect(items.length).to.equal(expectedUsers.length);
					expectedUsers.forEach(v => {
						expect(items.find(item => item._id.toString() === v._id.toString()))
							.to.not.equal(undefined);
					});
				} catch (err) {
					throw err;
				}
			});
	
			it('should be filtered by text', async () => {
				try {
					const text: string = '나옹';
					const items = await User.randomSearch(
						null, null, text, pageSize, {}
					);
					const expectedUsers: Array<IUserDocument> = users
						.filter((v) => (
							v.favorites.map(f => f.content).indexOf(text) !== -1 ||
							v.interests.indexOf(text) !== -1
						))
	
					expect(items.length).to.equal(expectedUsers.length);
					expectedUsers.forEach(v => {
						expect(items.find(item => item._id.toString() === v._id.toString()))
							.to.not.equal(undefined);
					});
				} catch (err) {
					throw err;
				}
			});
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