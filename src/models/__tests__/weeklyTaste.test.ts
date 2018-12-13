import * as chai from 'chai';
import * as sinon from 'sinon';
import { WeeklyTaste, IWeeklyTasteDocument } from '../';
import * as setupTest from '../../setupTest';

const expect = chai.expect;

describe('WeeklyTaste model', () => {
	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
		} catch (err) {
			throw err;
		}
	});

	it('should save weekly tastes', async () => {
		try {
			var wt: IWeeklyTasteDocument;

			wt = new WeeklyTaste({
				list: [
					[ 'pen', 'eraser' ],
					[ 'tree', 'flower' ],
					[ 'note', 'phone' ]
				]
			});
			await wt.save();
			expect(wt.createdAt).to.be.instanceof(Date);
		} catch (err) {
			throw err;
		}
	});

	it('should throw validation error when list length is not correct', async () => {
		try {
			var wt1: IWeeklyTasteDocument;
			var wt2: IWeeklyTasteDocument;

			wt1 = new WeeklyTaste({
				list: [
					[ 'pen', 'eraser' ],
					[ 'tree', 'flower' ],
				]
			});
			wt2 = new WeeklyTaste({
				list: [
					[ 'pen', 'eraser' ],
					[ 'tree', 'flower' ],
					[ 'doll', 'animal' ],
					[ 'dog', 'cat' ]
				]
			});
			try {
				await wt1.save();
				throw 'Test Error';
			} catch (err) {
				expect(err.name).to.be.equal('ValidationError');
			}
			try {
				await wt2.save();
				throw 'Test Error';
			} catch (err) {
				expect(err.name).to.be.equal('ValidationError');
			}
		} catch (err) {
			throw err;
		}
	});

	it('should throw error when group of list length is not 2', async () => {
		try {
			var wt1: IWeeklyTasteDocument;
			var wt2: IWeeklyTasteDocument;

			wt1 = new WeeklyTaste({
				list: [
					[ 'pen', 'eraser' ],
					[ 'tree', 'flower', 'leaf' ],
					[ 'doll', 'animal' ],
				]
			});
			wt2 = new WeeklyTaste({
				list: [
					[ 'pen', 'eraser' ],
					[ 'tree', 'flower' ],
					[ 'doll' ],
				]
			});
			try {
				await wt1.save();
				throw 'Test Error';
			} catch (err) {
				expect(err.name).to.be.equal('ValidationError');
			}
			try {
				await wt2.save();
				throw 'Test Error';
			} catch (err) {
				expect(err.name).to.be.equal('ValidationError');
			}
		} catch (err) {
			throw err;
		}
	});

	describe('getRecent', () => {
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

		it('should return recent', async () => {
			try {
				const expectedRecent: IWeeklyTasteDocument = weeklyTastes
					.sort(
						(a,b) => a.createdAt.getSeconds() > b.createdAt.getSeconds() ? -1 : 1
					)[0];
				var recent: Array<Array<string>>;

				recent = await WeeklyTaste.getRecent();
				expect(recent).to.deep.equal(expectedRecent.list);
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
