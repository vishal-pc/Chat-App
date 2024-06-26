import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessage extends Document {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  messages: Array<{
    text: string;
    createdAt: Date;
    updatedAt: Date;
    isDeletedForSender: boolean;
  }>;
}

const messageSchema: Schema<IMessage> = new mongoose.Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
    receiverId: { type: Schema.Types.ObjectId, ref: "User" },
    messages: [
      {
        text: { type: String },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        isDeletedForSender: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

const Message = mongoose.model<IMessage>("Message", messageSchema);

export default Message;
