const Feedback= require("../models/feedback.model")

// Shikoyat && Takliflar
// create feedback
exports.createFeedback = async (feedback) => {
    try {
        const newFeedback = {
            chat_id: feedback.chat_id,
            first_name: feedback.first_name,
            feedback: feedback.feedback,
        }
        const result = await Feedback.create(newFeedback)
        return true
    } catch (error) {
        console.log(error)
        return false
    }
}


// all feedback
exports.allFeedback = async () => {
    try {
        const result = await Feedback.find()
        return result
    } catch (error) {
        console.log(error)
        return []
    }
}
