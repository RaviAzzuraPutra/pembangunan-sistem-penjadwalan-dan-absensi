const { client } = require("../controller/whatsappController");

const sendMessage = async (Number, message) => {
    try {
        const formattedNumber = Number.includes('@c.us') ? Number : `${Number}@c.us`;
        const sendMessageResponse = await client.sendMessage(formattedNumber, message);
        return sendMessageResponse
    } catch (error) {
        return error.message;
    }
}

module.exports = sendMessage;