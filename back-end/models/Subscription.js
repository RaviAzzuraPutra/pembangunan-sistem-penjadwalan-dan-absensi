const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subscription: { type: Object, required: true },
    endpoint: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);