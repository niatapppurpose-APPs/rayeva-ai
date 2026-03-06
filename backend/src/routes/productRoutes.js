const express = require('express');
const { classifyProduct } = require('../controllers/productController');

const router = express.Router();

router.post('/classify', classifyProduct);

module.exports = router;
