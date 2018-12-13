import * as chai from 'chai';
import * as sinon from 'sinon';
import { SinonSpy } from 'sinon';
import { WeeklyTasteController } from '../';
import { WeeklyTaste, IWeeklyTasteDocument } from '../../../models';
import * as setupTest from '../../../setupTest';

const expect = chai.expect;

describe('WeeklyTaste controller', () => {
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

	describe('getRecent', () => {
		const getRecent: Function = WeeklyTasteController.getRecent;
		var weeklyTastes: Array<IWeeklyTasteDocument>;

		beforeEach(async () => {
			try {
				var now: Date = new Date();

				weeklyTastes = [
					new WeeklyTaste({
						list: [ [ '나옹', '마자용' ], [ '부먹', '찍먹' ], [ '우분투', '센토스' ] ],
						createdAt: (new Date()).setDate(now.getDate() - 1)
					}),
					new WeeklyTaste({
						list: [ [ '피카츄', '파이리' ], [ '파이썬', '루비' ], [ '퀸', '비틀즈' ] ],
						createdAt: now
					}),
				];
				await WeeklyTaste.insertMany(weeklyTastes);
			} catch (err) {
				throw err;
			}
		});

		it('should return recent list', async () => {
			try {
				const expectedRecent: IWeeklyTasteDocument = weeklyTastes
					.sort(
						(a,b) => a.createdAt.getSeconds() > b.createdAt.getSeconds() ? -1 : 1
					)[0];

				await getRecent(req, res, next);
				expect(res.json.getCall(0).args[0])
					.to.deep.equal({ recent: expectedRecent.list });
				sinon.assert.calledWith(res.status, 200);
				sinon.assert.calledOnce(next);
			} catch (err) {
				throw err;
			}
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