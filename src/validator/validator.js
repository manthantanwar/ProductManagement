let mongoose = require('mongoose')

const isValidMail = (/^([0-9a-zA-Z]([-_\\.]*[0-9a-zA-Z]+)*)@([a-z]([-_\\.]*[a-z]+)*)[\\.]([a-z]{2,9})+$/);

const isValidName = (/^[a-zA-Z ]*$/)

const isValidTitle = (/^[a-zA-Z0-9,-. ]*$/)

const isValidPassword = (/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/)

const isValidPincode = (/^\d{3}\s?\d{3}$/)

const isValidNumber = (/^[6-9][0-9]{9}$/)

const isValidImage = (image)=>{
    let pattern = ("[^\\s]+(.*?)\\.(jpg|jpeg|png|JPG|JPEG|PNG)$")
    return image.match(pattern)
}

const isValidRequestBody = (value) => {
    return Object.keys(value).length > 0
}

const isPresent = (value) => {
    if (typeof value === "undefined" || value === null) return false
    if (typeof value === "string" && value.trim().length === 0) return false//.trim() :remove spaces, should not mistake empty space as value
   
    return true
}

const isValidObjectId = (ObjectId) => {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}



module.exports = {isValidImage,isValidObjectId,isValidTitle,isValidPincode, isValidMail, isValidName, isValidRequestBody, isPresent, isValidNumber, isValidPassword }