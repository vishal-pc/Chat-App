import express from "express";
import { authenticateToken } from "../middleware/auth";
import multer from "multer";
import bodyParser from "body-parser";
import {
  userRegister,
  userLogin,
  userLogout,
} from "../controller/authControllers";
import {
  sendMessage,
  getMessages,
  updateMessage,
  deleteMessage,
  deleteConversation,
} from "../controller/chatController";
import {
  getUsersForSidebar,
  updateUser,
  deleteUser,
} from "../controller/userController";

const route = express();

// Using body-parser middleware
route.use(bodyParser.json());
route.use(bodyParser.urlencoded({ extended: true }));

// Configure multer for uploading files
const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    const name = Date.now() + "_" + file.originalname;
    cb(null, name);
  },
});

// Uploading files into storage
const upload = multer({ storage: storage });

// Auth Routes
route.post("/register", userRegister);
route.post("/login", userLogin);
route.post("/logout", authenticateToken, userLogout);

// User Routes
route.get("/get-user", authenticateToken, getUsersForSidebar);
route.patch(
  "/update-user",
  upload.single("profilePicture"),
  authenticateToken,
  updateUser
);
route.delete("/delete-user", authenticateToken, deleteUser);

// Chat Routes
route.post("/send-message/:id", authenticateToken, sendMessage);
route.get("/receive-message/:id", authenticateToken, getMessages);
route.put(
  "/update-message/:receiverId/:messageId/:textId",
  authenticateToken,
  updateMessage
);
route.delete(
  "/delete-message/:receiverId/:messageId/:textId",
  authenticateToken,
  deleteMessage
);
route.delete(
  "/delete-all-message/:receiverId/:messageId",
  authenticateToken,
  deleteConversation
);

export default route;
