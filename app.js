const express = require('express');
const morgan = require('morgan');
const urlRouter = require('./routes/urlRouter');
const cors = require('cors');

// creating app using express instance
const app = express();

app.use(cors({
    origin: '*'
}));

// adding middleware to acces body of post requests
app.use(express.json({ limit: "10kb" }))

// logger middleware
if (process.env.node_env === 'developement') {
    app.use(morgan("dev"));
}

// router middleware
app.use("/convert", urlRouter)

// error controller
app.use((err, req, res, next) => {
    res.status(404).json({
        status: "fail",
        message: "Something went wrong"
    })
})

module.exports = app;