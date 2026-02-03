import mongoose from 'mongoose';

const userSchema = mongoose.Schema({
    email:{
        type : String,
        required : true,
        unique : true
    },
    firstName:{
        type : String,
        required : true
    },
    lastName:{
        type : String,
        required : true
    },
    password:{
        type : String,
        required : true
    },
    role:{
        type : String,
        required : true,
        default : "customer"
    },
    isBlocked : {
        type : Boolean,
        required : true,
        default : false
    },
    img:{
        type : String,
        required : false,
        default: "https://cdn.pixabay.com/photo/2015/03/04/22/35/avatar-659652_1280.png"
    },
});

const User = mongoose.model("users", userSchema);

export default User;