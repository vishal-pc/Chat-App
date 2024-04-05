import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IChat extends Document {
  participants: Types.ObjectId[];
  messages: Types.ObjectId[];
  isChatDeleted: boolean;
}

const ConversationSchema: Schema<IChat> = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    messages: [{ type: mongoose.Types.ObjectId, ref: "Message" }],
    isChatDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Conversation: Model<IChat> = mongoose.model(
  "Conversation",
  ConversationSchema
);

export default Conversation;
