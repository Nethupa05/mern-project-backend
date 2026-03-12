// routes/contactRoutes.js
import express from "express"
import { 
    sendMessage, 
    getMessages, 
    getMessageById,
    markAsRead, 
    deleteMessage,
    bulkDeleteMessages,
    getUnreadCount
} from "../controllers/contactController.js"

const router = express.Router()

// Public route for sending messages
router.post("/", sendMessage)

// Admin routes - Note: In a real application, you should add authentication here
// For now, these are also public but you should protect them in production
router.get("/", getMessages)
router.get("/unread-count", getUnreadCount)
router.get("/:id", getMessageById)
router.patch("/:id/read", markAsRead)
router.delete("/:id", deleteMessage)
router.post("/bulk-delete", bulkDeleteMessages)

export default router