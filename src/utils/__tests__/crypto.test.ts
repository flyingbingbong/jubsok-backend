import * as chai from 'chai';
import { AES } from '../';
import * as setupTest from '../../setupTest';

const expect = chai.expect;

describe('crypto', () => {
	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
		} catch (err) {
			throw err;
		}
	});

	describe('AES', async () => {
		it('should encrypt and decrypt', async () => {
			try {
				const text: string = 'hello world';
				var encrypted: string = AES.encrypt(text);

				expect(AES.decrypt(encrypted)).to.equal(text);
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
	})
});
