const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: "./configure.env" });

// shutting down server uncaught exceptions
process.on("uncaughtException", (err) => {
    console.log("uncaught exception.. shutting down");
    console.log("error", err);
    process.exit(1);
})

const app = require('./app');

// connecting to database
mongoose.connect(process.env.DATABASE_CONNECTION)
    .then(() => {
        console.log("db connected");
    }).catch((err) => {
        console.log("db not connected" + err);
    })

// starting server
const server = app.listen(process.env.PORT || 7000, () => {
    console.log("server has been started");
})

// shutting down server on unhandled rejection
process.on("unhandledRejection", (err) => {
    console.log("unhandled rejection.. shutting down");
    console.log("error", err.name, err.message);
    server.close(() => {
        process.exit(1);
    })
})