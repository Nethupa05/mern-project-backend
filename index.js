import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';
import studentRouter from './routes/studentRouter.js';
import productRouter from './routes/productRouter.js';
import userRouter from './routes/userRouter.js';
import jwt from 'jsonwebtoken';

const app = express();

app.use(bodyParser.json())

app.use(
   (req,res,next)=>{
      const tokenString = req.header("Authorization")
      if(tokenString != null){
         const token = tokenString.replace("Bearer ", "")

         jwt.verify(token, "nethupa11", 
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

mongoose.connect("mongodb+srv://admin:1234@cluster0.fh1ctxn.mongodb.net/?appName=Cluster0").then(()=>{
   console.log("Connected to the Database")
}).catch(()=>{
   console.log("Database Connection Failed")
})

app.use("/students", studentRouter)
app.use("/products", productRouter)
app.use("/users", userRouter)

//mongodb+srv://admin:1234@cluster0.fh1ctxn.mongodb.net/?appName=Cluster0


app.listen(5000,
   ()=>{
      console.log('Server is running on port 5000');
   }
)