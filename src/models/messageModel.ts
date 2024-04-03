import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessage extends Document {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  messages: { text: string; createdAt: Date; updatedAt: Date }[];
}

const messageSchema: Schema<IMessage> = new mongoose.Schema(
  {
    senderId: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    receiverId: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    messages: [
      {
        text: { type: String },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Message = mongoose.model<IMessage>("Message", messageSchema);

export default Message;
