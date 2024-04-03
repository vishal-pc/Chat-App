import mongoose, { Document, Schema, Types } from "mongoose";

export interface IMessage extends Document {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  message: string;
}

const messageSchema: Schema<IMessage> = new mongoose.Schema(
  {
    senderId: [{ type: mongoose.Types.ObjectId, ref: "User" }],
    receiverId: [{ type: mongoose.Types.ObjectId, ref: "Message" }],
    message: { type: String },
  },
  { timestamps: true }
);

const Message = mongoose.model<IMessage>("Message", messageSchema);

export default Message;
