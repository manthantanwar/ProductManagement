const aws = require('aws-sdk')   
//amazon simple storage service

//configuring credentials - on whose account you are uploading the file
aws.config.update({
    accessKeyId: "AKIAY3L35MCRZNIRGT6N",
    secretAccessKey: "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",
    region: "ap-south-1" //in india aws region only : mumbai (ap-south-1)
})
//secretAccessKeyId was wrong , it is secretAccessKey

//MUST READ : async
let uploadFile= async (file) =>{
    return new Promise( function(resolve, reject) {
     // this function will upload file to aws and return the link
     let s3= new aws.S3({apiVersion: '2006-03-01'}); // we will be using the s3 service of aws
                                                    
 
     var uploadParams= {
         ACL: "public-read",
         Bucket: "classroom-training-bucket",  //HERE
         Key: "abc/" + file.originalname, //file will get saved with its original name in the sub folder abc 
         Body: file.buffer //file gets uploaded in small pieces whereby hackers don't hack it
         
     }
     
     //s3.upload : uploads the file in aws s3
     s3.upload( uploadParams, function (err, data ){
         if(err) {
             return reject({"error": err})
         }
        // console.log(data)
         console.log("file uploaded succesfully")
         return resolve(data.Location)//in data.Location URL of the uploaded file is present
     })
 
     // let data= await s3.upload( uploadParams)
     // if( data) return data.Location
     // else return "there is an error"
 
    })
 }

 


module.exports =  {uploadFile}

