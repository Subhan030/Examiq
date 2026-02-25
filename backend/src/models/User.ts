import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  role: 'Admin' | 'Examiner' | 'Student';
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Admin', 'Examiner', 'Student'], default: 'Student' }
});

export const User = mongoose.model<IUser>('User', UserSchema);
