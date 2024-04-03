import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/userModel";
import { emailValidate, passwordRegex } from "../utils/helper";
import jwt from "jsonwebtoken";
import { envConfig } from "../config/envConfig";
import { UserType } from "../middleware/auth";

export const userRegister = async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      userName,
      email,
      mobileNumber,
      gender,
      password,
    } = req.body;
    // Validate email format
    if (!emailValidate(email)) {
      return res.status(400).json({
        message: "Invalid email format",
        success: false,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: `User with email ${email} already exists`,
        success: false,
      });
    }
    // Validate password strength
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must have at least 8 characters, including at least one uppercase letter, one lowercase letter, one digit, and one special character (#?!@$%^&*-)",
        success: false,
      });
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      firstName,
      lastName,
      userName,
      email,
      mobileNumber,
      gender,
      password: hashedPassword,
      isOnline: false,
    };

    const userSaved = await User.create(newUser);
    if (userSaved.id) {
      return res
        .status(201)
        .send({ message: "User Register successful", success: true });
    } else {
      return res.status(400).json({
        message: "Something went wrong",
        success: false,
      });
    }
  } catch (error) {
    console.error("Error in register user!", error);
    return res.status(500).json({
      message: "Error in register user!",
      success: false,
    });
  }
};

export const userLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "Invalid credentials", success: false });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      envConfig.Jwt_Secret,
      { expiresIn: "1h" }
    );

    // Update user status to online and active
    await User.findByIdAndUpdate(user._id, {
      isOnline: true,
      isUserActive: true,
    });

    return res
      .status(200)
      .json({ message: "Login successful", token, success: true });
  } catch (error) {
    console.error("Error in user login", error);
    return res
      .status(500)
      .json({ message: "Error in user login", success: false });
  }
};

export const userLogout = async (
  req: Request & { user?: UserType },
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res
        .status(401)
        .json({ message: "User not authenticated", success: false });
    }
    await User.findByIdAndUpdate(userId, {
      isOnline: false,
      isUserActive: false,
    });
    return res
      .status(200)
      .json({ message: "Logout successfull", success: true });
  } catch (error) {
    console.error("Error in user logout", error);
    return res
      .status(500)
      .json({ message: "Error in user logout", success: false });
  }
};
