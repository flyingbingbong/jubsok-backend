import * as chai from 'chai';
import * as sinon from 'sinon';
import * as request from 'supertest';
import { response } from 'supertest';
import * as setupTest from '../../../setupTest';
import { WordRouter } from '../';
import * as jwt from 'jsonwebtoken';
import { testHelper } from '../helpers';
import { User, Word, IWordDocument } from '../../../models';

const expect = chai.expect;
const JWT_SECRET: string = <string>process.env.JWT_SECRET;

describe('word router', () => {
	var res: response;
	var accessToken: string;
	this.testAuth = testHelper.testAuth;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			this.user = new User({
				facebookProvider: { id: 'foo@bar.com' },
			});
			await this.user.save();
			accessToken = await jwt.sign(
				{ id: this.user.facebookProvider.id },
				JWT_SECRET,
				{ expiresIn: 60 * 5 }
			);
		} catch (err) {
			throw err;
		}
	})

	describe('/word (GET)', () => {
		var words: Array<IWordDocument>;

		beforeEach(async () => {
			try {
				var range: Array<number> = [];

				this.url = '/word';
				this.app = setupTest.mockApp();
				this.app.use('/word', WordRouter);
				for (let i=0; i < 60; i++)
					range.push(i)
				words = await Word.insertMany(
					range.map(n => ({ content: `word${n}`, freq: n }))
						.concat(range.map(n => ({ content: `haha${n}`, freq: n })))
				);
			} catch (err) {
				throw err;
			}
		})

		this.testAuth('GET');

		it('should return 200 with words', async () => {
			try {
				var res2: response;
				const query: string = 'word';

				res = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ query })
					.expect(200);
				expect(res.body.items.length).to.equal(30);
				expect(res.body.next).to.equal(2);
				res2 = await request(this.app)
					.get(this.url)
					.set({ 'x-auth-token': accessToken })
					.query({ query, page: res.body.next })
					.expect(200);
				expect(res2.body.items.length).to.equal(30);
				expect(res2.body.next).to.equal(3);
				expect(res.body.items[0].content)
					.to.not.equal(res2.body.items[0].content);
			} catch (err) {
				throw err;
			}
		});
	});

	afterEach(async () => {
		try {
			sinon.restore();
			await setupTest.resetTestDB();
		} catch (err) {
			throw err;
		}
	});
});