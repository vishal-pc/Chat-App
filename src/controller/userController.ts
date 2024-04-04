import { Request, Response } from "express";
import { UserType } from "./../middleware/auth";
import User from "../models/userModel";
import { v2 as cloudinary } from "cloudinary";
import { envConfig } from "../config/envConfig";

cloudinary.config({
  cloud_name: envConfig.CLOUDINARY_CLOUD_NAME,
  api_key: envConfig.CLOUDINARY_API_KEY,
  api_secret: envConfig.CLOUDINARY_API_SECRET,
});

// Get User For Side Bar
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
      .json({ message: "Error in getUsersForSidebar", success: false });
  }
};

// Update User Details
export const updateUser = async (
  req: Request & { user?: UserType },
  res: Response
) => {
  try {
    const loggedInUserId = req.user?.userId;

    const updatedUser = req.body;
    const file = req.file;
    const tempPath = file?.path;

    let secure_url: string | null = null;

    if (tempPath) {
      const uploadResult = await cloudinary.uploader.upload(tempPath);
      secure_url = uploadResult.secure_url;
    }
    if (secure_url) {
      updatedUser.profilePicture = secure_url;
    }
    const updateUserData = await User.findByIdAndUpdate(
      loggedInUserId,
      updatedUser,
      { new: true }
    );
    if (!updateUserData?._id) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
    return res.status(200).json({ updatedUser, success: true });
  } catch (error) {
    console.error("Error in updateUser: ", error);
    return res
      .status(500)
      .json({ message: "Error in updateUser", success: false });
  }
};

// Delete User Details
export const deleteUser = async (
  req: Request & { user?: UserType },
  res: Response
) => {
  try {
    const loggedInUserId = req.user?.userId;

    const deletedUser = await User.findByIdAndDelete(loggedInUserId);
    if (!deletedUser?._id) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    return res
      .status(200)
      .json({ message: "You Profile is deleted", success: true });
  } catch (error) {
    console.error("Error in deleteUser ", error);
    return res
      .status(500)
      .json({ message: "Error in deleteUser", success: false });
  }
};
