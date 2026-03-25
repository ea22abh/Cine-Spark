const router = require('express').Router();
const {
  getAllShowtimes, getShowtimeById,
  createShowtime, updateShowtime, deleteShowtime,
} = require('../controllers/showtimeController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getAllShowtimes);
router.get('/:id', getShowtimeById);

router.post('/', protect, adminOnly, createShowtime);
router.put('/:id', protect, adminOnly, updateShowtime);
router.delete('/:id', protect, adminOnly, deleteShowtime);

module.exports = router;
