const mongoose = require('mongoose');

const textScheme = mongoose.Schema({
    name: String,
    text: String
})

const Text = mongoose.model("Texts", textScheme)

module.exports = Text
