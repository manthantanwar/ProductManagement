const cartModel = require('../models/cartModel')
const { isValidObjectId, isValidName, isValidRequestBody, isPresent, isValidTitle } = require('../validator/validator')
const userModel = require('../models/userModel');
const productModel = require('../models/productModel')



const createCart = async (req, res) => {
    try {
        let userId = req.params.userId
        let { cartId, productId } = req.body

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "enter a valid user id" })


        let findUser = await userModel.findById(userId)

        if (!findUser) return res.status(404).send({ status: false, message: "User Not Found" })

        //Authorization Check
        if (findUser._id != req.token.userId) return res.status(403).send({ status: false, message: "Unauthorized User" })

        if (!isValidRequestBody(req.body)) return res.status(400).send({ status: false, messaeg: "body cannot be empty" })

        if (!isPresent(productId) || !isValidObjectId(productId)) return res.status(400).send({ status: false, message: "product id is missing or invalid" })

        let product = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!product) return res.status(404).send({ status: false, message: "Product Not Found" })

        let usercart = await cartModel.findOne({ userId: userId })

        if (!usercart) {

            let obj = {
                productId: product._id,
                quantity: 1,
            }
            let createcart = await cartModel.create({ userId: userId, items: obj, totalPrice: product.price * obj.quantity, totalItems: 1 })

            return res.status(201).send({ status: true, message: "Cart Created Successfully", data: createcart })
        }
        // if (usercart) {
        if (!isPresent(cartId) || !isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "cart id is missing or invalid" })

        let findCart = await cartModel.findOne({ _id: cartId, userId: userId })

        if (!findCart) return res.status(404).send({ staus: false, message: "Cart Not Found" })


        let obj = {
            quantity: 1
        }

        //product exists in the cart already : increase its quantity
        let updateCart = await cartModel.findOneAndUpdate(
            //whe $ on 72 and not on 69?
            { _id: findCart._id, "items.productId": productId },
            {
                $inc: {
                    "items.$.quantity": 1,
                    totalPrice: obj.quantity * product.price,
                },
            },
            { new: true });

        //product does not exist in the cart already : add 
        if (!updateCart) {

            let obj = {
                productId: product._id,
                quantity: 1
            }

            let updateCart = await cartModel.findOneAndUpdate(
                { _id: findCart._id },
                {
                    $push: { items: obj },
                    $inc: {

                        totalPrice: obj.quantity * product.price,
                        totalItems: 1
                    }
                },
                { new: true });
            return res.status(201).send({ status: true, message: "product added successfully!", data: updateCart })
        }
        return res.status(201).send({ status: true, message: "product added successfully!", data: updateCart })

    } catch (error) {

        return res.status(500).send({ status: false, message: error.message })
    }
}

const updateCart = async function (req, res) {
    try {
        let userId = req.params.userId

        let { cartId, productId, removeProduct } = req.body

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "enter a valid user id" })

        let findUser = await cartModel.findOne({ userId: userId })

        if (!findUser) return res.status(404).send({ status: false, message: "cart of this user does not exist" })

        //Authorization Check
        if (findUser.userId != req.token.userId) return res.status(403).send({ status: false, message: "Unauthorized User" })

        if (!isValidRequestBody(req.body)) return res.status(400).send({ status: false, message: "body cannot be empty" })

        if (!isPresent(cartId) || !isPresent(productId) || !isPresent(removeProduct)) return res.status(400).send({ status: false, message: "Required : cartId ,productId ,removeProduct" })

        if (!isValidObjectId(cartId) || !isValidObjectId(productId)) return res.status(400).send({ status: false, message: "enter valid IDs" })

        if (!([0, 1]).includes(removeProduct)) return res.status(400).send({ status: false, message: "removeProduct must contain 0 or 1" })

        let findCart = await cartModel.findOne({ _id: cartId, userId: userId })

        if (!findCart) return res.status(404).send({ status: false, message: "Cart Not Found" })

        let arr = []

        //using for loop saved the product ids in arr
        //toString() : .includes works for a string only
        for (let i = 0; i < findCart.items.length; i++) {

            arr.push(findCart.items[i].productId.toString())
        }

        //console.log(arr)
        if (!arr.includes(productId)) return res.status(404).send({ status: false, message: "product does not exist in the cart" })

        //if product found , access quantity 
        //[0] : why??  , if not : product will get deleted in one go even when the quantity is 3
        let quantity = findCart.items.filter(x => x.productId.toString() === productId).quantity


        console.log("======>", quantity)
        let product = await productModel.findById(productId)

        //if removeProduct == 1
        if (removeProduct == 1) {
            if (quantity > 1) {

                let updateCart = await cartModel.findOneAndUpdate(
                    { _id: cartId, "items.productId": productId },
                    {
                        $inc: {
                            "items.$.quantity": -1,
                            totalPrice: - product.price

                        }
                    },
                    { new: true }

                )
                return res.status(200).send({ status: true, message: "updated successfully", data: updateCart })
            } else {
                //while decreasing the quantity  becomes 0 delete it
                let deleteProduct = await cartModel.findOneAndUpdate(
                    { 'items.productId': productId, userId: userId },
                    {
                        $pull: { items: { productId } },
                        $inc: { totalItems: -1, totalPrice: -product.price }
                    },
                    { new: true }

                )
                return res.status(200).send({ status: true, message: "updated sucessfully", data: deleteProduct })
            }
        }

        //if removeProduct == 0
        if (removeProduct == 0) {

            let productQuantity = findCart.items

            let speciPro;

            for (i of productQuantity) {
                speciPro = i
                console.log("here", i)
            }
            let obj = { product: product._id, quantity: speciPro.quantity }

            let updateCart = await cartModel.findOneAndUpdate(
                { _id: cartId, "items.productId": productId },
                {
                    //$unset:{"items.$.productId":1,"items.$.quantity":1,"items.$._id":1}only removes a field, doesn't delete
                    //$pull : deletes a specified object from an array
                    $pull: { items: { productId } },
                    $inc: { totalPrice: - product.price * obj.quantity, totalItems: -1 }
                },
                { new: true }
            )
            return res.status(200).send({ status: true, message: "updated successfully", data: updateCart })
        }


    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


let getCart = async function (req, res) {

    try {
        let userId = req.params.userId;

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Uesr id is not valid" })

        let getCartdetails = await cartModel.findOne({ userId: userId }).populate({ path: 'items.productId', model: 'Product', select: { _id: 1, title: 1, price: 1 } })

        if (!getCartdetails || !getCartdetails.items.length) return res.status(404).send({ status: false, msg: `Cart not found of ${userId} User` });

        //Authorization Check
        if (getCartdetails.userId != req.token.userId) return res.status(403).send({ status: false, message: "Unauthorized User" })

        return res.status(200).send({ status: true, Data: getCartdetails })

    } catch (err) {
        return res.status(500).send({ status: false, Msg: err.message })
    }
}

const deleteCart = async function (req, res) {
    try {
        let userId = req.params.userId

        if (!isValidObjectId(userId)) { return res.status(400).send({ status: false, message: "user id is invalid" }) }

        let idCheck = await cartModel.findOne({ userId: userId })

        if (!idCheck) { return res.status(404).send({ status: false, message: `cart of ${userId} not found` }) }

        //Authorization Check
        if (idCheck.userId != req.token.userId) return res.status(403).send({ status: false, message: "Unauthorized User" })

        let checkDelete = await cartModel.findOne({ userId: userId, items: [] })

        if (checkDelete) { return res.status(404).send({ status: false, message: "cart already deleted" }) }


        let deleteCart = await cartModel.findOneAndUpdate(
            { userId: userId },
            { $set: { items: [], totalItems: 0, totalPrice: 0 } },
            { new: true }
        )

        //if 204 : no message why?
        return res.status(204).send({ status: true, message: "cart deleted successfully" })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = { createCart, updateCart, getCart, deleteCart }