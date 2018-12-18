import { connection, Model, Schema, Document, Types } from 'mongoose';
import { IWord } from '../types';

export interface IWordDocument extends IWord, Document {};
export interface IWordModel extends Model<IWordDocument> {
	getByText(
		text: string,
		page: number,
		pageSize: number,
		extraMatch: any
	): Promise<Array<IWordDocument>>
};

const WordSchema: Schema = new Schema({
	content: { type: String, unique: true },
	freq: { type: Number, default: 1}
});

WordSchema.statics.getByText = async function(
	text: string,
	page: number,
	pageSize: number,
	extraMatch: any = {}
): Promise<Array<IWordDocument>> {
	try {
		return await this
			.find(
				{
					content: { $regex: `.*${text}.*` },
					...extraMatch
				},
				{ _id: 0, content: 1 }
			)
			.sort({ freq: -1, _id: -1 })
			.skip((page - 1) * pageSize)
			.limit(pageSize);
	} catch (err) {
		throw err;
	}
}

export const Word: IWordModel =
	connection.model<IWordDocument, IWordModel>('words', WordSchema);