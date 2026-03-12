// controllers/contactController.js
import Contact from "../models/contactModel.js"

// Save message
export const sendMessage = async (req,res) => {
    try{
        const {firstName, lastName, email, phone, message} = req.body

        const newMessage = new Contact({
            firstName,
            lastName,
            email,
            phone: phone || '', // Add phone field
            message,
            isRead: false, // Initialize as unread
            date: new Date(), // Add date field
            createdAt: new Date() // Add createdAt for sorting
        })

        await newMessage.save()

        res.json({
            success: true,
            message: "Message sent successfully",
            data: newMessage
        })

    } catch(error) {
        console.error("Error saving message:", error)
        res.status(500).json({
            success: false,
            message: "Server Error"
        })
    }
}

// Admin get all messages
export const getMessages = async (req,res) => {
    try {
        const messages = await Contact.find().sort({createdAt: -1})
        res.json(messages)
    } catch(error) {
        console.error("Error fetching messages:", error)
        res.status(500).json({
            success: false,
            message: "Server error"
        })
    }
}

// Get single message by ID
export const getMessageById = async (req,res) => {
    try {
        const message = await Contact.findById(req.params.id)
        
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            })
        }
        
        res.json(message)
    } catch(error) {
        console.error("Error fetching message:", error)
        res.status(500).json({
            success: false,
            message: "Server error"
        })
    }
}

// Mark message as read
export const markAsRead = async (req,res) => {
    try {
        const message = await Contact.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        )
        
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            })
        }
        
        res.json({
            success: true,
            message: "Message marked as read",
            data: message
        })
    } catch(error) {
        console.error("Error marking message as read:", error)
        res.status(500).json({
            success: false,
            message: "Server error"
        })
    }
}

// Delete message
export const deleteMessage = async (req,res) => {
    try {
        const message = await Contact.findByIdAndDelete(req.params.id)
        
        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            })
        }
        
        res.json({
            success: true,
            message: "Message deleted successfully"
        })
    } catch(error) {
        console.error("Error deleting message:", error)
        res.status(500).json({
            success: false,
            message: "Server error"
        })
    }
}

// Bulk delete messages (optional)
export const bulkDeleteMessages = async (req,res) => {
    try {
        const { messageIds } = req.body
        
        await Contact.deleteMany({ _id: { $in: messageIds } })
        
        res.json({
            success: true,
            message: "Messages deleted successfully"
        })
    } catch(error) {
        console.error("Error bulk deleting messages:", error)
        res.status(500).json({
            success: false,
            message: "Server error"
        })
    }
}

// Get unread messages count
export const getUnreadCount = async (req,res) => {
    try {
        const count = await Contact.countDocuments({ isRead: false })
        res.json({ count })
    } catch(error) {
        console.error("Error getting unread count:", error)
        res.status(500).json({
            success: false,
            message: "Server error"
        })
    }
}