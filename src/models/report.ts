import { connection, Model, Schema, Document } from 'mongoose';
import { IReport } from '../types';

export interface IReportDocument extends IReport, Document {};
export interface IReportModel extends Model<IReportDocument> {};

const ReportSchema: Schema = new Schema({
	chatRoom: { type: Schema.Types.ObjectId, required: true },
	from: { type: Schema.Types.ObjectId, required: true },
	content: { type: String, required: true },
	roomKey: { type: String, required: true }
},
{
	timestamps: { createdAt: true, updatedAt: false }
});

export const Report: IReportModel =
	connection.model<IReportDocument, IReportModel>('reports', ReportSchema);
