import express from "express";
import { authenticateToken } from "../middleware/auth";
import {
  userRegister,
  userLogin,
  userLogout,
} from "../controller/authControllers";
import { sendMessage, getMessages } from "../controller/chatController";
import { getUsersForSidebar } from "../controller/userController";

const route = express();

route.post("/register", userRegister);
route.post("/login", userLogin);
route.post("/logout", authenticateToken, userLogout);

route.get("/getUser", authenticateToken, getUsersForSidebar);

route.post("/send/:id", authenticateToken, sendMessage);
route.get("/receive/:id", authenticateToken, getMessages);

export default route;
