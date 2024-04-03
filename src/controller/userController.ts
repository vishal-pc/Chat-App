import { Request, Response } from "express";
import { UserType } from "./../middleware/auth";
import User from "../models/userModel";

export const getUsersForSidebar = async (
  req: Request & { user?: UserType },
  res: Response
) => {
  try {
    const loggedInUserId = req.user?.userId;

    const filteredUsers = await User.find({
      _id: { $ne: loggedInUserId },
    }).select("-password");

    return res.status(200).json({ filteredUsers, success: true });
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error);
    return res
      .status(500)
      .json({ error: "Internal server error", success: false });
  }
};
