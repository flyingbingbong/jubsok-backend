import * as chai from 'chai';
import { required, validateInput, ATTR_NOT_EXIST } from '../';

const expect = chai.expect;

describe('base validator', () => {
	var validationMap: any;

	beforeEach(() => {
		validationMap = {
			nickname: [
				required('nickname not exist')
			],
			interests: [{
				validator: async (v: Array<string>): Promise<boolean> => (
					Promise.resolve(v.length < 3)
				),
				message: 'interests too many'
			}],
			favorites: [
				required('favorites not exist')
			]
		}
	});
	
	it('should return correct value when required value is not empty', async () => {
		try {
			const validator = required('foo');
			const result1 = await validator.validator('bar');
			const result2 = await validator.validator('');

			expect(result1).to.equal(true);
			expect(result2).to.equal(false);
		} catch (err) {
			throw err;
		}
	});

	it('should not throw error when input is validate', async () => {
		try {
			const input = {
				nickname: 'foo',
				interests: ['bar', 'boo']
			};
		
			await validateInput(input, validationMap);
		} catch (err) {
			throw err;
		}
	});

	it('should throw error when input attr is not exist', async () => {
		try {
			const input = {
				nickname: 'foo',
				interests: ['bar', 'boo', 'rab'],
				email: 'email@email.com'
			};
			
			try {
				await validateInput(input, validationMap)
				throw Error;
			} catch (err) {
				expect(err.message).to.equal(ATTR_NOT_EXIST);
			}
		} catch (err) {
			throw err;
		}
	});

	it('should throw error when input is invalidate', async () => {
		try {
			const input = {
				nickname: 'foo',
				interests: ['bar', 'boo', 'rab'],
			};
			
			try {
				await validateInput(input, validationMap);
				throw Error;
			} catch (err) {
				expect(err.message).to.equal(validationMap.interests[0].message);
			}
		} catch (err) {
			throw err;
		}
	});

	it('should throw error when extra callback is invalidate', async () => {
		const errorName = 'Regex Match Error';
		try {
			const input = {
				nickname: 'fo o',
				interests: ['bar', 'boo']
			};
			const extraCallbacks = {
				nickname: {
					validator: async (v: string): Promise<boolean> => (
						Promise.resolve(/^[a-zA-Z가-힣0-9_]+$/.test(v))
					),
					message: errorName
				}
			}

			try {
				await validateInput(input, validationMap, extraCallbacks);
				throw Error;
			} catch (err) {
				expect(err.message).to.equal(errorName);
			}
		} catch (err) {
			throw err;
		}
	});
});