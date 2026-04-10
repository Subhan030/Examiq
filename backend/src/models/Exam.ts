import mongoose, { Document, Schema } from 'mongoose';

export type ExamState = 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'CLOSED';

export interface IExam extends Document {
  title: string;
  courseId: mongoose.Types.ObjectId;
  duration: number; // in minutes
  totalMarks: number;
  state: ExamState;
  questions: mongoose.Types.ObjectId[];
  publish(): Promise<void>;
  activate(): Promise<void>;
  close(): Promise<void>;
}

const ExamSchema: Schema = new Schema({
  title: { type: String, required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  duration: { type: Number, required: true },
  totalMarks: { type: Number, required: true },
  state: { 
    type: String, 
    enum: ['DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED'], 
    default: 'DRAFT' 
  },
  questions: [{ type: Schema.Types.ObjectId, ref: 'Question' }]
}, { timestamps: true });

// State Pattern Methods
ExamSchema.methods.publish = async function() {
  if (this.state !== 'DRAFT') throw new Error('Only DRAFT exams can be published');
  this.state = 'PUBLISHED';
  return this.save();
};

ExamSchema.methods.activate = async function() {
  if (this.state !== 'PUBLISHED') throw new Error('Only PUBLISHED exams can be activated');
  this.state = 'ACTIVE';
  return this.save();
};

ExamSchema.methods.close = async function() {
  this.state = 'CLOSED';
  return this.save();
};

export const Exam = mongoose.model<IExam>('Exam', ExamSchema);
