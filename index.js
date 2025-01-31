const TelegramBot = require("node-telegram-bot-api")
const dotenv = require("dotenv").config()
const ConnectDB = require("./config/config/db")
const bot  = new TelegramBot(process.env.TOKEN, {polling:true})
const {findUser,register}= require("./controller/auth.controller")
const {createFeedback} = require("./controller/feedback.controller")
const User = require("./models/user.model")
const Feedback = require("./models/feedback.model")
const testQuestions = require("./data/data.json")
const mongoose = require("mongoose")
require("colors")
ConnectDB()
// register user
const user = {
    chat_id: null,
    first_name:"",
    last_name:"",
    phone:"",
}
//  Bosh menu buttons
const mainMenu = {
    reply_markup:{
        keyboard:[
            [{text:"📝Test topshirish📝"}],
            [{text:"📊Testlar reytingi📊"}],
            [{text:"🤪Shikoyat && Takliflar😜"}]
        ],
        resize_keyboard:true,
    }
}


// Start
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id
    const exists = await  findUser(chatId)
    if(exists){
        bot.sendMessage(chatId, "Bosh menu",mainMenu)
    }else{
        user.chat_id = chatId
        bot.sendMessage(chatId, " Siz hali ro'yxatdan o'tmagansiz shuning uchun avval ro'yxatdan o'ting!!")
        bot.sendMessage(chatId, "👤Ismingizni kiriting👤")
        bot.once("message", async (msg)=>{
            user.first_name = msg.text
            bot.sendMessage(chatId, "👤Familiyangizni kiriting👤")
            bot.once("message", async (msg)=>{
                user.last_name = msg.text
                bot.sendMessage(chatId, "📞Telefon raqamingizni kiriting📞",{
                    reply_markup:{
                        keyboard:[
                            [{text:"📞Telefon raqamni yuborish📞", request_contact:true}],
                        ],
                        resize_keyboard:true,
                        one_time_keyboard:true
                    }
                })
                bot.once("contact", async (msg)=>{
                    user.phone = msg.contact.phone_number
                    const newUser = await register(user)
                    if(newUser === true){
                        bot.sendMessage(chatId, "🎉🥳Siz muvafaqiyatli ro'yxatdan o'tdingiz🥳🎉")
                        bot.sendMessage(chatId, "Bosh menu",mainMenu)
                    }else{
                        bot.sendMessage(chatId, "Ro'yxatdan o'tishda xatolik")
                    }
                })
            })
        })
    }
})

// Back to menu
bot.onText(/⬅️Orqaga qaytish/,async (msg)=>{
    const chatId = msg.chat.id
    bot.sendMessage(chatId,"Bosh Menu",mainMenu)
})

// Test topshirish
bot.onText(/📝Test topshirish📝/, async (msg) => {
    const chatId = msg.chat.id
    bot.sendMessage(chatId, "👥Guruhingizni tanlang👥",{
        reply_markup:{
            keyboard:[
                [{text:"💻Ninja NodeJS 2 guruh💻"}],
                [{text:"⬅️Orqaga qaytish"}]
            ],
            resize_keyboard:true,
            one_time_keyboard:true
        }
    })
})

// Test Boshlash
bot.onText(/💻Ninja NodeJS 2 guruh💻/, async (msg) => {
    const chatId = msg.chat.id
    bot.sendMessage(chatId, "Testni boshlamoqchi bo'lsangiz \n Testni boshlash tugmasini bosing",{
        reply_markup:{
            keyboard:[
                [{text:"🚀Testni boshlash🚀"}],
                [{text:"⬅️Orqaga qaytish"}]
            ],
            resize_keyboard:true,
            one_time_keyboard:true
        }
    })
})



// Testni boshlash
bot.onText(/🚀Testni boshlash🚀/, async (msg) => {
    const chatId = msg.chat.id;

    try {
        // Foydalanuvchini bazadan topish
        let user = await User.findOne({ chatId });
        if (!user) {
            user = new User({ chatId, firstName: msg.chat.first_name, testResult: [], testRequest: 0 });
            await user.save();
        }

        // Testni boshlash
        bot.sendMessage(chatId, "Node.js bo‘yicha test boshlandi 🚀");
        startTest(chatId, user);
    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "Xatolik yuz berdi! Iltimos, keyinroq urinib ko‘ring.");
    }
});

// Testni boshlash
async function startTest(chatId, user) {
    let score = 0;
    let questionIndex = 0;
    let lastMessageId = null;
    
    // Savollarni random qilish (Fisher-Yates shuffle algoritmi)
    let shuffledQuestions = [...testQuestions].sort(() => Math.random() - 0.5);

    async function askQuestion() {
        if (questionIndex < shuffledQuestions.length) {
            const questionData = shuffledQuestions[questionIndex];
            const options = {
                reply_markup: {
                    inline_keyboard: questionData.option.map((opt, idx) => [
                        { text: opt, callback_data: JSON.stringify({ q: questionIndex, a: idx }) },
                    ]),
                },
            };

            // Avvalgi xabarni o‘chirish
            if (lastMessageId) {
                await bot.deleteMessage(chatId, lastMessageId).catch(() => {});
            }

            bot.sendMessage(chatId, `❓ *Savol ${questionIndex + 1}:* ${questionData.question}`, {
                parse_mode: "Markdown",
                ...options,
            }).then((sentMessage) => {
                lastMessageId = sentMessage.message_id;
            });
        } else {
            // Test yakunlandi
            await User.findOneAndUpdate(
                { chatId },
                {
                    $push: { testResult: { score, total: shuffledQuestions.length } },
                }
            );

            // **Foydalanuvchiga natija yuborish**
            bot.sendMessage(
                chatId,
                `✅ *Test yakunlandi!* \nSiz *${shuffledQuestions.length}* ta savoldan *${score}* tasiga to‘g‘ri javob berdingiz! 🎉`,
                mainMenu
            );

            // **📩 NATIJANI KANALGA JO‘NATISH**
            const CHANNEL_ID = "@test_resultss"; // O‘zingizning kanal ID'nizni qo‘ying
            const resultMessage = `📢 *Test natijasi* 📢\n\n` +
                `👤 *Foydalanuvchi:* ${user.firstName || "Noma'lum"}\n` +
                `📊 *Natija:* ${score} / ${shuffledQuestions.length}\n` +
                `📅 *Sana:* ${new Date().toLocaleString("uz-UZ")}`;

            bot.sendMessage(CHANNEL_ID, resultMessage, { parse_mode: "Markdown" });
        }
    }

    bot.on("callback_query", async (callbackQuery) => {
        const { message, data } = callbackQuery;
        const chatId = message.chat.id;
        const { q, a } = JSON.parse(data);

        // Agar foydalanuvchi allaqachon javob bergan bo'lsa, e'tiborga olmaslik
        if (q !== questionIndex) return;

        // Javobni tekshirish
        if (shuffledQuestions[q].answer === a) {
            score++;
        }

        questionIndex++;
        askQuestion();
    });

    askQuestion();
}



bot.onText(/📊Testlar reytingi📊/, async (msg) => {
    const chatId = msg.chat.id;
    try {
        const allUsers = await User.find({}).sort({ "testResult.score": -1 });
        
        if (!allUsers.length) {
            return bot.sendMessage(chatId, "Hali hech kim test topshirmagan!");
        }

        let rankingText = "📊 *Testlar reytingi* 📊\n\n";
        let userRank = 0;
        let userScore = 0;
        let userTotal = 0;
        let isInTop10 = false;

        allUsers.forEach((user, index) => {
            if (user.chatId === chatId) {
                userRank = index + 1;
                if (user.testResult.length) {
                    userScore = user.testResult[0].score;
                    userTotal = user.testResult[0].total;
                }
                if (userRank <= 10) isInTop10 = true;
            }
        });

        // Top 10 foydalanuvchilar ro‘yxati
        allUsers.slice(0, 10).forEach((user, index) => {
            const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
            const userScore = user.testResult.length ? user.testResult[0].score : 0;
            const userTotal = user.testResult.length ? user.testResult[0].total : 0;
            rankingText += `${medal} ${user.firstName || "Noma'lum foydalanuvchi"} - *${userScore}/${userTotal}*\n`;
        });

        // Agar foydalanuvchi Top 10 da bo‘lmasa, uning o‘rni alohida yoziladi
        if (!isInTop10 && userRank > 0) {
            rankingText += `\nSiz ${userRank}-o‘rindasiz: *${userScore}/${userTotal}*`;
        }

        bot.sendMessage(chatId, rankingText, { parse_mode: "Markdown" });

    } catch (error) {
        console.error(error);
        bot.sendMessage(chatId, "Xatolik yuz berdi! Iltimos, keyinroq urinib ko‘ring.");
    }
});



// Feedback olish va avtomatik kanalga yuborish
bot.onText(/🤪Shikoyat && Takliflar😜/, async (msg) => {
    const CHANNEL_ID = "@testnodejsfeedback"; // Kanalingiz username'ini kiriting
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "Shikoyat va takliflaringizni qoldiring!");

    bot.once("message", async (responseMsg) => {
        if (!responseMsg.text) {
            return bot.sendMessage(chatId, "❌ Iltimos, faqat matnli xabar yuboring!");
        }
        const feedbackText = responseMsg.text;
        
        try {
            const user = await User.findOne({chatId}); // `chatId` o'rniga `chat_id` ishlatamiz
            
            if (!user) {
                return bot.sendMessage(chatId, "❌ Foydalanuvchi ma'lumotlari topilmadi.");
            }
            await Feedback.deleteMany({ chat_id: chatId });

            // Yangi feedback yaratish
            const newFeedback = await Feedback.create({
                chat_id: chatId,
                first_name: user.firstName || "Noma'lum",
                feedback: feedbackText,
            });


            // Foydalanuvchiga tasdiqlash xabari yuborish
            bot.sendMessage(chatId, "✅ Shikoyat yoki taklifingiz muvaffaqiyatli qabul qilindi!");

            // Feedbackni kanalda e’lon qilish
            const messageText = `📩 Yangi Feedback 📩\n\n` +
                `👤 Foydalanuvchi: ${newFeedback.first_name}\n` +
                `💬 Xabar: ${newFeedback.feedback}\n` 

            bot.sendMessage(CHANNEL_ID, messageText, );
            

            
        } catch (error) {
            console.error("Xatolik: ", error.message);
            bot.sendMessage(chatId, `❌ Xatolik yuz berdi: ${error.message}`);
        }
    });
});
