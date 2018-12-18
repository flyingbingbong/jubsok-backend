import * as chai from 'chai';
import * as sinon from 'sinon';
import { SinonSpy } from 'sinon';
import { WordController } from '../';
import { Word, IWordDocument } from '../../../models';
import * as setupTest from '../../../setupTest';

const expect = chai.expect;

describe('Word controller', () => {
	var res: any;
	var req: any;
	var next: SinonSpy;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			res = setupTest.mockRes();
			req = setupTest.mockReq();
			next = sinon.spy(setupTest.mockNext());
		} catch (err) {
			throw err;
		}
	})

	describe('_get_', () => {
		enum _get_ {
			checkInput=0,
			_get_,
		}

		describe('checkInput', () => {
			const checkInput: Function = WordController._get_[
				_get_.checkInput
			];

			it('should success when query and page is valid', async () => {
				try {
					req.query = { query: 'word', page: 2 };
					await checkInput(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})

			it('should success when query exist and page not exist', async () => {
				try {
					req.query = { query: 'word' };
					await checkInput(req, res, next);
					sinon.assert.notCalled(res.status);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})

			it('should fail when query not exist', async () => {
				try {
					req.query = {};
					await checkInput(req, res, next);
					sinon.assert.calledWith(res.status, 400);
					sinon.assert.notCalled(next);
				} catch (err) {
					throw err;
				}
			})
		})

		describe('_get_', () => {
			const getFunc: Function = WordController._get_[
				_get_._get_
			];

			it('should return 200 with words', async () => {
				try {
					req.query = { query: 'word' };
					await getFunc(req, res, next);
					sinon.assert.calledWith(res.status, 200);
					sinon.assert.calledOnce(next);
				} catch (err) {
					throw err;
				}
			})
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