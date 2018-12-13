import * as chai from 'chai';
import * as sinon from 'sinon';
import * as setupTest from '../../../setupTest';
import * as helpers from '../helpers';
import { AES } from '../../../utils';
import { SinonSpy } from 'sinon';
import { User, IMessageDocument, Message, messageTypes } from '../../../models';

const expect = chai.expect;

describe('helpers', () => {
	var users: Array<any>;
	var res: any;
	var req: any;
	var next: SinonSpy;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			res = setupTest.mockRes();
			req = setupTest.mockReq();
			next = sinon.spy(setupTest.mockNext());
			users = [
				new User({ nickname: 'foo' }),
				new User({ nickname: 'bar' }),
			];
			await User.insertMany(users);
			req.auth = {
				user: users[0]
			};
		} catch (err) {
			throw err;
		}
	})

	describe('field', () => {
		beforeEach(async () => {
			try {
				users = users.map(v => v.toJSON());
			} catch (err) {
				throw err;
			}
		})

		it('should encrypt', () => {
			const { encrypt } = helpers.FieldHelper;
			const expected = users.map(v => AES.encrypt(v._id.toString()));

			users.forEach(encrypt('_id'));
			users.forEach((v, i) => {
				expect(v._id).to.equal(expected[i]);
			});
		});

		it('should delete', () => {
			const { _delete_ } = helpers.FieldHelper;

			users.forEach(_delete_('_id'));
			users.forEach((v, i) => {
				expect(v._id).to.equal(undefined);
			});
		});

		it('should execute all functions', () => {
			const { encrypt, _delete_, doAll } = helpers.FieldHelper;
			const expectedId = users.map(v => AES.encrypt(v._id.toString()));

			users.forEach(
				doAll([encrypt('_id'), _delete_('nickname')])
			);
			users.forEach((v, i) => {
				expect(v._id).to.equal(expectedId[i]);
				expect(v.nickname).to.equal(undefined);
			});
		})
	});

	describe('cursorPagination', () => {
		const { decryptCursor, encryptNextCursor } = helpers.CursorPagination;

		describe('decryptCursor', async () => {
			it('should decrypted cursor', async () => {
				try {
					const cursor: string = AES.encrypt('foo');

					req.query.next = cursor;
					await decryptCursor('msg')(req, res, next);
					expect(req.cursor).to.equal(AES.decrypt(cursor));
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should contain null cursor', async () => {
				try {
					req.query.next = undefined;
					await decryptCursor('msg')(req, res, next);
					expect(req.cursor).to.equal(null);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400 when cursor is bad encrypted', async () => {
				try {
					req.query.next = 'foo';
					await decryptCursor('msg')(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})

		describe('encryptNextCursor', () => {
			it('should encrypt cursor', async () => {
				try {
					var pageSize: number;

					req.items = [ {_id: 'id1'}, {_id: 'id2'} ];
					pageSize = req.items.length;
					await encryptNextCursor(pageSize, '_id')(req, res, next);
					expect(req.nextCursor).to.equal(AES.encrypt(req.items[1]._id));
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should contain null cursor', async () => {
				try {
					var pageSize: number;

					req.items = [ {_id: 'id1'}, {_id: 'id2'} ];
					pageSize = req.items.length + 1;
					await encryptNextCursor(pageSize, '_id')(req, res, next);
					expect(req.nextCursor).to.equal(null);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 500 when items not found', async () => {
				try {
					req.items = {};
					await encryptNextCursor(2, '_id')(req, res, next);
					sinon.assert.calledWith(res.status, 500);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		});
	})

	describe('checkId', () => {
		const checkId: Function = helpers.checkId;

		it('should pass', async () => {
			try {
				const prop: string = 'prop';

				req[prop] = (new User())._id.toString();
				await checkId('msgPrefix', prop)(req, res, next);
				sinon.assert.notCalled(res.status);
				sinon.assert.calledOnce(next);
			} catch (err) {
				throw err;
			}
		})

		it('should fail', async () => {
			try {
				const prop: string = 'prop';

				req[prop] = (new User())._id.toString() + 'a';
				await checkId('msgPrefix', prop)(req, res, next);
				sinon.assert.calledWith(res.status, 400);
				sinon.assert.notCalled(next);
			} catch (err) {
				throw err;
			}
		})
	})

	describe('MessageHelper', () => {
		describe('decryptMessageId', () => {
			const decryptMessageId: Function
				= helpers.MessageHelper.decryptMessageId('msgPrefix');
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

			it('should success', async () => {
				try {
					req.body.id = AES.encrypt(message._id.toString());
					await decryptMessageId(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			});

			it('should return 400', async () => {
				try {
					req.body.id = 'invalidId';
					await decryptMessageId(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			});
		})
	})

	afterEach(async () => {
		try {
			await setupTest.resetTestDB();
		} catch (err) {
			throw err;
		}		
	})
})