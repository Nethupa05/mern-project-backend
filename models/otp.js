import mongoose from "mongoose";

const OTPSchema = mongoose.Schema({
    email: { type: String, required: true },
    otp: { type: String, required: true }
});

export default mongoose.model("OTP", OTPSchema);