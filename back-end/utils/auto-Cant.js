const cron = require("node-cron");
const moment = require("moment-timezone");
const Event = require("../models/Event");
const Unavailability = require("../models/Unavailability");

moment.tz.setDefault("Asia/Jakarta");

const AutoCantCron = () => {
    cron.schedule("0 0 * * *", async () => {
        try {
            const now = moment();
            const threeDaysAgo = new Date(now.clone().subtract(3, "days"));

            const events = await Event.find({ status: "terjadwal" });

            for (const event of events) {
                const eventCreatedAt = event._id.getTimestamp();

                // Lewatkan event yang belum mencapai batas waktu 3 hari
                if (eventCreatedAt >= threeDaysAgo) continue;

                let changed = false;

                // Karyawan Gudang
                for (const g of event.gudang) {
                    if (g.confirmation === 'menunggu') {
                        g.confirmation = 'tidak bisa';
                        await Unavailability.create({
                            user_id: g.user_id,
                            date: event.date_prepare
                        });
                        changed = true;
                    }
                }

                // Karyawan Dapur
                for (const d of event.dapur) {
                    for (const pj of d.penanggung_jawab) {
                        if (pj.confirmation === 'menunggu') {
                            pj.confirmation = 'tidak bisa';
                            await Unavailability.create({
                                user_id: pj.user_id,
                                date: event.date_service
                            });
                            changed = true;
                        }
                    }
                }

                // Supervisor
                const supervisor = event.supervisor;
                if (supervisor && supervisor.confirmation === 'menunggu') {
                    supervisor.confirmation = 'tidak bisa';
                    await Unavailability.create({
                        user_id: supervisor.id,
                        date: event.date_prepare
                    });
                    changed = true;
                }

                if (changed) {
                    await event.save();
                }
            }

            console.log('[CRON] Konfirmasi timeout -> berhasil diproses');
        } catch (error) {
            console.error('[CRON] Error dalam memproses konfirmasi timeout:', error);
        }
    });
};

module.exports = AutoCantCron;
