const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    chatId: {
        type: Number,
        required: true,
        unique: true
    },
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String
    },
    phone: {
        type: String,
    },
    testRequest: {
       type:Array,
    },
    testResult: {
        type:Array,
    },
}, {timestamps: true})

const User = mongoose.model("User", userSchema)
module.exports = User