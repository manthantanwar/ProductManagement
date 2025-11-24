const userModel = require('../models/userModel');
const { isValidImage, isValidObjectId, isValidPincode, isValidMail, isValidName, isValidRequestBody, isPresent, isValidNumber, isValidPassword } = require('../validator/validator')
const bcrypt = require("bcrypt")
const { uploadFile } = require('../controllers/awsController');
const jwt = require('jsonwebtoken');
let mongoose = require('mongoose');




const createUser = async function (req, res) {
    try {
        let { fname, lname, email, phone, password, address } = req.body

        if (!isValidRequestBody(req.body)) return res.status(400).send({ status: false, message: "body cannot be empty" })

        if (!isPresent(fname) || !isValidName.test(fname)) return res.status(400).send({ status: false, message: "fname is missing or invalid" })

        if (!isPresent(lname) || !isValidName.test(lname)) return res.status(400).send({ status: false, message: "lname is missing or invalid" })

        if (!isPresent(email) || !isValidMail.test(email)) {
            return res.status(400).send({ status: false, message: "email is missing or invalid" })
        } else {
            let repeatedEmail = await userModel.findOne({ email: email })
            if (repeatedEmail) return res.status(400).send({ status: false, message: "email is already in use" })
        }

        if (!isPresent(phone) || !isValidNumber.test(phone)) {
            return res.status(400).send({ status: false, message: "phone is missing or invalid" })
        } else {
            let repeatedPhone = await userModel.findOne({ phone: phone })
            if (repeatedPhone) return res.status(400).send({ status: false, message: "phone is already in use" })
        }

        let profileImage = req.files

        if (profileImage && profileImage.length > 0) {
            if (!isValidImage(profileImage[0].originalname)) return res.status(400).send({ status: false, message: "enter a valid profile image" })
            let uploadedFileURL = await uploadFile(profileImage[0])
            //profileImage was available in req.files ; added new key in req.body.profileImage = uploadedFileURL
            req.body.profileImage = uploadedFileURL
        } else {
            return res.status(400).send({ status: false, message: "No file found" })
        }

        if (!isPresent(password) || !isValidPassword.test(password)) {
            return res.status(400).send({ status: false, message: "password is missing or invalid" })
        }

        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(password, salt)

        if (!address) {
            return res.status(400).send({ status: false, message: "address is required" })
        }

        let { shipping, billing } = address

        if (!shipping) {
            return res.status(400).send({ status: false, message: "shipping is required" })
        }

        if (!shipping.street || !shipping.city || !shipping.pincode) return res.status(400).send({ status: false, message: "shipping - street,city,pincode ; are required" })

        if (!billing) {
            return res.status(400).send({ status: false, message: "billing is required" })
        }

        if (!billing.street || !billing.city || !billing.pincode) return res.status(400).send({ status: false, message: "billing - street,city,pincode ; are required" })


        if (!isValidPincode.test(shipping.pincode) || !isValidPincode.test(billing.pincode)) {
            return res.status(400).send({ status: false, message: "Enter A Valid Pincode" })
        }

        if (!isValidName.test(shipping.city) || !isValidName.test(billing.city)) {
            return res.status(400).send({ status: false, message: "Enter A Valid City" })
        }

        let data = {
            fname: fname,
            lname: lname,
            email: email,
            phone: phone,
            password: hashedPassword,
            profileImage: req.body.profileImage,
            address: address

        }

        const createUser = await userModel.create(data)

        return res.status(201).send({ status: true, message: "successsfully created", data: createUser })

    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message })
    }
}

const loginUser = async function (req, res) {
    try {

        let email = req.body.email
        let password = req.body.password;

        if (!isValidRequestBody(req.body)) return res.status(400).send({ status: false, messaeg: "body cannot be empty" })

        if (!email || !password) return res.status(400).send({ status: false, message: "Email and Password are required" })

        let findUser = await userModel.findOne({ email: email })

        if (!findUser) return res.status(404).send({ status: false, message: "User not found" })

        let checkPassword = await bcrypt.compare(password, findUser.password)

        if (!checkPassword) return res.status(400).send({ status: false, message: "Incorrect Password" })

        let token = jwt.sign(
            {
                userId: findUser._id.toString(),
                iat: Math.floor(new Date().getTime() / 1000)
            },
            "Product5-group59",
            { expiresIn: "24h" });

        let data = {
            userId: findUser._id,
            token: token
        }
        return res.status(200).send({ status: true, message: "Login Successfull", data: data });

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}


const getUser = async function (req, res) {
    try {
        let userId = req.params.userId

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "UserId Is Invalid" })

        const fetchUser = await userModel.findById({ _id: userId })

        if (!fetchUser) return res.status(404).send({ status: false, message: "User Not Found" })

        //Authorization Check
        if (fetchUser._id != req.token.userId) return res.status(403).send({ status: false, msg: "Unauthorized User" })

        return res.status(200).send({ status: true, message: "User Profile Details", data: fetchUser })
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}

const updateuser = async (req, res) => {
    try {
        let userId = req.params.userId

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "UserId Is Invalid" })

        const fetchUser = await userModel.findById({ _id: userId })

        if (!fetchUser) return res.status(404).send({ status: false, message: "User Not Found" })

        //Authorization Check
        if (fetchUser._id != req.token.userId) return res.status(403).send({ status: false, msg: "Unauthorized User" })

        let { fname, lname, email, phone, password, address } = req.body

        let profileImage = req.files

        if (!isValidRequestBody(req.body) && !isPresent(profileImage)) return res.status(400).send({ status: false, message: "body cannot be empty" })

        let updateUser = {}

        if (Object.values(req.body).includes(fname)) {
            if (!isValidName.test(fname) || !isPresent(fname)) return res.status(400).send({ status: false, message: "Enter A Valid Fname" })
            updateUser["fname"] = fname

        }

        if (Object.values(req.body).includes(lname)) {
            if (!isValidName.test(lname) || !isPresent(lname)) return res.status(400).send({ status: false, message: "Enter A Valid Lname" })
            updateUser["lname"] = lname
        }

        if (Object.values(req.body).includes(email)) {
            if (!isValidMail.test(email) || !isPresent(email)) return res.status(400).send({ status: false, message: "Enter A Valid Email" })
            let repeatedEmail = await userModel.findOne({ email: email })
            if (repeatedEmail) return res.status(400).send({ status: false, message: `${email} Already In Use` })
            updateUser["email"] = email
        }

        if (Object.values(req.body).includes(phone)) {
            if (!isValidNumber.test(phone) || !isPresent(phone)) return res.status(400).send({ status: false, message: "Enter A Valid Phone Number" })
            let repeatedPhone = await userModel.findOne({ phone: phone })
            if (repeatedPhone) return res.status(400).send({ status: false, message: `${phone} Already In Use` })
            updateUser["phone"] = phone
        }

        if (Object.values(req.body).includes(password)) {
            if (!isValidPassword.test(password) || !isPresent(password)) return res.status(400).send({ status: false, message: "Enter A Valid Password" })
            const salt = await bcrypt.genSalt(10);
            let hashedPassword = await bcrypt.hash(password, salt)

            updateUser["password"] = hashedPassword
        }

        console.log(profileImage)
        //if empty : take profileImage from DB
        if (profileImage) {
            if (profileImage.length > 0) {
                if (!isValidImage(profileImage[0].originalname)) return res.status(400).send({ status: false, message: "enter a valid profile image" })
                let uploadedFileURL = await uploadFile(profileImage[0])
                req.body.profileImage = uploadedFileURL
                updateUser["profileImage"] = req.body.profileImage
            }
            if (!profileImage.length) {
                req.body["profileImage"] = fetchUser.profileImage
            }

        }

        if (Object.values(req.body).includes(address)) {
            let { shipping, billing } = address
            if (shipping) {
                if (Object.values(shipping).includes(shipping.city)) {
                    if (!isPresent(shipping.city) || !isValidName.test(shipping.city)) return res.status(400).send({ status: false, message: "shipping city is missing or invalid" })
                    updateUser["address.shipping.city"] = address.shipping.city
                }
                if (Object.values(shipping).includes(shipping.pincode)) {
                    if (!isPresent(shipping.pincode) || !isValidPincode.test(shipping.pincode)) return res.status(400).send({ status: false, message: "shipping pincode is missing or invalid" })
                    updateUser["address.shipping.pincode"] = address.shipping.pincode
                }
                if (Object.values(shipping).includes(shipping.street)) {
                    if (!isPresent(shipping.street)) return res.status(400).send({ status: false, message: "please provide a value in street" })
                    updateUser["address.shipping.street"] = address.shipping.street
                }

            }
            if (billing) {
                if (Object.values(billing).includes(billing.city)) {
                    if (!isPresent(billing.city) || !isValidName.test(billing.city)) return res.status(400).send({ status: false, message: "billing city is missing or invalid" })
                    updateUser["address.billing.city"] = address.billing.city
                }
                if (Object.values(billing).includes(billing.pincode)) {
                    if (!isPresent(billing.pincode) || !isValidPincode.test(billing.pincode)) return res.status(400).send({ status: false, message: " billing pincode is missing or invalid" })
                    updateUser["address.billing.pincode"] = address.billing.pincode
                }
                if (Object.values(billing).includes(billing.street)) {
                    if (!isPresent(billing.street)) return res.status(400).send({ status: false, message: "provide value in street" })
                    updateUser["address.billing.street"] = address.billing.street
                }
            }
        }

        let updateduser = await userModel.findOneAndUpdate(
            { _id: userId },
            updateUser,
            { new: true }

        )

        return res.send({ status: true, message: "updated user successfully", data: updateduser })
    }
    catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message })
    }
}



module.exports = { createUser, loginUser, getUser, updateuser }