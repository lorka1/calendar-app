const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const auth = require('../middleware/auth');
// const user = req.user; // auth middleware već dodaje usera
// const newEvent = new Event({
//   title,
//   description: description || 'No description',
//   startTime: new Date(startTime),
//   endTime: new Date(endTime),
//   createdBy: user._id,
//   color: user.color || '#000000' // dodaj boju
// });
// Create a new event
router.post('/', auth, async (req, res) => {
  try {
    const { title, description, startTime, endTime } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ message: 'Title, startTime, and endTime are required' });
    }

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized: No user info' });
    }

  const newEvent = new Event({
  title,
  description: description || '',
  startTime: new Date(startTime),
  endTime: new Date(endTime),
  createdBy: req.user._id,
  color: req.user.color || '#000000'  // dodaj boju
});

    await newEvent.save();

    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error saving event:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/events - svi eventi
router.get('/', auth, async (req, res) => {
  try {
    const events = await Event.find().populate('createdBy', 'username');
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// Get an event by ID
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).send();
        }
        res.status(200).send(event);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Update an event by ID
router.patch('/:id', async (req, res) => {
    try {
        const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!event) {
            return res.status(404).send();
        }
        res.status(200).send(event);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Delete an event by ID
router.delete('/:id', async (req, res) => {
    try {
        const event = await Event.findByIdAndDelete(req.params.id);
        if (!event) {
            return res.status(404).send();
        }
        res.status(200).send(event);
    } catch (error) {
        res.status(500).send(error);
    }
});

module.exports = router;