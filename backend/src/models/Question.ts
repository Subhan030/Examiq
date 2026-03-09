import mongoose, { Document, Schema } from 'mongoose';

export interface IQuesion extends Document {
  type: 'MCQ' | 'TF' | 'Subjective';
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  content: string;
  metadata: any; // e.g. options for MCQ, expected keywords for Subjective
}

const QuestionSchema: Schema = new Schema({
  type: { type: String, enum: ['MCQ', 'TF', 'Subjective'], required: true },
  category: { type: String, required: true },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  content: { type: String, required: true },
  metadata: { type: Schema.Types.Mixed }
});

export const QuestionModel = mongoose.model<IQuesion>('Question', QuestionSchema);
