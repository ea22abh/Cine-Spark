const router = require('express').Router();
const {
  getAllMovies, getMovieById, getMovieShowtimes,
  createMovie, updateMovie, deleteMovie,
} = require('../controllers/movieController');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/', getAllMovies);
router.get('/:id', getMovieById);
router.get('/:id/showtimes', getMovieShowtimes);

router.post('/', protect, adminOnly, createMovie);
router.put('/:id', protect, adminOnly, updateMovie);
router.delete('/:id', protect, adminOnly, deleteMovie);

module.exports = router;
