import mongoose, { Document, Model, Schema, Types } from "mongoose";

interface IChat extends Document {
  participants: Types.ObjectId[];
  messages: Types.ObjectId[];
}

const ConversationSchema: Schema<IChat> = new mongoose.Schema(
  {
    participants: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    messages: [{ type: mongoose.Types.ObjectId, ref: "Message" }],
  },
  { timestamps: true }
);

const Conversation: Model<IChat> = mongoose.model(
  "Conversation",
  ConversationSchema
);

export default Conversation;
