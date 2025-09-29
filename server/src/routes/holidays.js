const express = require('express');
const axios = require('axios');
const router = express.Router();

// Endpoint za dohvat državnih blagdana
router.get('/', async (req, res) => {
  try {
    const response = await axios.get(
      'https://date.nager.at/api/v3/PublicHolidays/2025/HR'
    );

    const holidays = response.data;

    // Formatiraj za FullCalendar
const formattedHolidays = holidays.map(h => ({
  id: `holiday-${h.date}`,
  title: h.localName,
  start: `${h.date}T00:00:00`, // start of the day
  end: `${h.date}T23:59:59`,   // end of the day
  allDay: false,               // important: do NOT use allDay
  backgroundColor: '#EF4444',
  borderColor: '#8B0000',
  textColor: 'white',
  extendedProps: { isHoliday: true },
  editable: false
}));

    res.json(formattedHolidays);
  } catch (error) {
    console.error('Greška kod dohvaćanja blagdana:', error.message);
    res.status(500).json({ message: 'Greška kod dohvaćanja blagdana' });
  }
});

module.exports = router;
