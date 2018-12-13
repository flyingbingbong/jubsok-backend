import * as chai from 'chai';
import { SinonSpy } from 'sinon';
import {
	Message, User, IMessageDocument, IUserDocument, messageTypes, ChatRoom
} from '../../../models';
import * as sinon from 'sinon';
import { MessageController } from '../';
import * as setupTest from '../../../setupTest';

const expect = chai.expect;

describe('Message Controller', () => {
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
				new User({ nickname: 'foo' }),
				new User({ nickname: 'bar' }),
			]
			await User.insertMany(users);
			req.auth = {
				user: users[0]
			};
		} catch (err) {
			throw err;
		}
	});

	describe('getReceived', async () => {
		enum getReceived {
			decryptCursor=0,
			checkCursor,
			_get_,
			encryptNextCursor,
			modifyField
		}
		var messages: Array<IMessageDocument>;

		beforeEach(async () => {
			try {
				messages = [
					new Message({
						to: req.auth.user._id, from: users[1]._id,
						content: 'hi', type: messageTypes.message,
						chatRoomId: (new ChatRoom())._id
					}),
					new Message({
						to: req.auth.user._id, from: users[1]._id,
						content: '안녕', type: messageTypes.message
					}),
					new Message({
						to: req.auth.user._id, from: users[1]._id,
						content: 'bonjour', type: messageTypes.message
					}),
				];
				await Message.insertMany(messages);
			} catch (err) {
				throw err;
			}
		})

		describe('_get_', () => {
			const _get_: Function = MessageController.getReceived[
				getReceived._get_
			];

			it('should get all received messages', async () => {
				try {
					await _get_(req, res, next);
					expect(req.items.length).to.equal(messages.length);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should get unread received messages', async () => {
				try {
					await Message.updateOne(
						{_id: messages[0]._id },
						{ $set: { read: true }}
					);
					req.query.unread = true;
					await _get_(req, res, next);
					expect(req.items.length).to.equal(messages.length - 1);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('modifyField', () => {
			const modifyField: Function = MessageController.getReceived[
				getReceived.modifyField
			];

			it('should success', async () => {
				try {
					var i: number = 0;

					req.items = await Message.getReceived(
						req.auth.user,
						null, 10, {}
					);
					messages.sort((a, b) => (a._id.toString() > b._id.toString()) ? -1 : 1);
					await modifyField(req, res, next);
					expect(req.items.length).to.not.equal(0);
					while (i < req.items.length) {
						expect(typeof req.items[i].id).to.equal('string');
						expect(req.items[i].id).to.not.equal(messages[i]._id.toString());
						if (req.items[i].chatRoomId) {
							expect(req.items[i].chatRoomId)
							.to.not.equal(messages[i].chatRoomId.toString());
						}
						i++;
					}
					sinon.assert.calledWith(res.status, 200);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});
		});
	});

	describe('getSent', async () => {
		enum getSent {
			decryptCursor=0,
			checkCursor,
			_get_,
			encryptNextCursor,
			modifyField
		}
		var messages: Array<IMessageDocument>;

		beforeEach(async () => {
			try {
				messages = [
					new Message({
						to: users[1].id, from: req.auth.user._id,
						content: 'hi', type: messageTypes.message,
						chatRoomId: (new ChatRoom())._id
					}),
					new Message({
						to: users[1].id, from: req.auth.user._id,
						content: '안녕', type: messageTypes.message
					}),
					new Message({
						to: users[1].id, from: req.auth.user._id,
						content: 'bonjour', type: messageTypes.message
					}),
				];
				await Message.insertMany(messages);
			} catch (err) {
				throw err;
			}
		})

		describe('_get_', () => {
			const _get_: Function = MessageController.getSent[
				getSent._get_
			];

			it('should get all messages', async () => {
				try {
					await _get_(req, res, next);
					expect(req.items.length).to.equal(messages.length);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('modifyField', () => {
			const modifyField: Function = MessageController.getSent[
				getSent.modifyField
			];

			it('should success', async () => {
				try {
					var i: number = 0;

					req.items = await Message.getSent(
						req.auth.user,
						null, 10, {}
					);
					messages.sort((a, b) => (a._id.toString() > b._id.toString()) ? -1 : 1);
					await modifyField(req, res, next);
					expect(req.items.length).to.not.equal(0);
					while (i < req.items.length) {
						expect(typeof req.items[i].id).to.equal('string');
						expect(req.items[i].id).to.not.equal(messages[i]._id.toString());
						if (req.items[i].chatRoomId) {
							expect(req.items[i].chatRoomId)
							.to.not.equal(messages[i].chatRoomId.toString());
						}
						i++;
					}
					sinon.assert.calledWith(res.status, 200);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});
		});
	});

	describe('create', () => {
		enum create {
			checkInput=0,
			checkRecipientExist,
			create,
			send
		}

		describe('checkInput', () => {
			const checkInput: Function = MessageController.create[
				create.checkInput
			];

			it('should success', async () => {
				try {
					req.body = {
						type: messageTypes.message,
						content: 'hi',
						to: 'nickname'
					};
					await checkInput(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400', async () => {
				try {
					req.body = {
						type: 'notExistType',
						content: 'hi',
						to: 'nickname'
					};
					await checkInput(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('checkRecipientExist', () => {
			const checkRecipientExist: Function = MessageController.create[
				create.checkRecipientExist
			];

			it('should success', async () => {
				try {
					req.body.to = users[1].nickname;
					await checkRecipientExist(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400', async () => {
				try {
					req.body.to = 'notExistNickname';
					await checkRecipientExist(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('create', () => {
			const createFunc: Function = MessageController.create[
				create.create
			];

			it('should success', async () => {
				try {
					req.body = {
						content: 'hi',
						type: messageTypes.message,
					}
					req.to = users[1];
					await createFunc(req, res, next);
					sinon.assert.calledWith(res.status, 200);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400', async () => {
				try {
					req.body = {
						type: messageTypes.message,
					}
					req.to = users[1];
					await createFunc(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('send', () => {
			const send: Function = MessageController.create[
				create.send
			];

			it('should success', async () => {
				try {
					req.to = users[1];
					req.to.wsSend = sinon.spy();
					await send(req, res, next);
					sinon.assert.calledOnce(req.to.wsSend);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});
		})
	});

	describe('deleteReceived', async () => {
		enum deleteReceived {
			checkInput=0,
			decryptMessageId,
			checkMessageId,
			checkMessageExist,
			_delete_
		}
		var message: IMessageDocument;

		beforeEach(async () => {
			try {
				message = new Message({
					to: req.auth.user._id,
					from: users[1]._id,
					content: 'hi',
					type: messageTypes.message
				});
				await message.save();
			} catch (err) {
				throw err;
			}
		})

		describe('checkInput', () => {
			const checkInput: Function = MessageController.deleteReceived[
				deleteReceived.checkInput
			];

			it('should success', async () => {
				try {
					req.body.id = message._id.toString();
					await checkInput(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400', async () => {
				try {
					req.body.id = 1;
					await checkInput(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('checkMessageExist', () => {
			const checkMessageExist: Function = MessageController.deleteReceived[
				deleteReceived.checkMessageExist
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
			});

			it('should return 400', async () => {
				try {
					req.messageId = (new Message())._id.toString();
					await checkMessageExist(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('_delete_', () => {
			const _delete_: Function = MessageController.deleteReceived[
				deleteReceived._delete_
			];

			it('should change recipientDelete', async () => {
				try {
					req.message = message;
					await _delete_(req, res, next);
					expect(message.recipientDelete).to.equal(true);
					sinon.assert.calledWith(res.status, 200);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should be removed', async () => {
				try {
					message.senderDelete = true;
					await message.save();
					req.message = message;
					await _delete_(req, res, next);
					expect(await Message.findOne({ _id: message._id })).to.equal(null);
					sinon.assert.calledWith(res.status, 200);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});
		})
	});

	describe('deleteSent', async () => {
		enum deleteSent {
			checkInput=0,
			decryptMessageId,
			checkMessageId,
			checkMessageExist,
			_delete_
		}
		var message: IMessageDocument;

		beforeEach(async () => {
			try {
				message = new Message({
					to: users[1]._id,
					from: req.auth.user._id,
					content: 'hi',
					type: messageTypes.message
				});
				await message.save();
			} catch (err) {
				throw err;
			}
		})

		describe('checkInput', () => {
			const checkInput: Function = MessageController.deleteSent[
				deleteSent.checkInput
			];

			it('should success', async () => {
				try {
					req.body.id = message._id.toString();
					await checkInput(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400', async () => {
				try {
					req.body.id = 1;
					await checkInput(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('checkMessageExist', () => {
			const checkMessageExist: Function = MessageController.deleteSent[
				deleteSent.checkMessageExist
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
			});

			it('should return 400', async () => {
				try {
					req.messageId = (new Message())._id.toString();
					await checkMessageExist(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('_delete_', () => {
			const _delete_: Function = MessageController.deleteSent[
				deleteSent._delete_
			];

			it('should change senderDelete', async () => {
				try {
					req.message = message;
					await _delete_(req, res, next);
					expect(message.senderDelete).to.equal(true);
					sinon.assert.calledWith(res.status, 200);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should be removed', async () => {
				try {
					message.recipientDelete = true;
					await message.save();
					req.message = message;
					await _delete_(req, res, next);
					expect(await Message.findOne({ _id: message._id })).to.equal(null);
					sinon.assert.calledWith(res.status, 200);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});
		})
	});

	describe('hasRead', async () => {
		enum hasRead {
			checkInput=0,
			decryptMessageId,
			checkMessageId,
			checkMessageExist,
			update
		}
		var message: IMessageDocument;

		beforeEach(async () => {
			try {
				message = new Message({
					to: req.auth.user._id,
					from: users[1]._id,
					content: 'hi',
					type: messageTypes.message
				});
				await message.save();
			} catch (err) {
				throw err;
			}
		})

		describe('checkInput', () => {
			const checkInput: Function = MessageController.hasRead[
				hasRead.checkInput
			];

			it('should success', async () => {
				try {
					req.body.id = message._id.toString();
					await checkInput(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400', async () => {
				try {
					req.body.id = '';
					await checkInput(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})
		describe('checkMessageExist', () => {
			const checkMessageExist: Function = MessageController.hasRead[
				hasRead.checkMessageExist
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
			});

			it('should return 400', async () => {
				try {
					req.messageId = (new Message())._id.toString();
					await checkMessageExist(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('update', () => {
			const update: Function = MessageController.hasRead[
				hasRead.update
			];

			it('should success', async () => {
				try {
					req.message = message;
					await update(req, res, next);
					expect(
						(await Message.findOne({ _id: message._id })).read
					).to.equal(true);
					sinon.assert.calledWith(res.status, 200);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});
		})
	});
	// 	var message: IMessageDocument;
	// 	var receiver: IUserDocument;

	// 	beforeEach(async () => {
	// 		try {
	// 			receiver = new User({
	// 				nickname: 'receiver',
	// 				facebookProvider : { id: 'id2', token: 'token2' },
	// 				gender: 'male'
	// 			});
	// 			await receiver.save();
	// 			message = new Message({
	// 				type: 'message',
	// 				content: 'foo',
	// 				from: user._id,
	// 				to: receiver._id
	// 			});
	// 			await message.save();
	// 			req.body = {
	// 				id: message._id.toString()
	// 			}
	// 		} catch (err) {
	// 			throw err;
	// 		}
	// 	});

	// 	it('should response 200 hasRead', async () => {
	// 		try {
	// 			fakeMessageFindOne.resolves(message);
	// 			req.auth.user = receiver;
	// 			for (let func of MessageController.hasRead) {
	// 				await func(req, res, next);
	// 			}
	// 			sinon.assert.calledOnce(res.status);
	// 			sinon.assert.calledWith(res.status, 200);
	// 			expect(next.callCount).to.equal(3);
	// 		} catch (err) {
	// 			throw err;
	// 		}
	// 	});

	// 	it('should response 400 when id is not exist', async () => {
	// 		try {
	// 			const checkInput: Function = MessageController.hasRead[
	// 				hasRead.checkInput
	// 			];

	// 			delete req.body.id;
	// 			await checkInput(req, res, next);
	// 			sinon.assert.calledWith(res.status, 400);
	// 			sinon.assert.notCalled(next);
	// 		} catch (err) {
	// 			throw err;
	// 		}
	// 	});

	// 	it('should response 400 when user not found', async () => {
	// 		try {
	// 			const checkMessageExist: Function = MessageController.hasRead[
	// 				hasRead.checkMessageExist
	// 			];

	// 			fakeMessageFindOne.resolves(null);
	// 			await checkMessageExist(req, res, next);
	// 			sinon.assert.calledWith(res.status, 400);
	// 			sinon.assert.notCalled(next);
	// 		} catch (err) {
	// 			throw err;
	// 		}
	// 	});
	// })
	
	afterEach(async () => {
		try {
			sinon.restore();
			await setupTest.resetTestDB();
		} catch (err) {
			throw err;
		}
	})
})