import { SchemaTypeOpts } from 'mongoose';

export interface IValidateMsgProps {
	path: string,
	value: any
}

export interface IValidator {
	validator(v: any): Promise<boolean>,
	message: string
}