const cron = require("node-cron");
const moment = require("moment-timezone");
const Event = require("../models/Event");
const Attendance = require("../models/Attendance");

moment.tz.setDefault("Asia/Jakarta");

const AutoAbsentCron = () => {
    cron.schedule("*/5 * * * *", async () => {
        try {
            const now = moment();
            const events = await Event.find({
                status: { $in: ["berlangsung", "selesai"] },
            });

            for (const event of events) {
                const {
                    _id: eventId,
                    date_prepare,
                    time_end_prepare,
                    date_service,
                    time_end_service,
                    gudang,
                    dapur,
                } = event;

                const prepareEnd = moment(`${moment(date_prepare).format("YYYY-MM-DD")} ${time_end_prepare}`, "YYYY-MM-DD HH:mm");
                const serviceEnd = moment(`${moment(date_service).format("YYYY-MM-DD")} ${time_end_service}`, "YYYY-MM-DD HH:mm");

                if (now.isAfter(prepareEnd)) {
                    await markAbsent(eventId, [...gudang, ...dapur], "prepare");
                }

                if (now.isAfter(serviceEnd)) {
                    await markAbsent(eventId, [...gudang, ...dapur], "service");
                }
            }
        } catch (error) {
            console.error("Gagal Menandai Absen Otomatis: ", error);
        }
    });
};

async function markAbsent(eventId, participants, tahap) {
    for (const user of participants) {
        const alreadyAttend = await Attendance.exists({
            event_id: eventId,
            user_id: user.user_id,
            tahap,
        });

        if (!alreadyAttend) {
            await Attendance.create({
                event_id: eventId,
                user_id: user.user_id,
                tahap,
                timestamp: new Date(),
                face_match: false,
                status: "gagal",
                location: { latitude: 0, longitude: 0 },
            });

            console.log(`Absen gagal otomatis dibuat untuk user ${user.user_id} tahap ${tahap}`);
        }
    }
}

module.exports = AutoAbsentCron;
