import * as chai from 'chai';
import { SinonStub, SinonSpy, SinonFakeTimers } from 'sinon';
import { User, IUserDocument, activeUserSeconds, IWordDocument, Word } from '../../../models';
import * as sinon from 'sinon';
import { UserController } from '../';
import * as setupTest from '../../../setupTest';
import * as validator from '../../../validators';

const expect = chai.expect;

describe('User controller', () => {
	var res: any;
	var req: any;
	var next: SinonSpy;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			res = setupTest.mockRes();
			req = setupTest.mockReq();
			req.auth = {
				id: 'id',
				user: new User({
					nickname: 'foo',
					gender: 'male'
				})
			};
			await req.auth.user.save();
			next = sinon.spy(setupTest.mockNext());
		} catch (err) {
			throw err;
		}
	});

	describe('getProfile', () => {
		const getProfile: Function = UserController.getProfile;

		it('should get profile', async () => {
			try {
				const fakeGetProfile: SinonStub = sinon.stub(req.auth.user, 'getProfile');
				const profile = { profile: 'foo' };
	
				fakeGetProfile.returns(profile);
				await getProfile(req, res, next);
				sinon.assert.calledWith(res.status, 200);
				sinon.assert.calledOnce(next);
			} catch (err) {
				throw err;
			}
		});		
	});
	
	describe('updateProfile', async () => {
		enum updateProfile {
			checkInput=0,
			assignWordsBeforeUpdate,	
			updateProfile,
			updateWords,
		}

		beforeEach(async () => {
			try {
				req.auth.user.favorites = [
					{ content: '커피', point: 3 },
					{ content: '유자차', point: 3 },
				];
				req.auth.user.interests = [
					'밀크티 라떼',
					'컵',
				];
				await req.auth.user.save();
			} catch (err) {
				throw err;
			}
		})

		describe('checkInput', () => {
			const checkInput: Function = UserController.updateProfile[
				updateProfile.checkInput
			];

			it('should success', async () => {
				try {
					req.body = { interests: [ '스폰지', '밥' ] };
					await checkInput(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400 when gender already fixed', async () => {
				try {
					req.body = { gender: 'female' };
					await checkInput(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400 when nickname already fixed', async () => {
				try {
					req.body = { nickname: 'bar' };
					await checkInput(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400 when nickname already exist', async () => {
				try {
					var alreadyExistUser: IUserDocument
						= await User.create({ nickname: 'bar' });

					req.auth.user.nickname = undefined;
					await req.auth.user.save();
					req.body = { nickname: alreadyExistUser.nickname };
					await checkInput(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('assignWordsBeforeUpdate', () => {
			const assignWordsBeforeUpdate: Function = UserController.updateProfile[
				updateProfile.assignWordsBeforeUpdate
			];

			it('should assign req.oldWords when update favorites', async () => {
				try {
					req.body = {
						favorites: [
							{ content: '커피', point: 3 },
							{ content: '유자차', point: 3 },
						],
					};
					await assignWordsBeforeUpdate(req, res, next);
					expect(Array.isArray(req.oldWords)).to.equal(true);
					expect(req.oldWords.length).to.equal(
						req.auth.user.favorites.length + req.auth.user.interests.length
					);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should assign req.oldWords when update interests', async () => {
				try {
					req.body = {
						interests: [
							'빼빼로', '메론'
						]
					};
					await assignWordsBeforeUpdate(req, res, next);
					expect(Array.isArray(req.oldWords)).to.equal(true);
					expect(req.oldWords.length).to.equal(
						req.auth.user.favorites.length + req.auth.user.interests.length
					);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should not assign req.oldWords when no interests favorites update', async () => {
				try {
					await assignWordsBeforeUpdate(req, res, next);
					expect(req.oldWords).to.equal(undefined);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('updateProfile', () => {
			const updateProfileFunc: Function = UserController.updateProfile[
				updateProfile.updateProfile
			];

			it('should updateProfile', async () => {
				try {
					req.body = { interests: [ '스폰지', '송' ] };
					await updateProfileFunc(req, res, next);
					expect(req.auth.user.interests).to.deep.equal(req.body.interests);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})
		});

		describe('updateWords', () => {
			const updateWords: Function = UserController.updateProfile[
				updateProfile.updateWords
			];

			beforeEach(async () => {
				try {
					req.auth.user.favorites = [
						{ content: '커피', point: 3 },
						{ content: '유자차', point: 3 },
					];
					req.auth.user.interests = [
						'밀크티 라떼',
						'컵',
					];
					await req.auth.user.save();
					await Word.insertMany([
						{ content: '머그샷', freq: 2 },
						{ content: '컵', freq: 1 },
						{ content: '커피', freq: 9 },
						{ content: '유자차', freq: 1 },
						{ content: '밀크티 라떼', freq: 8 },
					]);
				} catch (err) {
					throw err;
				}
			})
	
			it('should update words', async () => {
				try {
					req.oldWords = req.auth.user.favorites
						.map(f => f.content)
						.concat(req.auth.user.interests);
					req.auth.user.favorites = [
						{ content: '녹차 라떼', point: 4 },
						{ content: '커피', point: 3 }
					]
					req.auth.user.interests = [
						'머그샷', '커피', '녹차 라떼'
					];
					await req.auth.user.save();
					await updateWords(req, res, next);
					expect((await Word.findOne({ content: '커피' })).freq).to.equal(9);
					expect((await Word.findOne({ content: '유자차' }))).to.equal(null);
					expect((await Word.findOne({ content: '컵' }))).to.equal(null);
					expect((await Word.findOne({ content: '밀크티 라떼' })).freq).to.equal(7);
					expect((await Word.findOne({ content: '머그샷' })).freq).to.equal(3);
					expect((await Word.findOne({ content: '녹차 라떼' })).freq).to.equal(1);
					sinon.assert.calledWith(res.status, 200);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})
		})
	});
	
	describe('nicknameRequired', () => {
		const nicknameRequired: Function = UserController.nicknameRequired;

		it('should success', async () => {
			try {
				req.auth.user.nickname = 'nick';
				await nicknameRequired(req, res, next);
				sinon.assert.notCalled(res.status);
				sinon.assert.calledOnce(next);
			} catch (err) {
				throw err;
			}
		});

		it('should return 403', async () => {
			try {
				req.auth.user = new User();
				await nicknameRequired(req, res, next);
				sinon.assert.calledWith(res.status, 403);
				sinon.assert.notCalled(next);
			} catch (err) {
				throw err;
			}
		});
	});
	
	describe('weeklyTastesRequired', () => {
		const weeklyTastesRequired: Function = UserController.weeklyTastesRequired;

		it('should success', async () => {
			try {
				req.auth.user.weeklyTastes = [0, 1, 1];
				await weeklyTastesRequired(req, res, next);
				sinon.assert.notCalled(res.status);
				sinon.assert.calledOnce(next);
			} catch (err) {
				throw err;
			}
		});

		it('should return 403', async () => {
			try {
				req.auth.user.weeklyTastes = [0, 1, -1];
				await weeklyTastesRequired(req, res, next);
				sinon.assert.calledWith(res.status, 403);
				sinon.assert.notCalled(next);
			} catch (err) {
				throw err;
			}
		})
		
	});

	describe('userinfo', async () => {
		enum userinfo {
			checkInput=0,
			checkUserExist,
			responseUserInfo
		}

		describe('checkInput', () => {
			const checkInput: Function = UserController.userinfo[
				userinfo.checkInput
			];

			it('should success', async () => {
				try {
					req.query.nickname = req.auth.user.nickname;
					await checkInput(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})

			it('should return 400', async () => {
				try {
					req.query.nickname = 1;
					await checkInput(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			})
		})

		describe('checkUserExist', () => {
			const checkUserExist: Function = UserController.userinfo[
				userinfo.checkUserExist
			];

			it('should success', async () => {
				try {
					req.query.nickname = req.auth.user.nickname;
					await checkUserExist(req, res, next);
					expect(req.userinfo.nickname).to.equal(req.auth.user.nickname);
					expect(req.userinfo._id).to.equal(undefined);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})

			it('should return 400', async () => {
				try {
					req.query.nickname = 'notExistNickname';
					await checkUserExist(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			})
		})

		describe('responseUserInfo', () => {
			const responseUserInfo: Function = UserController.userinfo[
				userinfo.responseUserInfo
			];

			it('should success', async () => {
				try {
					req.userinfo = new User({nickname: 'foo'});
					req.userinfo.toJSON = sinon.spy();
					await responseUserInfo(req, res, next);
					sinon.assert.calledWith(req.userinfo.toJSON);
					sinon.assert.calledWith(res.status, 200);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})
		})
	});

	describe('search', async () => {
		enum search {
			checkInput=0,
			search,
			modifyField,
		}

		describe('checkInput', () => {
			const checkInput: Function = UserController.search[
				search.checkInput
			];

			it('should success', async () => {
				try {
					req.query.gender = 'male';
					await checkInput(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400 when insufficient query', async () => {
				try {
					await checkInput(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400 when validateInput throw', async () => {
				try {
					const fakeValidateInput: SinonStub
						= sinon.stub(validator, 'validateInput');

					fakeValidateInput.rejects();
					await checkInput(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('search', () => {
			const searchFunc: Function = UserController.search[
				search.search
			];
			var users: Array<IUserDocument>;
			var now: Date;
			var activeTime: Date;
			var clock: SinonFakeTimers;

			beforeEach(async () => {
				try {
					var i: number = 0;
				
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

			it('should search users', async () => {
				try {
					const activeUsers: Array<IUserDocument> = users
						.filter(v => v.lastSeen > activeTime)

					req.query.active = true;
					req.query.gender = 'male';
					await searchFunc(req, res, next);
					expect(req.items.length).to.equal(30);
					activeUsers.forEach(v => {
						expect(req.items.find(item => item._id.toString() === v._id.toString()))
							.to.not.equal(undefined);
					});
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})
		})

		describe('modifyField', () => {
			const modifyField: Function = UserController.search[
				search.modifyField
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

	describe('_delete_', async () => {
		enum _delete_ {
			checkInput=0,
			_delete_
		}

		describe('checkInput', () => {
			const checkInput: Function = UserController._delete_[
				_delete_.checkInput
			];

			it('should success', async () => {
				try {
					req.body.confirm = 'DELETE';
					await checkInput(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400', async () => {
				try {
					req.body.confirm = 'what';
					await checkInput(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		});

		describe('_delete_', () => {
			const deleteFunc: Function = UserController._delete_[
				_delete_._delete_
			];

			it('should success', async () => {
				try {
					const userId: string = req.auth.user._id.toString();

					await deleteFunc(req, res, next);
					expect(await User.findOne({ _id: userId })).to.equal(null);
					sinon.assert.calledWith(res.status, 200);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});
		})
	});


	describe('getPublicKeys', async () => {
		enum getPublicKeys {
			checkInput=0,
			checkUserExist,
			leaveRooms,
			getKeys,
		}
		var userToChat: IUserDocument;

		beforeEach(async () => {
			try {
				userToChat = new User({
					nickname: 'tochat',
					sessions: [
						{ publicKey: 'key1', refreshToken: 'token1' },
						{ publicKey: 'key2', refreshToken: 'token2' },
					]
				})
				await userToChat.save();
			} catch (err) {
				throw err;
			}
		});

		describe('checkInput', () => {
			const checkInput: Function = UserController.getPublicKeys[
				getPublicKeys.checkInput
			];

			it('should success', async () => {
				try {
					req.query.nickname = userToChat.nickname;
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

		describe('checkUserExist', () => {
			const checkUserExist: Function = UserController.getPublicKeys[
				getPublicKeys.checkUserExist
			];

			it('should success', async () => {
				try {
					req.query.nickname = userToChat.nickname;
					await checkUserExist(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400', async () => {
				try {
					req.query.nickname = 'notExistNickname';
					await checkUserExist(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('getKeys', () => {
			const getKeys: Function = UserController.getPublicKeys[
				getPublicKeys.getKeys
			];

			it('should success', async () => {
				try {
					req.userToChat = userToChat;
					await getKeys(req, res, next);
					expect(res.json.getCall(0).args[0]).to.deep.equal({
						keys: userToChat.sessions.map(v => v.publicKey)
					})
					sinon.assert.calledWith(res.status, 200);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})
		})
	});

	afterEach(async () => {
		try {
			sinon.restore();
			await setupTest.resetTestDB();
		} catch (err) {
			throw err;
		}
	})
});