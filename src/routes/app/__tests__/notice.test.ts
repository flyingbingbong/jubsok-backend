import * as chai from 'chai';
import * as sinon from 'sinon';
import * as request from 'supertest';
import { response } from 'supertest';
import * as setupTest from '../../../setupTest';
import { NoticeRouter } from '../';
import { Notice, INoticeDocument } from '../../../models';

const expect = chai.expect;

describe('notice router', () => {
	var res: response;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
		} catch (err) {
			throw err;
		}
	})

	describe('/notice', () => {
		var notices: Array<INoticeDocument>;

		beforeEach(async () => {
			try {
				this.url = '/notice';
				this.app = setupTest.mockApp();
				this.app.use('/notice', NoticeRouter);
				notices = await Notice.insertMany([
					{ content: 'bonjour' },
					{ content: 'hello' },
					{ content: 'hi', show: false }
				]);
			} catch (err) {
				throw err;
			}
		})

		it('should return 200 with notices', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.expect(200);
				expect(res.body.items.length)
					.to.equal(notices.filter(n => n.show === true).length);
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