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

                // Tahap PREPARE untuk gudang
                if (now.isAfter(prepareEnd)) {
                    const gudangPrepare = gudang
                        .filter(g => g.tahap.includes("prepare"))
                        .map(g => g.user_id);

                    if (gudangPrepare.length) {
                        await markAbsent(eventId, gudangPrepare, "prepare");
                    }
                }

                // Tahap SERVICE untuk gudang dan dapur
                if (now.isAfter(serviceEnd)) {
                    const gudangService = gudang
                        .filter(g => g.tahap.includes("service"))
                        .map(g => g.user_id);

                    const dapurService = dapur.flatMap(d =>
                        d.penanggung_jawab.map(pj => pj.user_id)
                    );

                    const allServiceUsers = [...gudangService, ...dapurService];

                    if (allServiceUsers.length) {
                        await markAbsent(eventId, allServiceUsers, "service");
                    }
                }

                const supervisorId = event.supervisor?.id?.toString();

                if (supervisorId) {
                    if (now.isAfter(prepareEnd)) {
                        await markAbsent(eventId, [supervisorId], "prepare");
                    }

                    if (now.isAfter(serviceEnd)) {
                        await markAbsent(eventId, [supervisorId], "service");
                    }
                }
            }
        } catch (error) {
            console.error("Gagal Menandai Absen Otomatis: ", error);
        }
    });
};

async function markAbsent(eventId, participants, tahap) {
    for (const userId of participants) {
        if (!userId || !userId.toString().trim()) {
            console.warn(`Lewati absen otomatis karena user_id undefined pada tahap ${tahap}`);
            continue;
        }

        const alreadyAttend = await Attendance.exists({
            event_id: eventId,
            user_id: userId,
            tahap,
        });

        if (!alreadyAttend) {
            try {
                await Attendance.create({
                    event_id: eventId,
                    user_id: userId,
                    tahap,
                    timestamp: new Date(),
                    face_match: false,
                    status: "gagal",
                    location: { latitude: 0, longitude: 0 },
                });

                console.log(`✅ Absen otomatis GAGAL ditandai untuk user ${userId} pada tahap ${tahap}`);
            } catch (err) {
                console.error(`❌ Gagal membuat absen otomatis untuk user ${userId} pada tahap ${tahap}:`, err);
            }
        }
    }
}

module.exports = AutoAbsentCron;

