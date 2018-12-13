import { connection, Model, Schema, Document } from 'mongoose';
import { IWeeklyTaste } from '../types';
import { WeeklyTasteValidator } from '../validators';

export interface IWeeklyTasteDocument extends IWeeklyTaste, Document {};
export interface IWeeklyTasteModel extends Model<IWeeklyTasteDocument> {
	getRecent(): Promise<Array<Array<string>>>,
};

const WeeklyTasteSchema: Schema = new Schema({
	list: {
		type: [ [ String ] ],
		validate: [
			WeeklyTasteValidator.listLength,
			WeeklyTasteValidator.groupLength,
		]
	}
},
{
	timestamps: { createdAt: true, updatedAt: false }
});

WeeklyTasteSchema.statics.getRecent = async (): Promise<Array<Array<string>>> => {
	try {
		var recent: IWeeklyTasteDocument;

		recent = await WeeklyTaste.findOne().sort({ createdAt: -1 });
		if (recent)
			return recent.list;
		return [];
	} catch (err) {
		throw err;
	}
}

export const WeeklyTaste:IWeeklyTasteModel =
	connection.model<IWeeklyTasteDocument, IWeeklyTasteModel>('weekly_tastes', WeeklyTasteSchema);
