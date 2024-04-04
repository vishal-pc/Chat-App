import * as dotenv from "dotenv";
dotenv.config();

export interface EnvConfig {
  Port: number;
  Mongo_Db: string;
  Express_Secret: string;
  Jwt_Secret: string;
  Send_Otp: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
}

export const envConfig: EnvConfig = {
  Port: process.env.Port ? parseInt(process.env.Port, 10) : 5000,
  Mongo_Db: process.env.Mongo_Uri || "localhost",
  Express_Secret: process.env.Express_Secret || "defaultSecret",
  Jwt_Secret: process.env.Jwt_Secret || "defaultSecret",
  Send_Otp: process.env.Send_Otp || "defaultSecret",
  CLOUDINARY_CLOUD_NAME: process.env.Cloudnary_Cloud_Name || "defaultSecret",
  CLOUDINARY_API_KEY: process.env.Cloudnary_Api_Key || "defaultSecret",
  CLOUDINARY_API_SECRET: process.env.Cloudnary_Secret_key || "defaultSecret",
};
