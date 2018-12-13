import * as db from 'mongoose';
import { DB_ADDRESS } from '../models';

export const setupTestDB = async (): Promise<any> => {
	try {
		db.connection.models = {};
		db.set('useCreateIndex', true);
		await db.connect(DB_ADDRESS, { useNewUrlParser: true });
	} catch (err) {
		throw err;
	}
}

export const resetTestDB = async (): Promise<any> => {
	try {
		var collections = Object.keys(db.connection.collections);

		for (let c of collections) {
			db.connection.collections[c].deleteMany({});
		}
		await db.disconnect();
	} catch (err) {
		throw err;
	}
}