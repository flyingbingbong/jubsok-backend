import * as chai from 'chai';
import * as sinon from 'sinon';
import { SinonSpy } from 'sinon';
import { Notice, INoticeDocument } from '../../../models';
import { NoticeController } from '../';
import * as setupTest from '../../../setupTest';
import { INotice } from '../../../types';

const expect = chai.expect;

describe('notice controller', () => {
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
	});

	describe('_get_', async () => {
		beforeEach(async () => {
			try {
				const now: Date = new Date();
				const notices: Array<INotice> = [
					{ content: 'foo', createdAt: now },
					{ content: 'bar', createdAt: new Date(now.getTime() + 1) },
					{ content: 'zoo', createdAt: new Date(now.getTime() + 2) },
				];

				await Notice.insertMany(notices);
			} catch (err) {
				throw err;
			}	
		});

		it('should return 200 with notices', async () => {
			try {
				var items: Array<INotice>;
				var sorted: Array<INotice>;

				await NoticeController._get_(req, res, next);
				items = res.json.getCall(0).args[0].items;
				sorted = items.slice().sort((a, b) => (
					(a.createdAt >= b.createdAt) ? -1 : 1
				));
				expect(items).to.deep.equal(sorted);
				sinon.assert.calledOnce(res.status);
				sinon.assert.calledWith(res.status, 200);
				sinon.assert.calledOnce(next);
			} catch (err) {
				throw err;
			}
		});
	})

	afterEach(async () => {
		try {
			await setupTest.resetTestDB();
		} catch (err) {
			throw err;
		}
	});
})