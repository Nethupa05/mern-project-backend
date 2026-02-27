import Product from "../models/product.js";
import { isAdmin } from "./userController.js";

export async function getProducts(req, res) {
    try {

        if (isAdmin(req)) {
            const product = await Product.find()
            res.json(product);
        } else {
            const product = await Product.find({ isAvailable: true });
            res.json(product);
        }


    } catch (err) {

        res.status(500).json({
            message: "Failed to get products",
            error: err

        })

    }
}


export function saveProducts(req,res){

    if (!isAdmin(req)) {
        res.status(403).json(
            {
                message: "User not authorized to add products"
            }
        )
        return
    }
    const product = new Product(req.body);

    product.save().then(() => {
        res.json({
            message: "Product added successfully"
        })
    }).catch((err) => {
        res.json({
            message: "Product added failed",
            error: err
        })
    })
}

// export function saveProducts(req,res){
//     if(!isAdmin(req)){
//         res.status(403).json({
//             message : "You are not auithorized to add a product"
//         })
//         return
//     }

//     const product = new Product(req.body);

//     product.save().then(()=>{
//         res.json({
//             message: "Product added successfully",
//         });
//     }).catch((err) => {
//         console.log("ERROR SAVING PRODUCT:", err); // This should show the specific error
//         console.log("Error name:", err.name); // Add this
//         console.log("Error code:", err.code); // Add this
//         console.log("Error message:", err.message); // Add this
//         console.log(err);
//         res.status(500).json({  // <-- ADD THIS: send 500 status code
//             message: "Failed to add products",
//         });
//     });
// }

// export async function saveProducts(req,res){

//     try {

//         console.log("Request received")

//         if(!isAdmin(req)){
//             console.log("Not admin")
//             return res.status(403).json({
//                 message : "You are not authorized"
//             })
//         }

//         console.log("Body:", req.body)

//         const product = new Product(req.body);

//         await product.save();

//         console.log("Product saved successfully")

//         return res.status(201).json({
//             message: "Product added successfully",
//         });

//     } catch (err) {

//         console.log("ERROR SAVING:", err)

//         return res.status(500).json({
//             message: "Failed to add product",
//             error: err.message
//         });
//     }
// }



export async function deleteProducts(req,res){
    if(!isAdmin(req)){
        res.status(403).json({
            message : "you are not authorized to delete a product"
        })
        return
    }
    try{
        await Product.deleteOne({productId : req.params.productId})

        res.json({
            message : "Product deleted successfully"
        })
    }catch(err){
        res.status(500).json({
            message : "Failed to delete product",
            error : err
        })
    }
}


export async function updateProduct(req,res){
    if(!isAdmin(req)){
        res.status(403).json({
            message : "You are not authorozed to update a product"
        })
        return
    }

    const productId = req.params.productId
    const updatingData = req.body

    try{
        await Product.updateOne(
            {productId : productId},
            updatingData
        )

        res.json(
            {
                message : "Product updated Successfully"
            }
        )
    }catch(err){
        res.status(500).json({
            message : "Internal server error",
            error : err
        })
    }
}



export async function getProductsById(req,res){
    const productId = req.params.productId
    try{
        const product = await Product.findOne(
            {productId : productId}
        )

        if(product == null){
            res.status(404).json({
                message : "Product not found"
            })
            return
        }

        if(product.isAvailable){
            res.json(product)
        }else{
            if(!isAdmin(req)){
                res.status(404).json({
                    message : "Product not found"
                })
                return
            }else{
                res.json(product)
            }
        }
    }catch(err){
        res.status(500).json({
            message : "Internal server error",
            error : err
        })
    }
}