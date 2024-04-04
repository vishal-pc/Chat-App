import mongoose, { Document, Model, Schema } from "mongoose";

interface IUser extends Document {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
  password: string;
  mobileNumber: number;
  gender: string;
  isOnline: boolean;
  isUserActive: boolean;
  profilePicture: string;
  setBio: string;
  isBlocked: boolean;
}

const UserSchema: Schema<IUser> = new mongoose.Schema(
  {
    firstName: { type: String },
    lastName: { type: String },
    userName: { type: String },
    email: { type: String },
    password: { type: String },
    mobileNumber: { type: Number },
    gender: { type: String },
    isOnline: { type: Boolean, default: false },
    isUserActive: { type: Boolean, default: false },
    profilePicture: { type: String },
    setBio: { type: String },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.model<IUser>("User", UserSchema);
export default User;
