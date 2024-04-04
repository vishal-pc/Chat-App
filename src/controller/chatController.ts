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

// Get Messages Api
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
    const { deleteForMe, deleteForEveryone } = req.query;
    const senderId = req.user?.userId;

    console.log("Sender Id: " + senderId);
    console.log("Reciver Id: " + receiverId);
    console.log("Message Id: " + messageId);
    console.log("Text Id: " + textId);
    console.log("deleteForMe: " + deleteForMe);
    console.log("deleteForEveryone: " + deleteForEveryone);

    // Validate if receiverId, messageId, and textId are valid ObjectIds
    if (
      !mongoose.Types.ObjectId.isValid(receiverId as string) ||
      !mongoose.Types.ObjectId.isValid(messageId as string) ||
      !mongoose.Types.ObjectId.isValid(textId as string)
    ) {
      return res
        .status(400)
        .json({ message: "Invalid parameters", success: false });
    }

    // Fetch the message data from the database
    const message = await Message.findById(messageId);
    if (!message) {
      return res
        .status(404)
        .json({ message: "Message not found", success: false });
    }
    console.log("Fetched Message:", message);
    // Check if the sender is authorized to delete the message
    if (message.senderId.toString() !== senderId) {
      return res.status(403).json({
        message: "Unauthorized to delete this message",
        success: false,
      });
    }

    // Use aggregation pipeline to update or delete the specific message text
    let updateQuery: any[] = [];
    if (deleteForEveryone === "true") {
      console.log("Deleting message for everyone");
      // Delete the message text completely
      updateQuery = [
        {
          $match: { _id: new mongoose.Types.ObjectId(messageId as string) },
        },
        {
          $set: {
            messages: message.messages.filter(
              (msg: any) => msg._id.toString() == textId
            ),
            updatedAt: new Date(),
          },
        },
      ];
    } else if (deleteForMe === "true") {
      console.log("Deleting message for me only");
      // Update the message to mark it as deleted for the sender only
      updateQuery = [
        {
          $match: { _id: new mongoose.Types.ObjectId(messageId as string) },
        },
        {
          $set: {
            "messages.$[elem].isDeletedForSender": true,
            updatedAt: new Date(),
          },
        },
        {
          $set: {
            messages: {
              $map: {
                input: "$messages",
                as: "msg",
                in: {
                  $mergeObjects: [
                    "$$msg",
                    {
                      $cond: {
                        if: {
                          $eq: [
                            "$$msg._id",
                            new mongoose.Types.ObjectId(textId as string),
                          ],
                        },
                        then: { isDeletedForSender: true }, // Set isDeletedForSender to true
                        else: "$$msg", // Keep the existing message properties
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      ];
    }
    console.log("Update Query:", updateQuery);

    const result = await Message.aggregate(updateQuery);

    // Optionally, emit an event to notify receivers if needed
    const receiverSocketId = getReceiverSocketId(receiverId as string);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("deleteMessage", textId as string);
    }

    return res.status(200).json({
      message: "Message deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error in deleting message", error);
    return res
      .status(500)
      .json({ message: "Error in deleting message", success: false });
  }
};
