const productModel = require('../models/productModel')
const { isValidImage,isValidObjectId, isValidRequestBody, isPresent, isValidTitle } = require('../validator/validator')
const { uploadFile } = require('../controllers/awsController');




const createProduct = async function (req, res) {
    try {
        let { title, description, price, currencyId, currencyFormat, isFreeShipping, style, availableSizes, installments, isDeleted } = req.body

        if (!isValidRequestBody(req.body)) return res.status(400).send({ status: false, message: "body cannot be empty" });

        if (!isPresent(title) || !isValidTitle.test(title)) {
            return res.status(400).send({ status: false, message: "Title is missing or invalid" });
        } else {
            let repeatedTitle = await productModel.findOne({ title: title })
            if (repeatedTitle)
                return res.status(409).send({ status: false, message: "title has to be unique" })
        }

        if (!isPresent(description)) { return res.status(400).send({ status: false, message: "description is missing" }) }

        if (!isPresent(price) || !(/^\d*\.?\d*$/).test(price)) return res.status(400).send({ status: false, message: "price is missing or invalid" })

        if (!isPresent(currencyId)) {
            req.body.currencyId = "INR"
        } else {
            if (!("INR").includes(currencyId))
                return res.status(400).send({ status: false, message: "Currency ID must be INR" })
        }

        if (!isPresent(currencyFormat)) {
            req.body.currencyFormat = "₹"
        } else {
            if (!("₹").includes(currencyFormat))
                return res.status(400).send({ status: false, message: "currencyFormat  must be ₹" })
        }

        let productImage = req.files

        if (productImage && productImage.length > 0) {
            if (!isValidImage(productImage[0].originalname)) return res.status(400).send({ status: false, message: "enter a valid product image" })
            let uploadedFileURL = await uploadFile(productImage[0])
            //profileImage was available in req.files ; added new key in req.body.profileImage = uploadedFileURL
            req.body.productImage = uploadedFileURL
        } else {
            return res.status(400).send({ msg: "No file found" })
        }

        if (!isPresent(availableSizes)) return res.status(400).send({ status: false, message: "Sizes Are Required" })

        availableSizes = availableSizes.split(",")

        for (let i = 0; i < availableSizes.length; i++) {
            if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSizes[i])))
                return res.status(400).send({ status: false, message: "availableSizes is missing or invalid : provide  S, XS, M, X, L, XXL, XL " })
        }

        req.body.availableSizes = availableSizes

        if (Object.values(req.body).includes(style)) {
            if (!isPresent(style))
                return res.status(400).send({ status: false, message: "provide value in style" })
        }

        if (Object.values(req.body).includes(installments)) {
            //if (!/^\d+$/.test(installments))
            if (!Number(installments))
                return res.status(400).send({ status: false, message: "installments must be a digit" })
        }

        if (Object.values(req.body).includes(isFreeShipping)) {
            if (!Boolean(isFreeShipping))
                return res.status(400).send({ status: false, message: "provide true OR false" })
        }

        if (isDeleted == true) return res.status(400).send({ status: false, message: "cannot delete while creation" })

        let productCreate = await productModel.create(req.body)

        return res.status(201).send({ status: true, message: "created successfully", data: productCreate })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


let getProductByFilter = async (req, res) => {
    try {
        let query = req.query

        //need to write all possible combinations??
        if (Object.keys(query).length > 0) {
            if (query.size && query.name && query.priceGreaterThan) {                      //$regex : finds a doc following the pattern provided in query.name
                let filter1 = await productModel.find({ availableSizes: query.size, title: { $regex: query.name }, price: { $gte: query.priceGreaterThan }, isDeleted: false })
                return filter1.length == 0 ? res.status(404).send({ status: false, message: "product not found given filter" }) : res.status(200).send({ status: true, data: filter1 })
            }
            if (query.size && query.name) {
                let filter2 = await productModel.find({ availableSizes: query.size, title: { $regex: query.name }, isDeleted: false })
                return filter2.length == 0 ? res.status(404).send({ status: false, message: "product not found given filter" }) : res.status(200).send({ status: true, data: filter2 })
            }
            if (query.priceGreaterThan && query.priceLessThan) {
                let filter3 = await productModel.find({ price: { $gte: query.priceGreaterThan, $lte: query.priceLessThan }, isDeleted: false })
                return filter3.length == 0 ? res.status(404).send({ status: false, message: "product not found given filter" }) : res.status(200).send({ status: true, data: filter3 })
            }
            if (Object.values(query).includes(query.size)) {
                if (!isPresent(query.size)) return res.status(400).send({ status: false, message: "provide value" })
                let sizes = query.size.split(",")
                let size = await productModel.find({ availableSizes: { $in: sizes }, isDeleted: false })
                return size.length == 0 ? res.status(404).send({ status: false, message: "product not found with given size" }) : res.status(200).send({ status: true, data: size })
            }
            if (Object.values(query).includes(query.name)) {
                if (!isPresent(query.name)) return res.status(400).send({ status: false, message: "provide value" })
                let name = await productModel.find({ title: { $regex: query.name }, isDeleted: false })
                return name.length == 0 ? res.status(404).send({ status: false, message: "product not found with the given name" }) : res.status(200).send({ status: true, data: name })
            }
            if (Object.values(query).includes(query.priceGreaterThan)) {
                let greaterprice = await productModel.find({ price: { $gte: query.priceGreaterThan }, isDeleted: false }).sort({ price: 1 })
                return greaterprice.length == 0 ? res.status(404).send({ status: false, message: "product not found with the given price" }) : res.status(200).send({ status: true, data: greaterprice })
            }
            if (Object.values(query).includes(query.priceLessThan)) {
                let lessthanprice = await productModel.find({ price: { $lte: query.priceLessThan }, isDeleted: false }).sort({ price: -1 })
                return lessthanprice.length == 0 ? res.status(404).send({ status: false, message: "product not found with the given price" }) : res.status(200).send({ status: true, data: lessthanprice })
            }
            let priceSort = query.priceSort
            if (Object.values(query).includes(priceSort)) {
                if (!isPresent(priceSort)) return res.status(400).send({ status: false, message: "provide value in priceSort" })
                let sortprice = await productModel.find({ isDeleted: false }).sort({ price: priceSort })
                return sortprice.length == 0 ? res.status(404).send({ status: false, message: "product not found" }) : res.status(200).send({ status: true, data: sortprice })
            }

        } else {
            let allproduct = await productModel.find({ isDeleted: false })
            return allproduct.length == 0 ? res.status(404).send({ status: false, message: "product not found" }) : res.status(200).send({ status: true, data: allproduct })
        }
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

const getProduct = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "product id is not valid" })

        let checkProduct = await productModel.findById(productId)

        if (checkProduct.isDeleted == true) return res.status(404).send({ status: false, message: "Product Is Out Of Stock" })

        if (!checkProduct) return res.status(404).send({ status: false, message: "product not found" })

        return res.status(200).send({ status: true, message: "products", data: checkProduct })

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

const updateProduct = async function (req, res) {
    try {
        let data = req.body

        let productId = req.params.productId

        let productImage = req.files

        if (!isValidRequestBody(data) && !isPresent(productImage)) return res.status(400).send({ status: false, message: "Body should be not empty !" })

        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Given productID is not valid" })

        let product = await productModel.findOne({ _id: productId, isDeleted: false })

        if (!product) return res.status(404).send({ status: false, message: "Product not found" })

        let { description, isFreeShipping, installments, availableSizes, style, currencyFormat, currencyId, price, title } = data

        //MUST READ  : Object.values(data).includes(title)
        if (Object.values(data).includes(title)) {
            if (!isValidTitle.test(title) || !isPresent(title)) return res.status(400).send({ status: false, message: "enter a valid title" })
            let uniqueTitle = await productModel.findOne({ title: title })
            if (uniqueTitle) return res.status(400).send({ status: false, message: "title already exist" })
        }

        if (Object.values(data).includes(price)) {
            if (!(/^\d*\.?\d*$/).test(price) || !isPresent(price)) return res.status(400).send({ status: false, message: " please provide valid price" })
        }

        if (Object.values(data).includes(currencyId)) {
            if (!(currencyId).includes("INR")) return res.status(400).send({ status: false, message: "Currency ID must be INR" })
        }

        if (Object.values(data).includes(currencyFormat)) {
            if (!(currencyFormat).includes("₹")) return res.status(400).send({ status: false, message: "currencyFormat  must be ₹" })
        }
        console.log("from here", req.files)

        //if empty, take profileImage from DB
        if (productImage) {
            if (productImage.length > 0) {
                if (!isValidImage(productImage[0].originalname)) return res.status(400).send({ status: false, message: "enter a valid product image" })
                let uploadedFileURL = await uploadFile(productImage[0])
                //profileImage was available in req.files ; added new key in req.body.profileImage = uploadedFileURL
                req.body["productImage"] = uploadedFileURL
            }
            if (!productImage.length) {
                req.body["productImage"] = product.productImage
            }
        }

        if (Object.values(data).includes(style)) {
            if (!isPresent(style)) return res.status(400).send({ status: false, message: "please provide value in style" })
        }

        if (Object.values(data).includes(availableSizes)) {
            //MUST READ : .split() && .join()
            //.split() : divides a string , put these in an arrey , returns an array
            //.join() : concatinates all the elems in an array by return a string (opposite of .split)
            availableSizes = availableSizes.split(",")
            for (let i = 0; i < availableSizes.length; i++) {
                if (!(["S", "XS", "M", "X", "L", "XXL", "XL"].includes(availableSizes[i])))
                    return res.status(400).send({ status: false, message: "availableSizes is missing or invalid : provide  S, XS, M, X, L, XXL, XL " })
            }
            req.body.availableSizes = availableSizes
        }


        if (Object.values(data).includes(installments)) {
            if (!Number(installments)) {
                return res.status(400).send({ status: false, msg: "installments should be in number format" })
            }
        }

        if (Object.values(data).includes(isFreeShipping)) {
            if (!(/^(?:true|false)$/).test(isFreeShipping)) return res.send({ status: false, message: "isFreeShipping must be true OR false" })
        }

        if (Object.values(data).includes(description)) {
            if (!isPresent(description)) return res.status(400).send({ status: false, message: "please provide value in description" })
        }

        let updatedProduct = await productModel.findOneAndUpdate({ _id: productId }, { $set: data }, { new: true })
        return res.status(200).send({ status: true, message: "Product updated successfully", data: updatedProduct })
    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


const deleteProduct = async function (req, res) {
    try {
        let productId = req.params.productId

        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "ProductId is not Valid" })

        const findproduct = await productModel.findById(productId)

        if (!findproduct || findproduct.isDeleted == true) return res.status(404).send({ status: false, message: "product not found or is already deleted" })

        let DeletedProduct = await productModel.findByIdAndUpdate({ _id: productId }, { isDeleted: true, deletedAt: new Date() })

        return res.status(200).send({ status: true, message: " Product Deleted successfully " })
    }
    catch (err) {
        console.log(err.message)
        res.status(500).send({ status: false, message: err.message })
    }
}


module.exports = { createProduct, getProduct, getProductByFilter, updateProduct, deleteProduct }