import * as chai from 'chai';
import * as sinon from 'sinon';
import { Word, IWordDocument } from '../';
import * as setupTest from '../../setupTest';

const expect = chai.expect;

describe('Word model', () => {
	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
		} catch (err) {
			throw err;
		}
	})

	describe('getByText', () => {
		var words: Array<IWordDocument>;

		beforeEach(async () => {
			try {
				words = await Word.insertMany([
					{ content: '오박사', freq: 10 },
					{ content: '공 박사', freq: 9 },
					{ content: '김박사', freq: 1 },
					{ content: '박박사', freq: 8 },
					{ content: '이박사', freq: 6 },
					{ content: '도박사', freq: 7 },
					{ content: '오석사', freq: 100 },
				]);
			} catch (err) {
				throw err;
			}
		})

		it('should return words paginated', async () => {
			try {
				const pageSize: number = 3;
				var page1: Array<IWordDocument>;
				var page2: Array<IWordDocument>;
				var expectedPage1: Array<IWordDocument>;
				var expectedPage2: Array<IWordDocument>;
				var i: number = 0;

				expectedPage1 = words
					.filter(v => /.*박사.*/.test(v.content))
					.sort((a, b) => (a.freq > b.freq) ? -1 : 1)
					.slice(0, pageSize);
				expectedPage2 = words
					.filter(v => /.*박사.*/.test(v.content))
					.sort((a, b) => (a.freq > b.freq) ? -1 : 1)
					.slice(pageSize, pageSize * 2);
				page1 = await Word.getByText(
					'박사', 1, pageSize, {}
				);
				page2 = await Word.getByText(
					'박사', 2, pageSize, {}
				);
				expect(page1.length).to.not.equal(0);
				while (i < pageSize) {
					expect(page1[i]._id.toString())
						.to.equal(expectedPage1[i]._id.toString());
					i++;
				}
				i = 0;
				expect(page2.length).to.not.equal(0);
				while (i < pageSize) {
					expect(page2[i]._id.toString())
						.to.equal(expectedPage2[i]._id.toString());
					i++;
				}
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
	})
})