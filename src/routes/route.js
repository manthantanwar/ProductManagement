const express = require('express')
const router = express.Router();
const userController = require('../controllers/userController');
const productController = require('../controllers/productController');
const cartController = require('../controllers/cartController');
const orderController = require('../controllers/orderController')
const middleware = require('../middleware/auth')

//UserAPI's
router.post('/register', userController.createUser);

router.post('/login',userController.loginUser);

router.get('/user/:userId/profile',middleware.authentication,userController.getUser);

router.put('/user/:userId/profile',middleware.authentication,userController.updateuser);

//Product API's
router.post('/products',productController.createProduct);

router.get('/products/:productId',productController.getProduct);

router.get('/products',productController.getProductByFilter);

router.put('/products/:productId',productController.updateProduct);

router.delete('/products/:productId',productController.deleteProduct);

//Cart API's
router.post('/users/:userId/cart',middleware.authentication,cartController.createCart);

router.put('/users/:userId/cart',middleware.authentication,cartController.updateCart);

router.get('/users/:userId/cart',middleware.authentication,cartController.getCart);

router.delete('/users/:userId/cart',middleware.authentication,cartController.deleteCart);

//Order API's

router.post ('/users/:userId/orders',middleware.authentication,orderController.createOrder);

router.put('/users/:userId/orders',middleware.authentication,orderController.updateOrder)

router.all('/*', (req, res) => { return res.status(400).send({ status: false, message: "Endpoint Is Incorrect" }) })
module.exports = router;