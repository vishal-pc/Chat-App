import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { envConfig } from "../config/envConfig";

export interface UserType {
  userId: string;
}

interface CustomRequest extends Request {
  user?: UserType;
}

const authenticateToken = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res
      .status(401)
      .json({ message: "Authorization header not found", success: false });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ message: "You are not authenticated", success: false });
  }
  try {
    const decodedToken = jwt.verify(token, envConfig.Jwt_Secret);
    if (typeof decodedToken !== "object" || decodedToken === null) {
      return res.status(401).json({ message: "Invalid token", success: false });
    }

    req.user = decodedToken as UserType;
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "You are not authenticated", success: false });
  }
};

export { authenticateToken, CustomRequest };
