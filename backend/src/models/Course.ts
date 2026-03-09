import mongoose, { Document, Schema } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  description: string;
  instructorId: mongoose.Types.ObjectId;
}

const CourseSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  instructorId: { type: Schema.Types.ObjectId, ref: 'User', required: true }
});

export const Course = mongoose.model<ICourse>('Course', CourseSchema);
