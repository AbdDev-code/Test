const mongoose = require("mongoose")

const feedbackSchema = new mongoose.Schema({
    chat_id:{
        type:Number,
        required:true
    },
    first_name:{
        type:String,
        required:true
    },
    feedback:{
        type:String,
        required:true
    },
    
})

const Feedback = mongoose.model("Feedback", feedbackSchema)
module.exports = Feedback