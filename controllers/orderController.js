import Order from "../models/order.js";
import Product from "../models/product.js";  // Add this import
import mongoose from "mongoose";

// export async function createOrder(req,res){
//     if(req.user == null){
//         res.status(403).json({
//             message : "Please login and try again"
//         })
//         return
//     }

//     const orderInfo = req.body

//     if(orderInfo.name == null){
//         orderInfo.name = req.user.firstName + " " + req.user.lastName
//     }

//     let orderId = "CBC00001"

//     const lastOrder = await Order.findOne().sort({ date: -1 })

//     if(lastOrder){
//         const lastOrderId = lastOrder.orderId

//         const lastOrderNumberString = lastOrderId.replace("CBC","")
//         const lastOrderNumber = parseInt(lastOrderNumberString)
//         const newOrderNumber = lastOrderNumber + 1 
//         const newOrderNumberString = String(newOrderNumber).padStart(5, '0')
//         orderId = "CBC" + newOrderNumberString
//     }

//     try{

//         let total = 0;
//         let labelledTotal = 0;
//         const products = []

//         for(let i = 0; i < orderInfo.products.length; i++){
//             const item = await Product.findOne({productId : orderInfo.products[i].productId})

//             if(item == null){
//                 res.status(404).json({
//                     message : "Product with productId " + orderInfo.products[i].productId + " not found"
//                 })
//                 return
//             }
//             if(item.isAvailable == false){
//                 res.status(404).json({
//                     message : "Product with productId " + orderInfo.products[i].productId + " is not available right now"
//                 })
//                 return
//             }


//             products[i] = {
//                 productInfo : {
//                     productId : item.productId,
//                     name : item.name,
//                     altNames : item.altNames,
//                     description : item.description,
//                     images : item.images,
//                     labelledPrice : item.labelledPrice,
//                     price : item.price
//                 },
//                 quantity : orderInfo.products[i].quantity
//             }

//             total += (item.price * orderInfo.products[i].quantity)
//             labelledTotal += (item.labelledPrice * orderInfo.products[i].quantity)
//         }


//         const order = new Order({
//             orderId : orderId,
//             email : req.user.email,
//             name : orderInfo.name,
//             address : orderInfo.address,
//             phone : orderInfo.phone,
//             products : products,
//             labelledTotal : labelledTotal,
//             total : total
//         })

//         const createOrder = await order.save()
//         res.json({
//             message : "Order created successfully",
//             order : createOrder
//         })
//     }catch(err){
//         res.status(500).json({
//             message : "Failed to create order",
//             error : err
//         })
//     }
// }


export async function createOrder(req,res){

    if(!req.user){
        return res.status(403).json({
            message : "Please login and try again"
        })
    }

    const orderInfo = req.body

    if(!orderInfo.products || orderInfo.products.length === 0){
        return res.status(400).json({
            message: "No products in order"
        })
    }

    if(!orderInfo.name){
        orderInfo.name = req.user.firstName + " " + req.user.lastName
    }

    let orderId = "CBC00001"

    const lastOrder = await Order.findOne().sort({date:-1})

    if(lastOrder){
        const lastOrderNumber = parseInt(lastOrder.orderId.replace("CBC",""))
        const newOrderNumber = lastOrderNumber + 1
        orderId = "CBC" + String(newOrderNumber).padStart(5,'0')
    }

    try{

        let total = 0
        let labelledTotal = 0
        const products = []

        for(let i=0;i<orderInfo.products.length;i++){

            const item = await Product.findOne({
                productId: orderInfo.products[i].productId
            })

            if(!item){
                return res.status(404).json({
                    message:`Product ${orderInfo.products[i].productId} not found`
                })
            }

            products.push({
                productInfo:{
                    productId:item.productId,
                    name:item.name,
                    altNames:item.altNames,
                    description:item.description,
                    images:item.images,
                    labelledPrice:item.labelledPrice,
                    price:item.sellingPrice
                },
                quantity:orderInfo.products[i].quantity
            })

            total += item.sellingPrice * orderInfo.products[i].quantity
            labelledTotal += item.labelledPrice * orderInfo.products[i].quantity
        }

        const order = new Order({
            orderId,
            email:req.user.email,
            name:orderInfo.name,
            address:orderInfo.address,
            phone:orderInfo.phone,
            products,
            labelledTotal,
            total
        })

        const savedOrder = await order.save()

        res.json({
            message:"Order created successfully",
            order:savedOrder
        })

    }catch(err){

        console.log("ORDER ERROR:",err)

        res.status(500).json({
            message:"Failed to create order",
            error:err.message
        })
    }
}

export async function getOrders(req,res){
    if(req.user == null){
        res.status(403).json({
            message:"Please login and try again"
        })
        return
    }
    try{
        if(req.user.role == "admin"){
            const orders = await Order.find()
            res.json(orders)
        }else{
            const orders = await Order.find({email:req.user.email})
            res.json(orders)
        }
    }catch (err) {
        res.status(500).json({
            message:"Failed to get orders",
            error: err
        })
    }
}


// export async function updateOrderStatus(req,res){
//     if(!isAdmin(req)){
//         res.status(403).json({
//             message: "You are not authorized to update order status",
//         })
//         return
//     }
//     try{
//         const orderId = req.params.orderId;
//         // const status = req.params.status;
//         const { status } = req.body;

//         await Order.updateOne(
//             {
//                 orderId: orderId
//             },
//             {
//                 status: status
//             }
//         )

//         const updatedOrder = await Order.findOne({ orderId: orderId });

//         res.json({
//             message: "Order status update successfully",
//             order: updatedOrder
//         })

//     }catch(e){
//         console.error("Error updating order status:", e);
//         res.status(500).json({
//             message:"Failed to update order status",
//             error: e
//         })
//         return
//     }
// }



export async function updateOrderStatus(req, res) {
  // ensure req.user exists and is admin
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "You are not authorized to update order status" });
  }

  try {
    const orderIdParam = req.params.orderId;   // could be "CBC00001" or Mongo _id
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Missing status in request body" });
    }

    // choose filter: if param is a valid ObjectId, search by _id, otherwise by orderId field
    const filter = mongoose.Types.ObjectId.isValid(orderIdParam)
      ? { _id: orderIdParam }
      : { orderId: orderIdParam };

    const updatedOrder = await Order.findOneAndUpdate(filter, { status }, { new: true });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json({ message: "Order status updated successfully", order: updatedOrder });
  } catch (err) {
    console.error("Error updating order status:", err);
    return res.status(500).json({ message: "Failed to update order status", error: err.message });
  }
}