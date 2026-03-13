import User from "../models/user.js"
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import axios from 'axios';
import nodemailer from 'nodemailer';
import OTP from "../models/otp.js";

dotenv.config();

export function createUser(req,res){
    if(req.body.role == "admin"){
        if(req.user!=null){
            if(req.user.role != "admin"){
                res.status(403).json({
                    message : "You are not authorized to create an admin accounts"
                })
                return
            }
        }else{
            res.status(403).json({
                message: "You are not authorized to create an admin account. Please login first"
            })
            return
        }
    }

    const hashedPassword = bcrypt.hashSync(req.body.password, 10)

    const user = new User({
        firstName : req.body.firstName,
        lastName : req.body.lastName,
        email : req.body.email,
        password : hashedPassword,
        role : req.body.role,
        isBlocked: false,
        img: req.body.img || "https://cdn.pixabay.com/photo/2015/03/04/22/35/avatar-659652_1280.png"
    })

    user.save().then(
        ()=>{
            res.json({
                message : "User create successfully"
            })
        }
    ).catch(
        (error)=>{
            res.status(500).json({
                message : "Failed to create user",
                error: error.message
            })
        }
    )
}

export async function getUsers(req, res) {
    // Check if user is admin using the token from Authorization header
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Authentication required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        if (decoded.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const users = await User.find({}, { password: 0 }) // exclude passwords
        res.json(users)
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: "Invalid token" });
        }
        res.status(500).json({ message: "Failed to fetch users" })
    }
}

export async function getUserById(req, res) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Authentication required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        if (decoded.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const userId = req.params.userId;
        const user = await User.findById(userId, { password: 0 });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: "Invalid token" });
        }
        res.status(500).json({ message: "Failed to fetch user details" });
    }
}

export async function updateUserRole(req, res) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Authentication required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        if (decoded.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const userId = req.params.userId;
        const { role } = req.body;

        if (!role || !['admin', 'customer'].includes(role)) {
            return res.status(400).json({ message: "Invalid role specified" });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { role: role },
            { new: true, select: { password: 0 } }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: "User role updated successfully",
            user: user
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: "Invalid token" });
        }
        res.status(500).json({ message: "Failed to update user role" });
    }
}

export async function toggleUserBlock(req, res) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Authentication required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        if (decoded.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const userId = req.params.userId;
        const { isBlocked } = req.body;

        if (typeof isBlocked !== 'boolean') {
            return res.status(400).json({ message: "isBlocked must be a boolean" });
        }

        // Don't allow admin to block themselves
        const userToUpdate = await User.findById(userId);
        if (userToUpdate && userToUpdate.email === decoded.email) {
            return res.status(400).json({ message: "You cannot block your own account" });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            { isBlocked: isBlocked },
            { new: true, select: { password: 0 } }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully`,
            user: user
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: "Invalid token" });
        }
        res.status(500).json({ message: "Failed to update user status" });
    }
}

export async function deleteUser(req, res) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: "Authentication required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_KEY);
        if (decoded.role !== "admin") {
            return res.status(403).json({ message: "Access denied. Admins only." });
        }

        const userId = req.params.userId;

        // Don't allow admin to delete themselves
        const userToDelete = await User.findById(userId);
        if (!userToDelete) {
            return res.status(404).json({ message: "User not found" });
        }

        if (userToDelete.email === decoded.email) {
            return res.status(400).json({ message: "You cannot delete your own account" });
        }

        await User.findByIdAndDelete(userId);

        res.json({
            message: "User deleted successfully"
        });
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(403).json({ message: "Invalid token" });
        }
        res.status(500).json({ message: "Failed to delete user" });
    }
}

export function loginUser(req, res) {
    const email = req.body.email
    const password = req.body.password

    User.findOne({ email: email }).then(
        (user) => {
            if (user == null) {
                res.status(404).json({
                    message: "User not found"
                })
            } else {
                // Check if user is blocked - THIS MUST COME BEFORE PASSWORD CHECK
                if (user.isBlocked) {
                    return res.status(403).json({
                        message: "Your account has been blocked. Please contact administrator."
                    })
                }

                const isPasswordCorrect = bcrypt.compareSync(password, user.password)
                if (isPasswordCorrect) {
                    const token = jwt.sign(
                        {
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            role: user.role,
                            img: user.img,
                            isBlocked: user.isBlocked,
                            userId: user._id
                        },
                        process.env.JWT_KEY,
                        { expiresIn: '7d' }
                    )

                    res.json({
                        message: "Login Successful",
                        token: token,
                        role: user.role,
                        user: {
                            firstName: user.firstName,
                            lastName: user.lastName,
                            email: user.email,
                            img: user.img
                        }
                    })
                } else {
                    res.status(401).json({
                        message: "Invalid password"
                    })
                }
            }
        }
    ).catch((error) => {
        res.status(500).json({
            message: "Login failed",
            error: error.message
        })
    })
}

export async function loginWithGoogle(req, res) {
    const { accessToken } = req.body;

    if (!accessToken) {
        return res.status(400).json({ message: "Access token is required" });
    }

    try {
        const googleRes = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
            headers: { Authorization: `Bearer ${accessToken}` }
        });

        const { email, name, picture } = googleRes.data;

        let user = await User.findOne({ email });

        if (!user) {
            const randomPassword = Math.random().toString(36).slice(-8);
            const hashedPassword = bcrypt.hashSync(randomPassword, 10);

            user = new User({
                firstName: name?.split(' ')[0] || '',
                lastName: name?.split(' ').slice(1).join(' ') || '',
                email,
                password: hashedPassword,
                role: 'customer',
                img: picture,
                isBlocked: false,
                phone: ''
            });

            await user.save();
        } else {
            // Check if user is blocked - THIS IS CRITICAL
            if (user.isBlocked) {
                return res.status(403).json({
                    message: "Your account has been blocked. Please contact administrator."
                });
            }
        }

        const token = jwt.sign(
            {
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role,
                img: user.img,
                isBlocked: user.isBlocked,
                userId: user._id
            },
            process.env.JWT_KEY,
            { expiresIn: '7d' }
        );

        res.json({
            message: "Login successful",
            token,
            role: user.role,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                img: user.img
            }
        });

    } catch (error) {
        console.error("Google login error:", error);
        res.status(500).json({ message: "Failed to authenticate with Google" });
    }
}

export async function sendOTP(req, res) {
    const randomOTP = Math.floor(100000 + Math.random() * 900000);
    const email = req.body.email;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    // Check if user is blocked
    if (user.isBlocked) {
        return res.status(403).json({ 
            message: "Your account has been blocked. Please contact administrator." 
        });
    }

    await OTP.deleteMany({ email });

    const message = {
        from: process.env.SecretEMAIL,
        to: email,
        subject: "Password Reset OTP",
        text: "This is your password reset OTP: " + randomOTP
    };

    const otp = new OTP({
        email: email,
        otp: randomOTP
    });
    await otp.save();

    transport.sendMail(message, (error, info) => {
        if (error) {
            return res.status(500).json({
                message: "Failed to send OTP",
                error: error
            });
        }
        res.json({
            message: "OTP sent successfully"
            // Removed otp from response for security
        });
    });
}

export async function resetPassword(req, res) {
    const { otp, email, newPassword } = req.body;

    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) {
        return res.status(404).json({ message: "No OTP request found! Please send a new request" });
    }

    if (otpRecord.otp !== parseInt(otp)) {
        return res.status(403).json({ message: "Invalid OTP" });
    }

    // Check if user is blocked
    const user = await User.findOne({ email });
    if (user && user.isBlocked) {
        return res.status(403).json({ 
            message: "Your account has been blocked. Please contact administrator." 
        });
    }

    await OTP.deleteMany({ email });

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await User.updateOne({ email }, { password: hashedPassword });

    res.json({ message: "Password reset successful" });
}


// Add this to your userController.js
export async function checkUserBlocked(req, res) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({
            isBlocked: user.isBlocked
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to check user status" });
    }
}




// Export isAdmin function
export function isAdmin(req){
    if(req.user == null){
        return false
    }

    if(req.user.role != "admin"){
        return false
    }
    return true
}