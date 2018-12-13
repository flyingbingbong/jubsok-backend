import * as chai from 'chai';
import * as db from 'mongoose';
import { Notice, INoticeDocument } from '../';
import * as setupTest from '../../setupTest';

const expect = chai.expect;

describe('Notice model', () => {
	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
		} catch (err) {
			throw err;
		}
	});

	it('should save notice', async () => {
		try {
			var notice: INoticeDocument;

			notice = new Notice({
				content: 'update release'
			});

			await notice.save();
			expect(notice.createdAt).to.be.an.instanceof(Date);
		} catch (err) {
			throw err;
		}
	});

	it('should not save notice', async () => {
		try {
			var notice: INoticeDocument;

			notice = new Notice({
				content: ''
			});

			await notice.save();
			throw Error;
		} catch (err) {
			expect(err.name).to.equal('ValidationError');
		}
	});

	afterEach(async () => {
		try {
			await setupTest.resetTestDB();
		} catch (err) {
			throw err;
		}
	});
});
