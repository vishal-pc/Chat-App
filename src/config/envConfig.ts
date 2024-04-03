import * as dotenv from "dotenv";
dotenv.config();

export interface EnvConfig {
  Port: number;
  Mongo_Db: string;
  Express_Secret: string;
  Jwt_Secret: string;
  Send_Otp: string;
}

export const envConfig: EnvConfig = {
  Port: process.env.Port ? parseInt(process.env.Port, 10) : 5000,
  Mongo_Db: process.env.Mongo_Uri || "localhost",
  Express_Secret: process.env.Express_Secret || "defaultSecret",
  Jwt_Secret: process.env.Jwt_Secret || "defaultSecret",
  Send_Otp: process.env.Send_Otp || "defaultSecret",
};
