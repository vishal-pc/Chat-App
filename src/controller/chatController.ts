import { Request, Response } from "express";
import Conversation from "../models/conversationModel";
import Message, { IMessage } from "../models/messageModel";
import { UserType } from "./../middleware/auth";
import { getReceiverSocketId, io } from "../socket/socket";
import mongoose from "mongoose";

// Send Message Api
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
        isDeletedForSender: false,
      });
      await existingMessage.save();
    } else {
      const newMessage = new Message({
        senderId,
        receiverId,
        messages: [
          {
            text,
            createdAt: new Date(),
            updatedAt: new Date(),
            isDeletedForSender: false,
          },
        ],
        isChatDeleted: false,
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

// Update Chat Message Api
export const updateMessage = async (
  req: Request & { user?: UserType },
  res: Response
) => {
  try {
    const { receiverId, messageId, textId } = req.params;
    const { text } = req.body;
    const senderId = req.user?.userId;

    // Validate if receiverId, messageId, and textId are valid ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(receiverId) ||
      !mongoose.Types.ObjectId.isValid(messageId) ||
      !mongoose.Types.ObjectId.isValid(textId)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid parameters", success: false });
    }

    // Use aggregation pipeline to update the specific message text
    const result = await Message.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(messageId),
          senderId: new mongoose.Types.ObjectId(senderId),
          receiverId: new mongoose.Types.ObjectId(receiverId),
        },
      },
      {
        $project: {
          messages: {
            $map: {
              input: "$messages",
              as: "msg",
              in: {
                $cond: [
                  { $eq: ["$$msg._id", new mongoose.Types.ObjectId(textId)] },
                  {
                    $mergeObjects: [
                      "$$msg",
                      { text: text, updatedAt: new Date() },
                    ],
                  },
                  "$$msg",
                ],
              },
            },
          },
        },
      },
      {
        $set: { updatedAt: new Date() },
      },
    ]);

    if (result.length === 0) {
      return res
        .status(404)
        .json({ message: "Message not found", success: false });
    }

    // Save the updated document
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      result[0],
      { new: true }
    );

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("updateMessage", text);
    }

    return res.status(200).json({
      message: "Message updated",
      success: true,
      data: updatedMessage,
    });
  } catch (error) {
    console.error("Error in updating message", error);
    return res
      .status(500)
      .json({ message: "Error in updating message", success: false });
  }
};

// Delete Chat Message Api
export const deleteMessage = async (
  req: Request & { user?: UserType },
  res: Response
) => {
  try {
    const { receiverId, messageId, textId } = req.params;
    const { deleteOption } = req.query;
    const senderId = req.user?.userId;

    // Validate if receiverId, messageId, and textId are valid ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(receiverId) ||
      !mongoose.Types.ObjectId.isValid(messageId) ||
      !mongoose.Types.ObjectId.isValid(textId)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid parameters", success: false });
    }

    // Find the message by ID
    const message = await Message.findById(messageId);

    if (!message) {
      return res
        .status(404)
        .json({ message: "Message not found", success: false });
    }

    // Check if the sender is the owner of the message
    if (message.senderId.toString() !== senderId) {
      return res.status(403).json({
        message: "You are not authorized to delete this message",
        success: false,
      });
    }

    // Find the specific message text in the messages array
    const messageText = message.messages.find(
      (msg: any) => msg._id.toString() === textId
    );

    if (!messageText) {
      return res
        .status(404)
        .json({ message: "Message text not found", success: false });
    }

    // Perform different actions based on the deleteOption
    switch (deleteOption) {
      case "deleteforme":
        // Update isDeletedForSender field of the specific message text
        messageText.isDeletedForSender = true;
        await message.save();
        break;
      case "deleteforeveryone":
        // Remove the specific message text from the messages array
        message.messages = message.messages.filter(
          (msg: any) => msg._id.toString() !== textId
        );
        await message.save();
        break;
      default:
        return res
          .status(400)
          .json({ message: "Invalid delete option", success: false });
    }

    return res
      .status(200)
      .json({ message: "Message operation completed", success: true });
  } catch (error) {
    console.error("Error in performing message operation", error);
    return res.status(500).json({
      message: "Error in performing message operation",
      success: false,
    });
  }
};

// Delete Message Api
export const deleteConversation = async (
  req: Request & { user?: UserType },
  res: Response
) => {
  try {
    const { receiverId, messageId } = req.params;
    const senderId = req.user?.userId;
    if (
      !mongoose.Types.ObjectId.isValid(receiverId) ||
      !mongoose.Types.ObjectId.isValid(messageId)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid parameters", success: false });
    }

    const message = await Message.findByIdAndUpdate(
      messageId,
      { $set: { isChatDeleted: true } },
      { new: true }
    );
    if (!message) {
      return res
        .status(404)
        .json({ message: "Message not found", success: false });
    }
    if (message.senderId.toString() !== senderId) {
      return res.status(403).json({ message: "Unauthorized", success: false });
    }
    return res.status(200).json({ message: "Message deleted", success: true });
  } catch (error) {
    console.error("Error in performing message operation", error);
    return res.status(500).json({
      message: "Error in performing message operation",
      success: false,
    });
  }
};

// Get Messages Api
// export const getMessages = async (
//   req: Request & { user?: UserType },
//   res: Response
// ) => {
//   try {
//     const { id: userToChatId } = req.params;
//     const senderId = req.user?.userId;

//     const conversation = await Conversation.findOne({
//       participants: { $all: [senderId, userToChatId] },
//     }).populate("messages");

//     if (!conversation) return res.status(200).json([]);

//     // Filter messages based on conditions
//     const typedConversation = conversation as Conversation;
//     const messages = typedConversation.messages.filter(
//       (message: typeof Message) =>
//         !(message.senderId.includes(senderId) && message.isDeletedForSender) &&
//         !typedConversation.isChatDeleted
//     );

//     return res.status(200).json({ messages, success: true });
//   } catch (error) {
//     console.error("Error in get message", error);
//     return res
//       .status(500)
//       .json({ message: "Error in get message", success: false });
//   }
// };
