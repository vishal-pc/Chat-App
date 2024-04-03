import mongoose from "mongoose";
import { envConfig } from "./envConfig";

const Db = envConfig.Mongo_Db;

mongoose
  .connect(Db)
  .then(() => console.log("Database Connected...👍️"))
  .catch((err) => console.error("Database not connected...🥱", err));
