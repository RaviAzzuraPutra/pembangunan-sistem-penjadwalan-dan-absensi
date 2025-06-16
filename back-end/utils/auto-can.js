const cron = require("node-cron");
const moment = require("moment-timezone");
const Event = require("../models/Event");

const AutoCanCron = () => {
    cron.schedule("*/30 * * * *", async () => {
        try {
            const now = moment();
            const events = await Event.find({
                status: "terjadwal",
                $or: [
                    { date_prepare: { $lt: now } },
                    { date_service: { $lt: now } }
                ]
            });

            for (const event of events) {
                for (const g of event.gudang) {
                    if (g.confirmation === 'menunggu') {
                        g.confirmation = 'bisa';
                    }
                }

                for (const d of event.dapur) {
                    for (const pj of d.penanggung_jawab) {
                        if (pj.confirmation === 'menunggu') {
                            pj.confirmation = 'bisa';
                        }
                    }
                }

                const supervisor = event.supervisor;
                if (supervisor.confirmation === 'menunggu') {
                    supervisor.confirmation = 'bisa';
                }

                await event.save();
            }
            console.log('[CRON] Konfirmasi bisa -> berhasil diproses');
        } catch (error) {
            console.error('[CRON] Error dalam memproses konfirmasi bisa:', error);
        }
    })
}
module.exports = AutoCanCron;