import * as chai from 'chai';
import { FriendValidator } from '../';
import { IUserDocument, User } from '../../models';
import * as setupTest from '../../setupTest';

const expect = chai.expect;

describe('friend validator', () => {
	var user: IUserDocument;

	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
			user = new User({
				nickname: 'foo',
				facebookProvider : { id: 'abcd@gmail.com', token: 'token1' },
				gender: 'male',
			});
			await user.save();
		} catch (err) {
			throw err;
		}
	});

	describe('userNotDuplicate', async () => {
		it('should return true', async () => {
			try {
				const res = await FriendValidator.userNotDuplicate.validator([
					(new User())._id, (new User())._id
				]);

				expect(res).to.equal(true);
			} catch (err) {
				throw err;
			}		
		});

		it('should return false', async () => {
			try {
				const user = new User();
				const res = await FriendValidator.userNotDuplicate.validator([
					user._id, user._id
				]);

				expect(res).to.equal(false);
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