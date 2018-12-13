import * as chai from 'chai';
import * as setupTest from '../../../setupTest';
import { SinonSpy, SinonStub } from 'sinon';
import * as sinon from 'sinon';
import { User, ChatRoom, IChatRoomDocument, IUserDocument } from '../../../models';
import { ChatController } from '../';
import { AES } from '../../../utils';

const expect = chai.expect;

describe('Chat controller', () => {
	var res: any;
	var req: any;
	var next: SinonSpy;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			res = setupTest.mockRes();
			req = setupTest.mockReq();
			next = sinon.spy(setupTest.mockNext());
			req.auth = {
				user: new User({ nickname: 'foo' })
			}
			await req.auth.user.save();
		} catch (err) {
			throw err;
		}
	});

	describe('createRoom', async () => {
		enum createRoom {
			checkInput=0,
			checkUserExist,
			createRoom,
			createMessage,
			sendMessage,
		}
		var userToChat: IUserDocument;

		beforeEach(async () => {
			try {
				userToChat = new User({ nickname: 'bar' });
				await userToChat.save();
			} catch (err) {
				throw err;
			}
		})

		describe('checkInput', () => {
			const checkInput: Function = ChatController.createRoom[
				createRoom.checkInput
			];

			it('should success', async () => {
				try {
					req.body = {
						nickname: userToChat.nickname,
						AESkeys: [ 'key1', 'key2' ]
					}
					await checkInput(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400 when nickname not exist', async () => {
				try {
					req.body = {
						AESkeys: [ 'key1', 'key2' ]
					}
					await checkInput(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400 when AESkeys not exist', async () => {
				try {
					req.body = {
						nickname: userToChat.nickname
					}
					await checkInput(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		});

		describe('checkUserExist', () => {
			const checkUserExist: Function = ChatController.createRoom[
				createRoom.checkUserExist
			];

			it('should success', async () => {
				try {
					req.body = {
						nickname: userToChat.nickname
					}
					await checkUserExist(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400', async () => {
				try {
					req.body = {
						nickname: 'notExistNickname'
					}
					await checkUserExist(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('createRoom', () => {
			const createRoomFunc: Function = ChatController.createRoom[
				createRoom.createRoom
			];

			it('should success', async () => {
				try {
					req.userToChat = userToChat;
					req.body.AESkeys = [ 'key1', 'key2' ];
					await createRoomFunc(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400 when chatroom users duplicate', async () => {
				try {
					req.userToChat = req.auth.user;
					req.body.AESkeys = [ 'key1', 'key2' ];
					await createRoomFunc(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('createMessage', () => {
			const createMessage: Function = ChatController.createRoom[
				createRoom.createMessage
			];

			it('should success', async () => {
				try {
					req.userToChat = userToChat;
					req.room = new ChatRoom();
					await createMessage(req, res, next);
					sinon.assert.calledWith(res.status, 200);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('sendMessage', () => {
			const sendMessage: Function = ChatController.createRoom[
				createRoom.sendMessage
			];

			it('should success', async () => {
				try {
					req.userToChat = userToChat;
					req.userToChat.wsSend = sinon.spy();
					req.room = new ChatRoom();
					await sendMessage(req, res, next);
					sinon.assert.calledOnce(req.userToChat.wsSend);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});
		})
	});

	describe('leaveRooms', async () => {
		it('should leave all rooms', async () => {
			try {
				var chatRooms: Array<IChatRoomDocument>;

				await ChatRoom.insertMany([
					{ users: [ req.auth.user._id, (new User())._id ], keys: ['key1'] },
					{ users: [ req.auth.user._id, (new User())._id ], keys: ['key2'] }
				]);
				await ChatController.leaveRooms(req, res, next);
				chatRooms = await ChatRoom.find({ users: req.auth.user._id });
				expect(chatRooms.length).to.equal(0);
			} catch (err) {
				throw err;
			}	
		})

		it('should leave all rooms except one', async () => {
			try {
				var chatRooms: Array<IChatRoomDocument>;

				chatRooms = await ChatRoom.insertMany([
					{ users: [ req.auth.user._id, (new User())._id ], keys: ['key1'] },
					{ users: [ req.auth.user._id, (new User())._id ], keys: ['key2'] }
				]);
				req.room = chatRooms[0];
				await ChatController.leaveRooms(req, res, next);
				chatRooms = await ChatRoom.find({ users: req.auth.user._id });
				expect(chatRooms.length).to.equal(1);
			} catch (err) {
				throw err;
			}	
		})
	})

	describe('getAESkeys', async () => {
		enum getAESkeys {
			checkInput=0,
			decryptChatRoomId,
			checkChatRoomId,
			checkChatRoomExist,
			leaveRooms,
			getKeys,
		}
		var room: IChatRoomDocument;

		beforeEach(async () => {
			try {
				var userToChat: IUserDocument;

				userToChat = new User();
				await userToChat.save();
				room = new ChatRoom({
					users: [ req.auth.user._id.toString(), userToChat._id.toString() ],
					keys: [ 'key1', 'key2' ]
				});
				await room.save();
			} catch (err) {
				throw err;
			}
		})

		describe('checkInput', () => {
			const checkInput: Function = ChatController.getAESkeys[
				getAESkeys.checkInput
			];

			it('should success', async () => {
				try {
					req.query.chatRoomId = room._id.toString();
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

		describe('decryptChatRoomId', () => {
			const decryptChatRoomId: Function = ChatController.getAESkeys[
				getAESkeys.decryptChatRoomId
			];

			it('should success', async () => {
				try {
					req.query.chatRoomId = AES.encrypt(room._id.toString());
					await decryptChatRoomId(req, res, next);
					expect(req.chatRoomId).to.equal(room._id.toString());
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})

			it('should return 400', async () => {
				try {
					req.query.chatRoomId = 'invalidId';
					await decryptChatRoomId(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			})
		})

		describe('checkChatRoomExist', () => {
			const checkChatRoomExist: Function = ChatController.getAESkeys[
				getAESkeys.checkChatRoomExist
			];

			it('should success', async () => {
				try {
					req.chatRoomId = room._id.toString();
					await checkChatRoomExist(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})

			it('should return 400', async () => {
				try {
					req.chatRoomId = (new ChatRoom())._id.toString();
					await checkChatRoomExist(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			})
		})

		describe('getKeys', () => {
			const getKeys: Function = ChatController.getAESkeys[
				getAESkeys.getKeys
			];

			it('should success', async () => {
				try {
					req.room = room;
					await getKeys(req, res, next);
					expect(res.json.getCall(0).args[0].keys).to.deep.equal(room.keys);
					sinon.assert.calledWith(res.status, 200);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})
		})
	});

	describe('getChats', async () => {
		enum getChats {
			checkInput=0,
			decryptChatRoomId,
			checkChatRoomId,
			checkChatRoomExist,
			decryptCursor,
			checkCursor,
			_get_,
			encryptNextCursor,
			modifyField
		}
		var room: IChatRoomDocument;

		beforeEach(async () => {
			try {
				var userToChat: IUserDocument;

				userToChat = new User();
				await userToChat.save();
				room = new ChatRoom({
					users: [ req.auth.user._id.toString(), userToChat._id.toString() ],
					keys: [ 'key1', 'key2' ],
					chats: [
						{ content: 'chat1', user: req.auth.user._id.toString() },
						{ content: 'chat2', user: userToChat._id.toString() },
					]
				});
				await room.save();
			} catch (err) {
				throw err;
			}
		})

		describe('checkInput', () => {
			const checkInput: Function = ChatController.getChats[
				getChats.checkInput
			];

			it('should success', async () => {
				try {
					req.query.chatRoomId = room._id.toString();
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

		describe('decryptChatRoomId', () => {
			const decryptChatRoomId: Function = ChatController.getChats[
				getChats.decryptChatRoomId
			];

			it('should success', async () => {
				try {
					req.query.chatRoomId = AES.encrypt(room._id.toString());
					await decryptChatRoomId(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400', async () => {
				try {
					req.query.chatRoomId = 'invalidId';
					await decryptChatRoomId(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('checkChatRoomExist', () => {
			const checkChatRoomExist: Function = ChatController.getChats[
				getChats.checkChatRoomExist
			];

			it('should success', async () => {
				try {
					req.chatRoomId = room._id.toString();
					await checkChatRoomExist(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400', async () => {
				try {
					req.chatRoomId = (new ChatRoom())._id.toString();
					await checkChatRoomExist(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('_get_', () => {
			const _get_: Function = ChatController.getChats[
				getChats._get_
			];

			it('should success', async () => {
				try {
					req.room = room;
					await _get_(req, res, next);
					expect(req.items.length).to.equal(room.chats.length);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});
		});

		describe('modifyField', () => {
			const modifyField: Function = ChatController.getChats[
				getChats.modifyField
			];

			it('should success', async () => {
				try {
					req.room = room;
					req.items = await req.room.getChats(null, 10, {});
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

	describe('createChat', () => {
		enum createChat {
			checkInput=0,
			decryptChatRoomId,
			checkChatRoomId,
			checkChatRoomExist,
			getRecipient,
			saveChat,
			sendChat
		}
		var userToChat: IUserDocument;
		var room: IChatRoomDocument;

		beforeEach(async () => {
			try {
				userToChat = new User();
				await userToChat.save();
				room = new ChatRoom({
					users: [ req.auth.user._id.toString(), userToChat._id.toString() ],
					keys: [ 'key1', 'key2' ],
				});
				await room.save();			
			} catch (err) {
				throw err;
			}
		})

		describe('checkInput', () => {
			const checkInput: Function = ChatController.createChat[
				createChat.checkInput
			];

			it('should success', async () => {
				try {
					req.body = { content: 'hi', chatRoomId: 'chatRoomId' };
					await checkInput(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);				
				} catch (err) {
					throw err;
				}
			})

			it('should fail when content not exist', async () => {
				try {
					req.body = { chatRoomId: 'chatRoomId' };
					await checkInput(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			})

			it('should fail when chatRoomId not exist', async () => {
				try {
					req.body = { content: 'hi' };
					await checkInput(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			})
		})

		describe('decryptChatRoomId', () => {
			const decryptChatRoomId: Function = ChatController.createChat[
				createChat.decryptChatRoomId
			];

			it('should success', async () => {
				try {
					req.body.chatRoomId = AES.encrypt(room._id.toString());
					await decryptChatRoomId(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400', async () => {
				try {
					req.body.chatRoomId = 'invalidId';
					await decryptChatRoomId(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('checkChatRoomExist', () => {
			const checkChatRoomExist: Function = ChatController.createChat[
				createChat.checkChatRoomExist
			];

			it('should success', async () => {
				try {
					req.chatRoomId = room._id.toString();
					await checkChatRoomExist(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400', async () => {
				try {
					req.chatRoomId = (new ChatRoom())._id.toString();
					await checkChatRoomExist(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('getRecipient', () => {
			const getRecipient: Function = ChatController.createChat[
				createChat.getRecipient
			];

			it('should success', async () => {
				try {
					req.room = room;
					await getRecipient(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400', async () => {
				try {
					await userToChat.remove();
					req.room = room;
					await getRecipient(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('saveChat', () => {
			const saveChat: Function = ChatController.createChat[
				createChat.saveChat
			];

			it('should success', async () => {
				try {
					req.body.content = 'hi';
					req.room = room;
					await saveChat(req, res, next);
					expect(
						(await ChatRoom.findOne({ _id: room._id })).chats.length
					).to.equal(1)
					sinon.assert.calledWith(res.status, 200);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('sendChat', () => {
			const sendChat: Function = ChatController.createChat[
				createChat.sendChat
			];

			it('should success', async () => {
				try {
					req.chat = { content: 'hi' };
					req.recipient = userToChat;
					req.recipient.wsSend = sinon.spy();
					await sendChat(req, res, next);
					sinon.assert.calledOnce(req.recipient.wsSend);
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