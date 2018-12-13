import { connection, Model, Schema, Document } from 'mongoose';
import { INotice } from '../types';

export interface INoticeDocument extends INotice, Document {};
export interface INoticeModel extends Model<INoticeDocument> {};

const NoticeSchema: Schema = new Schema({
	content: { type: String, required: true },
	show: { type: Boolean, default: true },
},
{
	timestamps: { createdAt: true, updatedAt: false }
});

export const Notice: INoticeModel =
	connection.model<INoticeDocument, INoticeModel>('notices', NoticeSchema);
