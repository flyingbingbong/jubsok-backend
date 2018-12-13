import { AES } from '../../../utils';

interface IFieldModifier {
	(field: string): (v: any) => void
}

export const encrypt: IFieldModifier = (field: string) => (v: any) => {
	if (v[field])
		v[field] = AES.encrypt(v[field].toString());
}

export const _delete_: IFieldModifier = (field: string) => (v: any) => {
	if (v[field])
		delete v[field];
}

export const doAll = (modifiers: Array<Function>) => {
	return (v: any) => {
		modifiers.forEach(f => f(v))
	}
}