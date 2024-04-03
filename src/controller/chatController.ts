import { Request, Response } from "express";
import Conversation from "../models/conversationModel";
import Message, { IMessage } from "../models/messageModel";
import { UserType } from "./../middleware/auth";
import { getReceiverSocketId, io } from "../socket/socket";

// Send message api
export const sendMessage = async (
  req: Request & { user?: UserType },
  res: Response
) => {
  try {
    const { text } = req.body;
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

    let existingMessage: IMessage | null = null;
    for (const msgId of conversation.messages) {
      const msg = await Message.findById(msgId);
      if (
        msg?.senderId.toString() === senderId &&
        msg?.receiverId.toString() === receiverId
      ) {
        existingMessage = msg;
        break;
      }
    }

    if (existingMessage) {
      existingMessage.messages.push({
        text,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await existingMessage.save();
    } else {
      const newMessage = new Message({
        senderId,
        receiverId,
        messages: [{ text, createdAt: new Date(), updatedAt: new Date() }],
      });

      conversation.messages.push(newMessage._id);
      await Promise.all([conversation.save(), newMessage.save()]);
    }

    // Fetch the conversation data with populated fields
    const populatedConversation = await Conversation.findById(conversation._id)
      .populate("participants", "_id username")
      .populate({
        path: "messages",
        populate: [
          { path: "senderId", select: "_id username" },
          { path: "receiverId", select: "_id username" },
        ],
      });

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", text);
    }

    return res
      .status(201)
      .json({ conversation: populatedConversation, success: true });
  } catch (error) {
    console.error("Error in sending message", error);
    return res
      .status(500)
      .json({ message: "Error in sending message", success: false });
  }
};

// Get messages api
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
