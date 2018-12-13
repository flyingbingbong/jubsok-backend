import * as chai from 'chai';
import * as sinon from 'sinon';
import { SinonFakeTimers } from 'sinon';
import * as setupTest from '../../setupTest';
import { Friend, User, IFriendDocument, IUserDocument, activeUserSeconds } from '../';
import { IFriendOutput } from '../../types';

const expect = chai.expect;

describe('Friend model', () => {
	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
		} catch (err) {
			throw err;
		}
	});

	it('should not save if users more than 2', async () => {
		try {
			const friend = new Friend({
				users: [ (new User())._id, (new User())._id, (new User())._id ]
			});

			try {
				await friend.save();
				throw Error;
			} catch (err) {
				expect(err.name).to.equal('ValidationError');
			}
		} catch (err) {
			throw err;
		}
	});

	it('should not save if users less than 2', async () => {
		try {
			const friend = new Friend({
				users: [ (new User())._id ]
			});

			try {
				await friend.save();
				throw Error;
			} catch (err) {
				expect(err.name).to.equal('ValidationError');
			}
		} catch (err) {
			throw err;
		}
	});

	describe('fromUser', async () => {
		const pageSize: number = 5;
		var users: Array<IUserDocument>;
		var friends: Array<IFriendDocument>;
		var user: IUserDocument;
		var f: IUserDocument;

		beforeEach(async () => {
			try {
				var i: number = 0;

				user = new User({
					nickname: 'foo',
					gender: 'female'
				});
				await user.save();
				users = [];
				friends = [];
				while (i < pageSize * 2) {
					f = new User({
						nickname: Math.random().toString(36).substring(2),
						gender: 'female'
					});
					users.push(f);
					friends[i] = new Friend({ users: [user._id, f._id]});
					i++;
				}
				await User.insertMany(users);
				await Friend.insertMany(friends);
			} catch (err) {
				throw err;
			}
		});
	
		it('should return friends', async () => {
			try {
				const items: Array<IFriendOutput> = await Friend.fromUser(
					user, null, pageSize, {}
				);

				expect(items.length).to.equal(pageSize);
			} catch (err) {
				throw err;
			}
		});

		it('should be paginated', async () => {
			try {
				var page1: Array<IFriendOutput>;
				var page2: Array<IFriendOutput>;
				var expectedPage1: Array<IUserDocument>;
				var expectedPage2: Array<IUserDocument>;
				var i: number = 0;

				users.sort((a, b) => (a._id > b._id) ? -1 : 1);
				expectedPage1 = users.slice(0, pageSize);
				expectedPage2 = users.slice(pageSize, pageSize * 2);
				page1 = await Friend.fromUser(user, null, pageSize, {});
				page2 = await Friend.fromUser(
					user, page1[pageSize - 1]._id.toString(), pageSize, {}
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
		})

		it('should return empty list', async () => {
			try {
				await Friend.deleteMany({ users: user._id });
				expect(await Friend.fromUser(user, null, 30, {})).to.deep.equal([]);
			} catch (err) {
				throw err;
			}
		})
	});

	describe('activeSessions', () => {
		var users: Array<IUserDocument>;
		var friends: Array<IFriendDocument>;
		var user: IUserDocument;
		var f: IUserDocument;
		var clock: SinonFakeTimers;

		beforeEach(async () => {
			try {
				var i: number = 0;
				var now: Date = new Date();

				clock = sinon.useFakeTimers(now);
				user = new User({
					nickname: 'foo',
					gender: 'female'
				});
				await user.save();
				users = [];
				friends = [];
				while (i < 5) {
					f = new User({
						nickname: Math.random().toString(36).substring(2),
						gender: 'female',
						sessions: [
							{
								refreshToken: `token${i}0`, publicKey: `key${i}0`,
								lastSeen: new Date()
							},
							{
								refreshToken: `token${i}1`, publicKey: `key${i}1`,
								lastSeen: new Date()
							},
							{
								refreshToken: `token${i}2`, publicKey: `key${i}2`,
								lastSeen: (new Date()).setSeconds(
									now.getSeconds() - (activeUserSeconds + 2)
								)
							},
						]
					});
					users.push(f);
					friends[i] = new Friend({ users: [user._id, f._id]});
					i++;
				}
				await User.insertMany(users);
				await Friend.insertMany(friends);
			} catch (err) {
				throw err;
			}
		});

		it('should return 2/3 of friends sessions', async () => {
			try {
				var sessions: Array<string>;

				sessions = await Friend.activeSessions(user);
				expect(sessions.length).to.equal(friends.length * 2);
				expect(typeof sessions[0]).to.equal('string');
			} catch (err) {
				throw err;
			}
		})

		it('should return empty sessions', async () => {
			try {
				var sessions: Array<string>;

				clock.tick((activeUserSeconds + 1) * 1000);
				sessions = await Friend.activeSessions(user);
				expect(sessions.length).to.equal(0);
			} catch (err) {
				throw err;
			}
		})

		it('should return empty list', async () => {
			try {
				await Friend.deleteMany({ users: user._id });
				expect(await Friend.activeSessions(user,)).to.deep.equal([]);
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