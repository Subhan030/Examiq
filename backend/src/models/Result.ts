import mongoose, { Document, Schema } from 'mongoose';

export interface IResult extends Document {
  studentId: mongoose.Types.ObjectId;
  examId: mongoose.Types.ObjectId;
  score: number;
  totalMarks: number;
  status: 'Pass' | 'Fail';
  answersDetail: any[];
}

const ResultSchema: Schema = new Schema({
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
  score: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  status: { type: String, enum: ['Pass', 'Fail'], required: true },
  answersDetail: { type: [Schema.Types.Mixed], default: [] }
}, { timestamps: true });

export const Result = mongoose.model<IResult>('Result', ResultSchema);
