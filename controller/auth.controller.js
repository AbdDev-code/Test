const User = require("../models/user.model")

exports.register = async (user)=>{
    try{
        const reqUser= {
            chatId: user.chat_id,
            firstName: user.first_name,
            lastName: user.last_name,
            phone: user.phone,
        }
        const newUser =  User.create(reqUser)
        return true
    }catch(err){
        return false
    }
}

exports.findUser = async (chatId)=>{
    try{
        const user = await User.findOne({chatId})
        if(user){
            return true
        }
    }catch(err){
        return false
    }
}