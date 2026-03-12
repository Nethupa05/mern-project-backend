import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

import studentRouter from './routes/studentRouter.js';
import productRouter from './routes/productRouter.js';
import userRouter from './routes/userRouter.js';
import orderRouter from './routes/orderRouter.js';
import contactRoutes from "./routes/contactRoutes.js"


dotenv.config();
const app = express();

app.use(cors())
app.use(bodyParser.json())


app.use(
   (req,res,next)=>{
      const tokenString = req.header("Authorization")
      if(tokenString != null){
         const token = tokenString.replace("Bearer ", "")

         jwt.verify(token, process.env.JWT_KEY, 
            (err,decoded)=>{
               if(decoded != null){
                  console.log(decoded)
                  req.user = decoded
                  next()
               }else{
                  console.log("invalid token")
                  res.status(403).json({
                     message : "Invalid Token"
                  })
               }
            }
         )
      }else{
         next()
      }
      
      //next()
   }
)

mongoose.connect(process.env.MONGODB_URL).then(()=>{
   console.log("Connected to the Database")
}).catch(()=>{
   console.log("Database Connection Failed")
})

app.use("/api/students", studentRouter)
app.use("/api/products", productRouter)
app.use("/api/users", userRouter)
app.use("/api/orders", orderRouter)
app.use("/api/contact", contactRoutes)

//mongodb+srv://admin:1234@cluster0.fh1ctxn.mongodb.net/?appName=Cluster0


app.listen(5000,
   ()=>{
      console.log('Server is running on port 5000');
   }
)