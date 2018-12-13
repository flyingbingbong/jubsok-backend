import * as chai from 'chai';
import * as sinon from 'sinon';
import * as request from 'supertest';
import { response } from 'supertest';
import * as setupTest from '../../../setupTest';
import { WeeklyTasteRouter } from '../';
import { WeeklyTaste } from '../../../models';

const expect = chai.expect;

describe('weeklyTaste router', () => {
	var res: response;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
		} catch (err) {
			throw err;
		}
	})

	describe('/weeklytaste/recent', () => {
		var recent: Array<Array<string>>;

		beforeEach(async () => {
			try {
				var now: Date;

				this.url = '/weeklytaste/recent';
				this.app = setupTest.mockApp();
				this.app.use('/weeklytaste', WeeklyTasteRouter);
				now = new Date();
				await WeeklyTaste.insertMany([
					{
						list: [
							[ '피카츄', '이브이' ],
							[ '호날두', '메시' ],
							[ '부먹', '찍먹' ]
						],
						createdAt: now
					},
					{
						list: [
							[ '파이리', '꼬부기' ],
							[ '고난', '역경' ],
							[ '코난', '도일' ]
						],
						createdAt: (new Date()).setDate(now.getDate() + 1)
					},
				]);
				recent = (await WeeklyTaste.findOne().sort({ createdAt: -1 })).list;
			} catch (err) {
				throw err;
			}
		})

		it('should return 200 with recent', async () => {
			try {
				res = await request(this.app)
					.get(this.url)
					.expect(200);
				expect(res.body.recent).to.deep.equal(recent);
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