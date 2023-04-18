const express = require('express');
const { convertVideo, qnaHandler } = require('../controllers/conversionController');

const urlRouter = express.Router()

// route for sending request to create qna system
urlRouter
    .route("/")
    .post(convertVideo)

//  route for accessing qna system
urlRouter
    .route("/qna")
    .post(qnaHandler)

module.exports = urlRouter
