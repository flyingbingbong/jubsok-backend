import { IValidator } from '../types';

export const ATTR_NOT_EXIST = 'ATTR_NOT_EXIST';

export const required = (message: string): IValidator => ({
	validator: async (v: any): Promise<boolean> => (
		v != null && v != undefined && v != ''
	),
	message
});

const mapValidatorToPromise = async (input: any, validator: IValidator): Promise<void> => {
	try {
		const result: boolean = await validator.validator(input);

		if (!result)
			throw Error(validator.message);
	} catch (err) {
		throw err;
	}
}

export const validateInput = async (
	input: any,
	validationMap: any,
	extraValidators: any={}
): Promise<void> => {
	const attrs = Object.keys(validationMap);
	var toValidate: Array<Promise<void>> = [];
	var i: number = 0;

	for (let attr in input) {
		if (attrs.indexOf(attr) === -1) {
			throw Error(ATTR_NOT_EXIST);
		}
	}
	for (let attr in input) {
		for (let validator of validationMap[attr]) {
			toValidate[i++] = mapValidatorToPromise(input[attr], validator);
		}
		if (extraValidators[attr])
			toValidate[i++] = mapValidatorToPromise(input[attr], extraValidators[attr]);
	}
	try {
		await Promise.all(toValidate);
	} catch (err) {
		throw err;
	}
}