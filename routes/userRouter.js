import express from 'express';

import { createUser, loginUser, loginWithGoogle, sendOTP, resetPassword, getUsers } from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.post("/",createUser)
userRouter.post("/login", loginUser)
userRouter.post("/login/google", loginWithGoogle)
userRouter.post("/send-otp", sendOTP)
userRouter.post("/reset-password", resetPassword)
userRouter.get("/", getUsers)

export default userRouter;