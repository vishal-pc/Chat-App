import { Request, Response } from "express";
import Conversation from "../models/conversationModel";
import Message from "../models/messageModel";
import { UserType } from "./../middleware/auth";
import { getReceiverSocketId, io } from "../socket/socket";

export const sendMessage = async (
  req: Request & { user?: UserType },
  res: Response
) => {
  try {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user?.userId;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        messages: [],
      });
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      message,
    });

    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }

    // this will run in parallel
    await Promise.all([conversation.save(), newMessage.save()]);

    // SOCKET IO FUNCTIONALITY WILL GO HERE
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      // io.to(<socket_id>).emit() used to send events to specific client
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.status(201).json({ newMessage, success: true });
  } catch (error) {
    console.error("Error in sending message", error);
    return res
      .status(500)
      .json({ message: "Error in sending message", success: false });
  }
};

export const getMessages = async (
  req: Request & { user?: UserType },
  res: Response
) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user?.userId;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] },
    }).populate("messages");

    if (!conversation) return res.status(200).json([]);

    const messages = conversation.messages;

    return res.status(200).json({ messages, success: true });
  } catch (error) {
    console.error("Error in get message", error);
    return res
      .status(500)
      .json({ message: "Error in get message", success: false });
  }
};
