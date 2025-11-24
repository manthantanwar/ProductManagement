const orderModel = require('../models/orderModel');
const cartModel = require('../models/cartModel');
const { isValidObjectId, isValidRequestBody, isPresent } = require('../validator/validator');
const userModel = require('../models/userModel');

const createOrder = async function (req, res) {
    try {
        let id = req.params.userId
        let data = req.body

        if (!isValidObjectId(id)) return res.status(400).send({ status: false, message: "userId is not valid" })

        //Authorization Check
        if (req.token.userId != id) return res.status(403).send({ status: false, message: "Unauthorized Access" })

        if (!isValidRequestBody(data)) return res.status(400).send({ status: false, messaeg: "body cannot be empty" })
        
        if (!isValidObjectId(data.cartId)) return res.status(400).send({ status: false, message: "cart id is missing OR invalid" })

        let checkCart = await cartModel.findOne({ _id: data.cartId, userId: id })

        if (!checkCart) return res.status(404).send({ status: false, message: "Cart Doesn't Belong To This User" })

        let duplicateOrder = await orderModel.findOne({ userId: id })

        //console.log("...",duplicateOrder)
        //if the order of this user doesn't exist in order's collection , place order
        if (!duplicateOrder) {

            if (!checkCart.items.length) {
                return res.status(404).send({ status: false, msg: "cart not found" })
            }

            let array = checkCart.items
            let sum = 0
            //to get the collective quantity of all the products
            for (let i = 0; i < array.length; i++) {
                sum += array[i].quantity
            }

            let { userId, items, totalPrice, totalItems } = checkCart
            let object = {
                userId: userId,
                items: items,
                totalPrice: totalPrice,
                totalItems: totalItems,
                totalQuantity: sum
            }
            let create = await orderModel.create(object)

            let updateCart = await cartModel.findByIdAndUpdate(
                { _id: data.cartId },
                { $set: { items: [], totalPrice: 0, totalItems: 0 } },
                { new: true }
            )
            return res.status(201).send({ status: true, message: "order placed successfully", data: create })
        }
        //else order is already placed
        return res.status(200).send({ status: true, message: "order has already been placed", data: duplicateOrder })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}



const updateOrder = async function (req, res) {
    try {
        let userid = req.params.userId
        // let order = req.body
        let { orderId, status } = req.body

        //Cart ID : exists or not need to check ??
        if (!isValidObjectId(userid)) return res.status(400).send({ status: false, message: "user id is invalid" })

        //UNCOMMENT IT IF IT'S NEEDED========================>
        // let findUser = await userModel.findById(userid)
        // if (!findUser) return res.status(404).send({ status: false, message: "User Not Found" })
        // let findCart = await cartModel.findOne({ userId: userid })
        // if (!findCart) return res.status(404).send({ status: false, message: "Cart Of This User Not Found" })

        //Authorization Check
        if (userid != req.token.userId) return res.status(403).send({ status: false, message: "Unauthorized User" })

        if (!isValidRequestBody(req.body)) return res.status(400).send({ status: false, messaeg: "body cannot be empty" })

        if (!isPresent(orderId) || !isPresent(status)) return res.status(400).send({ status: false, message: "status and orderID are required" })

        if (!isValidObjectId(orderId)) return res.status(400).send({ status: false, message: "order id is missing OR invalid" })

        if (!(["completed", "cancelled"]).includes(status)) return res.status(400).send({ status: false, message: "status must containg : completed OR cancelled" })

        let orders = await orderModel.findOne({ _id: orderId, userId: userid })

        if (!orders) {
            return res.status(404).send({ status: false, message: "order not found" })
        }

        if (orders.cancellable == false && status == "cancelled") {
            return res.status(400).send({ sttaus: false, message: "This Order Cannot Be Cancelled" })
        }

        //if order is completed cannot cancel
        if (orders.status == "completed" && status == "cancelled") return res.status(400).send({ status: false, message: "Completed Order Cannot Be Cancelled" })

        //if order is cancelled cannot be completed
        if (orders.status == "cancelled" && status == "completed") return res.status(400).send({ status: false, message: "This Order Has Been Cancelled" })

        if (orders.status == "cancelled" && status == "cancelled") return res.status(400).send({ status: false, message: "Order Is Already Cancelled" })

        if (orders.status == "completed" && status == "completed") return res.status(200).send({ status: true, message: "Order Is Already Completed" })

        if (status == "cancelled") {
            let cancelOrder = await orderModel.findOneAndUpdate(
                { _id: orderId },
                { $set: { status: status, isDeleted: true, deletedAt: Date.now() } },
                { new: true }
            )
            return res.status(200).send({ status: true, message: "Order Cancelled" })
        }

        let completeOrder = await orderModel.findOneAndUpdate(
            { _id: orderId },
            { $set: { status: status, isDeleted: false, deletedAt: null } },
            { new: true }
        ).populate({ path: 'items.productId', model: 'Product', select: { _id: 1, title: 1, price: 1 } })

        return res.status(200).send({ status: true, message: "updated successfully ", data: completeOrder })


    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

module.exports = { createOrder, updateOrder }