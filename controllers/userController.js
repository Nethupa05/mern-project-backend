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
        role : req.body.role
    })

    user.save().then(
        ()=>{
            res.json({
                message : "User create successfully"
            })
        }
    ).catch(
        ()=>{
            res.json({
                message : "Failed to create user"
            })
        }
    )
}

export async function getUsers(req, res) {
    if (!isAdmin(req)) {
        return res.status(403).json({ message: "Access denied. Admins only." })
    }

    try {
        const users = await User.find({}, { password: 0 }) // exclude passwords
        res.json(users)
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch users" })
    }
}





export function loginUser(req,res){
    const email = req.body.email
    const password = req.body.password

    User.findOne({email : email}).then(
        (user)=>{
            if(user == null){
                res.status(404).json({
                    message : "User not found"
                })
            }else{
                const isPasswordCorrect = bcrypt.compareSync(password, user.password)
                if(isPasswordCorrect){

                    const token = jwt.sign(
                        {
                            email : user.email,
                            firstName : user.firstName,
                            lastName : user.lastName,
                            role : user.role,
                            img : user.img
                        },
                        process.env.JWT_KEY
                    )

                    res.json({
                        message : "Login Successfull",
                        token : token,
                        role : user.role
                    })
                }else{
                    res.status(401).json({
                        message : "Invalid password"
                    })
                }
            }
        }
    )
}


// export async function loginWithGoogle(req,res){
//     const token = req.body.accessToken;

//     if(token == null){
//         res.status(400).json({
//             message : "Access token is required"
//         })
//         return
//     }
//     const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
//         headers : {
//             Authorization : `Bearer ${token}`
//         }
//     })
//     console.log(response.data)
// }



export async function loginWithGoogle(req, res) {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ message: "Access token is required" });
  }

  try {
    // 1. Get user info from Google
    const googleRes = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const { email, name, picture } = googleRes.data;

    // 2. Check if user already exists in your DB
    let user = await User.findOne({ email });

    if (!user) {
      // 3. If not, create a new user (you can set a random password or use a default)
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = bcrypt.hashSync(randomPassword, 10);

      user = new User({
        firstName: name?.split(' ')[0] || '',
        lastName: name?.split(' ').slice(1).join(' ') || '',
        email,
        password: hashedPassword,
        role: 'user', // default role
        img: picture
      });

      await user.save();
    }

    // 4. Generate JWT token
    const token = jwt.sign(
      {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        img: user.img
      },
      process.env.JWT_KEY
    );

    // 5. Send response to frontend
    res.json({
      message: "Login successful",
      token,
      role: user.role
    });

  } catch (error) {
    console.error("Google login error:", error);
    res.status(500).json({ message: "Failed to authenticate with Google" });
  }
}

const transport = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.SecretEMAIL,
        pass: process.env.SecretPASSWORD
    }
})
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

    // Delete any existing OTPs for this email (use OTP model)
    await OTP.deleteMany({ email });

    const message = {
        from: "nethupadalugodadev@gmail.com",
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
            message: "OTP sent successfully",
            otp: randomOTP   // ⚠️ Only for testing – remove in production
        });
    });
}

export async function resetPassword(req, res) {
    const { otp, email, newPassword } = req.body;

    const otpRecord = await OTP.findOne({ email });
    if (!otpRecord) {
        return res.status(404).json({ message: "No OTP request found! Please send a new request" });
    }

    if (otpRecord.otp !== otp) {
        return res.status(403).json({ message: "Invalid OTP" });
    }

    // OTP is valid – delete all OTPs for this email
    await OTP.deleteMany({ email });

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await User.updateOne({ email }, { password: hashedPassword });

    res.json({ message: "Password reset successful" });
}


export function isAdmin(req){
    if(req.user == null){
        return false
    }

    if(req.user.role != "admin"){
        return false
    }
    return true
}