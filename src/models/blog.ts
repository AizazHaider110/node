import mongoose, { Schema, Document } from 'mongoose';

interface IBlog extends Document {
  title: string;
  snippet: string;
  body: string;
  createdAt: Date;
  updatedAt: Date;
  author: mongoose.Schema.Types.ObjectId;
}

const blogSchema = new Schema<IBlog>({
  title: {
    type: String,
    required: true
  },
  snippet: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  author: {type: Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model<IBlog>('Blog', blogSchema);