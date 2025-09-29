const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

// Ako koristiš Node <18, treba ti ovo za fetch
// Ako koristiš Node 18+ možeš ovo zakomentirati
// const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Dostupne boje za korisnike
const availableColors = [
  '#FF5733', '#33FF57', '#3357FF',
  '#FF33A8', '#FFD433', '#33FFF6',
  '#8E44AD', '#E67E22', '#2ECC71'
];

// REGISTER
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Provjeri koje su boje zauzete
    const users = await User.find();
    const usedColors = users.map(u => u.color).filter(c => c);
    const freeColor = availableColors.find(c => !usedColors.includes(c)) || '#000000';

    // Hash lozinke
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      color: freeColor
    });
    await newUser.save();

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        color: newUser.color
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// LOGIN
// LOGIN
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.log('Login attempt:', { email, password });

  try {
    const user = await User.findOne({ email });
    console.log('User from DB:', user);

    if (!user) {
      console.log('User not found');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password hash from DB:', user.password);
    console.log('bcrypt.compare result:', isMatch);

    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email }
    });
  } catch (error) {
    console.error('Login route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// GET HOLIDAYS
router.get('/holidays', async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/HR`);
    const data = await response.json();

    // mapiraj u FullCalendar format
    const events = data.map(holiday => ({
      title: holiday.localName,
      date: holiday.date
    }));

    res.json(events);
  } catch (error) {
    console.error('Holiday API error:', error);
    res.status(500).json({ message: 'Error fetching holidays' });
  }
});

// GET CURRENT USER
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('_id username email color');
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch (error) {
    console.error('Me route error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
