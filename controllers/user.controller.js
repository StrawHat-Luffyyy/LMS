import { User } from "../models/user.model.js";
import { catchAsync } from "../middlewares/error.middleware.js";
import { generateToken } from "../utils/generateToken.js";
import { uploadMedia } from "../utils/cloudinary.js";
export const createUserAccount = catchAsync(async (req, res, next) => {
  const { name, email, password, role = "student" } = req.body;
  if (!name || !email || !password) {
    return next(new ApiError("Name, email and password are required", 400));
  }
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return next(new ApiError("Email already exists", 400));
  }
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role,
  });

  await user.updateLastActive();
  generateToken(res, user, "User account created successfully");
  res.status(201).json({
    status: "success",
    data: {
      user,
    },
  });
});

export const authenticateUser = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ApiError("Email and password are required", 400));
  }
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    "+password",
  );
  if (!user || !(await user.comparePassword(password))) {
    return next(new ApiError("Invalid email or password", 401));
  }
  await user.updateLastActive();
  generateToken(
    res,
    user,
    `Welcome back ${user.name}! You have been logged in successfully`,
  );
});

export const logoutUser = catchAsync(async (req, res, next) => {
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

export const getCurrentUserProfile = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.id).populate({
    path: "enrolledCourses.course",
    select: "title thumbnail description",
  });
  if (!user) {
    return next(new ApiError("User not found", 404));
  }
  res.status(200).json({
    status: "success",
    data: {
      ...user.toJSON(),
      totalEnrolledCourses: user.totalEnrolledCourses,
    },
  });
});

export const updateUserProfile = catchAsync(async (req, res, next) => {
  const { name, email, bio } = req.body;
  const updateData = {
    name,
    email: email?.toLowerCase(),
    bio,
  };
  if (req.file) {
    const avatarResult = await uploadMedia(req.file.path);
    updateData.avatar = avatarResult.secure_url;
  }
  //Delete old avatar from cloudinary if new avatar is uploaded
  const user = await User.findById(req.id);
  if (user.avatar && user.avatar !== "default-avatar.png") {
    await deleteMediaFromCloudinary(user.avatar);
  }
  const updatedUser = await User.findByIdAndUpdate(req.id, updateData, {
    new: true,
    runValidators: true,
  });
  if (!updatedUser) {
    return next(new ApiError("User not found", 404));
  }
  res.status(200).json({
    status: "success",
    message: "Profile updated successfully",
    data: {
      ...updatedUser.toJSON(),
      totalEnrolledCourses: updatedUser.totalEnrolledCourses,
    },
  });
});
