import express from "express";
import {
  createUserAccount,
  authenticateUser,
  logoutUser,
  getCurrentUserProfile,
  updateUserProfile
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import upload from '../utils/multer.js'
import { validateSignup } from "../middlewares/validation.middleware.js";

const router = express.Router();

router.post("/signup", validateSignup, createUserAccount);
router.post("/signin ", authenticateUser);
router.post("/signout", logoutUser);

router.get("/profile", isAuthenticated, getCurrentUserProfile);
router.patch("/profile", isAuthenticated, upload.single("avatar"), updateUserProfile);
export default router;
