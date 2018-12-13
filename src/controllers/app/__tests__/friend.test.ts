import * as chai from 'chai';
import * as sinon from 'sinon';
import { SinonSpy, SinonFakeTimers } from 'sinon';
import {
	Friend, User, Message, IUserDocument, IFriendDocument, IMessageDocument, messageTypes
} from '../../../models';
import * as setupTest from '../../../setupTest';
import { FriendController } from '../';
import { AES } from '../../../utils';

const expect = chai.expect;

describe('Friend controller', () => {
	var res: any;
	var req: any;
	var next: SinonSpy;
	var users: Array<IUserDocument>;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			res = setupTest.mockRes();
			req = setupTest.mockReq();
			next = sinon.spy(setupTest.mockNext());
			users = [
				new User({
					nickname: 'foo',
					gender: 'male'
				}),
				new User({
					nickname: 'bar',
					gender: 'female'
				}),
			];
			await User.insertMany(users);
			req.auth = {
				user: users[0]
			};
		} catch (err) {
			throw err;
		}
	})

	describe('_get_', () => {
		enum _get_ {
			decryptCursor=0,
			checkCursor,
			_get_,
			encryptNextCursor,
			modifyField,
		}

		describe('_get_', () => {
			const getFunc: Function = FriendController._get_[
				_get_._get_
			];
			var users: Array<IUserDocument>;
			var friends: Array<IFriendDocument>;
			var now: Date;
			var activeTime: Date;
			var clock: SinonFakeTimers;

			beforeEach(async () => {
				try {
					var i: number = 0;
					var user: IUserDocument;
				
					now = new Date();
					activeTime = new Date();
					clock = sinon.useFakeTimers(now);
					activeTime.setSeconds(now.getSeconds() - 5);
					users = [];
					friends = [];
					while (i < 10) {
						user = new User({
							lastSeen: (new Date()).setSeconds(now.getSeconds() - i),
						});
						users.push(user);
						friends.push(new Friend({
							users: [ req.auth.user._id, user._id ]
						}))
						i++;
					}
					await User.insertMany(users);
					await Friend.insertMany(friends);
				} catch (err) {
					throw err;
				}
			})

			it('should get active friends', async () => {
				try {
					const expectedUsers: Array<IUserDocument> = users
						.filter(v => v.lastSeen > activeTime)
						.sort((a, b) => (a._id > b._id) ? -1 : 1);
					var i: number = 0;

					req.query.active = true;
					await getFunc(req, res, next);
					expect(req.items.length).to.equal(expectedUsers.length);
					while (i < expectedUsers.length) {
						expect(req.items[i]._id.toString())
							.to.equal(expectedUsers[i]._id.toString());
						i++;
					}
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should get all friends', async () => {
				try {
					const expectedUsers: Array<IUserDocument> = users
						.sort((a, b) => (a._id > b._id) ? -1 : 1);
					var i: number = 0;

					await getFunc(req, res, next);
					expect(req.items.length).to.equal(expectedUsers.length);
					while (i < expectedUsers.length) {
						expect(req.items[i]._id.toString())
							.to.equal(expectedUsers[i]._id.toString());
						i++;
					}
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})
		})

		describe('modifyField', () => {
			const modifyField: Function = FriendController._get_[
				_get_.modifyField
			];

			it('should success', async () => {
				try {
					req.items = [ (new User()).toJSON(), (new User()).toJSON() ];
					await modifyField(req, res, next);
					expect(req.items.length).to.not.equal(0);
					for (let c of req.items) {
						expect(c._id).to.equal(undefined);
					}
					sinon.assert.calledWith(res.status, 200);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});
		});
	});

	describe('create', async () => {
		enum create {
			checkInput=0,
			decryptMessageId,
			checkMessageId,
			checkMessageExist,
			checkFriendExist,
			checkAlreadyFriend,
			create,
			createReplyMessage,
			sendReplyMessage,
		}
		var message: IMessageDocument;

		beforeEach(async () => {
			try {
				message = new Message({
					from: users[1]._id,
					to: req.auth.user._id,
					type: messageTypes.friendRequest,
					content: 'foo'
				});
				await message.save();
			} catch (err) {
				throw err;
			}
		})

		describe('checkInput', () => {
			const checkInput: Function = FriendController.create[
				create.checkInput
			];

			it('should success', async () => {
				try {
					req.body.messageId = message._id.toString();
					await checkInput(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})

			it('should return 400', async () => {
				try {
					await checkInput(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			})
		})

		describe('decryptMessageId', () => {
			const decryptMessageId: Function = FriendController.create[
				create.decryptMessageId
			];

			it('should success', async () => {
				try {
					req.body.messageId = AES.encrypt(message._id.toString());
					await decryptMessageId(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})

			it('should return 400', async () => {
				try {
					req.body.messageId = 'invalidId';
					await decryptMessageId(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			})
		})

		describe('checkMessageExist', () => {
			const checkMessageExist: Function = FriendController.create[
				create.checkMessageExist
			];

			it('should success', async () => {
				try {
					req.messageId = message._id.toString();
					await checkMessageExist(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})

			it('should return 400', async () => {
				try {
					req.messageId = (new Message())._id.toString();
					await checkMessageExist(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			})
		})

		describe('checkFriendExist', () => {
			const checkFriendExist: Function = FriendController.create[
				create.checkFriendExist
			];

			it('should success', async () => {
				try {
					req.message = message;
					await checkFriendExist(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})

			it('should return 400', async () => {
				try {
					req.message = new Message();
					await checkFriendExist(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('checkAlreadyFriend', () => {
			const checkAlreadyFriend: Function = FriendController.create[
				create.checkAlreadyFriend
			];

			it('should success', async () => {
				try {
					req.friend = users[1];
					await checkAlreadyFriend(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})

			it('should return 400', async () => {
				try {
					await Friend.create({ users: [ req.auth.user._id, users[1]._id ] });
					req.friend = users[1];
					await checkAlreadyFriend(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('create', () => {
			const createFunc: Function = FriendController.create[
				create.create
			];

			it('should success', async () => {
				try {
					req.friend = users[1];
					await createFunc(req, res, next);
					sinon.assert.calledWith(res.status, 200);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})

			it('should return 400', async () => {
				try {
					req.friend = req.auth.user;
					await createFunc(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('createReplyMessage', () => {
			const createReplyMessage: Function = FriendController.create[
				create.createReplyMessage
			];

			it('should success', async () => {
				try {
					req.friend = users[1];
					await createReplyMessage(req, res, next);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})
		})

		describe('sendReplyMessage', () => {
			const sendReplyMessage: Function = FriendController.create[
				create.sendReplyMessage
			];

			it('should success', async () => {
				try {
					req.friend = users[1];
					req.friend.wsSend = sinon.spy();
					await sendReplyMessage(req, res, next);
					sinon.assert.calledOnce(req.friend.wsSend);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})
		})
	});

	describe('_delete_', async () => {
		enum _delete_ {
			checkInput=0,
			_delete_
		}

		describe('checkInput', () => {
			const checkInput: Function = FriendController._delete_[
				_delete_.checkInput
			];

			it('should success', async () => {
				try {
					req.body.nickname = users[1].nickname;
					await checkInput(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400', async () => {
				try {
					await checkInput(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('_delete_', () => {
			const deleteFunc: Function = FriendController._delete_[
				_delete_._delete_
			];

			it('should success', async () => {
				try {
					var f: IFriendDocument;

					await Friend.create({ users: [ users[0]._id, users[1]._id ] });
					req.body.nickname = users[1].nickname;
					await deleteFunc(req, res, next);
					f = await Friend.findOne({ users: users[0]._id });
					expect(f).to.equal(null);
					sinon.assert.calledWith(res.status, 200);
					sinon.assert.calledOnce(next);
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
	})
});
