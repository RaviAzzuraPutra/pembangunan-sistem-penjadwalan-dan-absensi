const cron = require("node-cron");
const moment = require("moment-timezone");
const Event = require("../models/Event");

moment.tz.setDefault("Asia/Jakarta");

const StartEventStatusCron = () => {
    cron.schedule("* * * * *", async () => {
        try {
            const events = await Event.find({ status: { $ne: "selesai" } });
            const now = moment();

            for (const event of events) {
                const prepareStart = moment(`${moment(event.date_prepare).format("YYYY-MM-DD")} ${event.time_start_prepare}`, "YYYY-MM-DD HH:mm");
                const serviceEnd = moment(`${moment(event.date_service).format("YYYY-MM-DD")} ${event.time_end_service}`, "YYYY-MM-DD HH:mm");

                let newStatus = event.status;

                if (now.isSameOrAfter(serviceEnd)) {
                    newStatus = "selesai"
                } else if (now.isSameOrAfter(prepareStart)) {
                    newStatus = "berlangsung"
                } else {
                    newStatus = "terjadwal"
                }

                if (newStatus !== event.status) {
                    event.status = newStatus;
                    await event.save();
                }
            }
        } catch (error) {
            console.error("Gagal Mengubah Status Event: ", error)
        }
    })
}

module.exports = StartEventStatusCron;