const router = require('express').Router();
const { getSeatsByShowtime, createSeat } = require('../controllers/seatController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/showtime/:showtimeId', getSeatsByShowtime);
router.post('/', protect, adminOnly, createSeat);

module.exports = router;
