import express from 'express';
import { 
    createUser, 
    loginUser, 
    loginWithGoogle, 
    sendOTP, 
    resetPassword, 
    getUsers,
    updateUserRole,
    toggleUserBlock,
    deleteUser,
    getUserById,
    checkUserBlocked
} from '../controllers/userController.js';

const userRouter = express.Router();

// Public routes (no authentication needed)
userRouter.post("/", createUser);
userRouter.post("/login", loginUser);
userRouter.post("/login/google", loginWithGoogle);
userRouter.post("/send-otp", sendOTP);
userRouter.post("/reset-password", resetPassword);
// Add this route
userRouter.post("/check-blocked", checkUserBlocked);

// Protected routes (these will check admin status inside the controller functions)
userRouter.get("/", getUsers);              // Already has isAdmin check
userRouter.get("/:userId", getUserById);     // Add this - get single user details
userRouter.put("/:userId/role", updateUserRole);     // Update user role
userRouter.put("/:userId/block", toggleUserBlock);   // Block/unblock user
userRouter.delete("/:userId", deleteUser);            // Delete user


export default userRouter;