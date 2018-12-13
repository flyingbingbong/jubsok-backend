import * as db from 'mongoose';
import { DB_ADDRESS } from '../models';

export default () => {
	db.set('useCreateIndex', true);
	db.connect(DB_ADDRESS, { useNewUrlParser: true });
}