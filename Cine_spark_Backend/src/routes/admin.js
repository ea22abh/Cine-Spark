const router = require('express').Router();
const {
  getAllMoviesAdmin,
  getDashboard,
  getAllUsers, updateUserRole,
  getAllBookings, updateBookingStatus,
  getAllScreens, createScreen, updateScreen, deleteScreen,
  generateSeats,
  updateAdminProfile, updateAdminPassword,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect, adminOnly);

// All movies (admin — includes inactive)
router.get('/movies', getAllMoviesAdmin);

// Dashboard
router.get('/dashboard', getDashboard);

// Users
router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);

// Bookings
router.get('/bookings', getAllBookings);
router.patch('/bookings/:id/status', updateBookingStatus);

// Screens — full CRUD
router.get('/screens', getAllScreens);
router.post('/screens', createScreen);
router.put('/screens/:id', updateScreen);
router.delete('/screens/:id', deleteScreen);

// Seat allocation — bulk generate layout for a screen
router.post('/screens/:id/generate-seats', generateSeats);

// Admin profile management
router.put('/profile', updateAdminProfile);
router.put('/password', updateAdminPassword);

module.exports = router;
