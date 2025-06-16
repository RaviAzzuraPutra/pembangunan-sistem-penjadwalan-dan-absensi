const cron = require("node-cron");
const moment = require("moment-timezone");
const Event = require("../models/Event");
const Unavailability = require("../models/Unavailability");

moment.tz.setDefault("Asia/Jakarta");

const AutoCantCron = () => {
    cron.schedule("0 0 * * *", async () => {
        try {
            const now = moment();
            const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

            const events = await Event.find({ status: "terjadwal" });

            for (const event of events) {
                // Cek gudang
                for (const g of event.gudang) {
                    const createdAt = g._id.getTimestamp();
                    if (g.confirmation === 'menunggu' && createdAt < twoDaysAgo) {
                        g.confirmation = 'tidak bisa';
                        await Unavailability.create({ user_id: g.user_id, date: event.date_prepare });
                    }
                }

                // Cek dapur
                for (const d of event.dapur) {
                    for (const pj of d.penanggung_jawab) {
                        const createdAt = pj._id.getTimestamp();
                        if (pj.confirmation === 'menunggu' && createdAt < twoDaysAgo) {
                            pj.confirmation = 'tidak bisa';
                            await Unavailability.create({ user_id: pj.user_id, date: event.date_service });
                        }
                    }
                }

                // Cek supervisor
                const supervisor = event.supervisor;
                if (supervisor.confirmation === 'menunggu' && event._id.getTimestamp() < twoDaysAgo) {
                    supervisor.confirmation = 'tidak bisa';
                    await Unavailability.create({ user_id: s.id, date: event.date_prepare });
                }

                await event.save();
            }

            console.log('[CRON] Konfirmasi timeout -> berhasil diproses');
        } catch (error) {
            console.error('[CRON] Error dalam memproses konfirmasi timeout:', error);
        }
    })
}

module.exports = AutoCantCron;