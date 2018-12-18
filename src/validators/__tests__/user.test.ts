import * as chai from 'chai';
import { UserValidator } from '../';
import { IUserDocument, User } from '../../models';
import * as setupTest from '../../setupTest';
import { IValidator } from '../../types';

const expect = chai.expect;

describe('user validator', () => {
	beforeEach(async () => {
		try {
			await setupTest.setupTestDB();
		} catch (err) {
			throw err;
		}
	});

	describe('nickname', () => {
		var user: IUserDocument;
		const alreadyUsedNickname = 'alreadyUsedNickname';

		beforeEach(async () => {
			try {
				user = new User({
					nickname: alreadyUsedNickname,
					facebookProvider : { id: 'abcd@gmail.com', token: 'token1' },
				});
				await user.save();
			} catch (err) {
				throw err;
			}
		});

		describe('nicknameRegex', () => {
			const nicknameRegex: IValidator = UserValidator.nicknameRegex;

			it('should return true', async () => {
				try {
					const nickname: string = 'injulmi';
					const result: boolean = await nicknameRegex.validator(nickname);
		
					expect(result).to.equal(true);
				} catch (err) {
					throw (err);
				}
			});

			it('should return false', async () => {
				try {
					const nickname: string = 'nick-name';
					const result: boolean = await UserValidator.nicknameRegex.validator(nickname);
	
					expect(result).to.equal(false);
				} catch (err) {
					throw (err);
				}
			});
		})

		describe('nicknameUnique', () => {
			const nicknameUnique: IValidator = UserValidator.nicknameUnique;

			it('should return false when nickname is already used', async () => {
				try {
					const result: boolean = await nicknameUnique.validator(
						alreadyUsedNickname
					);
	
					expect(result).to.equal(false);
				} catch (err) {
					throw (err);
				}
			});	
		});
		
		describe('nicknameNeverModified', () => {
			const nicknameNeverModified: Function = UserValidator.nicknameNeverModified;

			it('should return false when nickname modified', async () => {
				try {
					const result: boolean = await nicknameNeverModified(user)
						.validator('newNickname');
	
					expect(result).to.equal(false);
				} catch (err) {
					throw (err);
				}
			});
		});
	});

	describe('gender', () => {
		var user: IUserDocument;

		beforeEach(async () => {
			try {
				user = new User({
					facebookProvider : { id: 'abcd@gmail.com', token: 'token1' },
					gender: 'male'
				});
				await user.save();
			} catch (err) {
				throw err;
			}
		});

		describe('genderNeverModified', () => {
			const genderNeverModified: Function = UserValidator.genderNeverModified;

			it('should return false when nickname modified', async () => {
				try {
					const result: boolean = await genderNeverModified(user)
						.validator('female');
	
					expect(result).to.equal(false);
				} catch (err) {
					throw (err);
				}
			});
		})
	})

	describe('weeklyTaste', () => {
		it('should return false when weeklyTaste includes invalidate value', async () => {
			try {
				const result: boolean = await UserValidator.weeklyTastesVal.validator([0, 0, 2]);

				expect(result).to.equal(false);
			} catch (err) {
				throw err;
			}
		})
	});

	describe('favoritesNotDuplicate', async () => {
		it('should return true', async () => {
			try {
				const result: boolean = await UserValidator.favoritesNotDuplicate.validator(
					[ { content: 'foo', point: 5 }, { content: 'bar', point: 5 } ]
				);

				expect(result).to.equal(true);
			} catch (err) {
				throw err;
			}
		});

		it('should return false', async () => {
			try {
				const result: boolean = await UserValidator.favoritesNotDuplicate.validator(
					[ { content: 'foo', point: 5 }, { content: 'foo', point: 1 } ]
				);

				expect(result).to.equal(false);
			} catch (err) {
				throw err;
			}
		});
	});

	describe('favoritesSorted', () => {
		it('should return true', async () => {
			try {
				const result: boolean = await UserValidator.favoritesSorted.validator(
					[
						{ content: 'foo', point: 5 },
						{ content: 'foo', point: 4 },
						{ content: 'foo', point: 3 },
						{ content: 'foo', point: 3 },
						{ content: 'foo', point: 2 },
					]
				);

				expect(result).to.equal(true);
			} catch (err) {
				throw err;
			}
		});

		it('should return false', async () => {
			try {
				const result: boolean = await UserValidator.favoritesSorted.validator(
					[
						{ content: 'foo', point: 2 },
						{ content: 'foo', point: 3 },
						{ content: 'foo', point: 1 },
						{ content: 'foo', point: 5 },
						{ content: 'foo', point: 3 },
					]
				);

				expect(result).to.equal(false);
			} catch (err) {
				throw err;
			}
		});
	})

	describe('favoritesContentRegex & interestsContentRegex', () => {
		it('should return true', async () => {
			try {
				const valid: Array<any> = [
					{ content: '오' },
					{ content: '오 박사' },
					{ content: '오박사' },
					{ content: '오  박사' },
				];
				const invalid: Array<any> = [
					{ content: ' 오' },
					{ content: '  오' },
					{ content: '오 ' },
					{ content: '오  ' },
					{ content: ' 오박사' },
					{ content: '오박사 ' },
					{ content: '오  박사 ' },
				];
				for (let s of valid) {
					expect(await UserValidator.favoritesContentRegex.validator([s]))
						.to.equal(true);
					expect(await UserValidator.interestsContentRegex.validator([s.content]))
						.to.equal(true);
				}
				for (let s of invalid) {
					expect(await UserValidator.favoritesContentRegex.validator([s]))
						.to.equal(false);
					expect(await UserValidator.interestsContentRegex.validator([s.content]))
						.to.equal(false);
				}
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
	});
});