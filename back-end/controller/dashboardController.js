const User = require('../models/User');
const Event = require('../models/Event');

exports.getDashboardData = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'karyawan' });
        const totalEvents = await Event.countDocuments();

        const now = new Date();

        const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
        const endOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const endOfWeek = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 7));

        const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999));


        const todayEvent = await Event.countDocuments({
            date_service: {
                $gte: startOfDay,
                $lte: endOfDay
            }
        });

        const thisWeekEvent = await Event.countDocuments({
            date_service: {
                $gte: today,
                $lte: endOfWeek
            }
        });

        const thisMonthEvent = await Event.countDocuments({
            date_service: {
                $gte: startOfMonth,
                $lte: endOfMonth
            }
        });

        res.status(200).json({
            success: true,
            data: {
                totalUsers,
                totalEvents,
                upcomingEvents: {
                    today: todayEvent,
                    thisWeek: thisWeekEvent,
                    thisMonth: thisMonthEvent
                }
            }
        });
    } catch (error) {
        console.error('Error Saat Mengambil Data:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}