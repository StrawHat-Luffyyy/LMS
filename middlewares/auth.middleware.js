import {catchAsync } from "../middlewares/error.middleware.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";


export const isAuthenticated = catchAsync(async (req, res, next) => {

  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return next(new ApiError("You are not logged in! Please log in to get access.", 401));
  }
  try{
    const decoded = jwt.verify(token, process.env.SECRET_KEY);
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ApiError("The user belonging to this token does no longer exist.", 401));
    }
    req.user = user;
    next();
  }catch(err){
    return next(new ApiError("Invalid token. Please log in again!", 401));
  }

})