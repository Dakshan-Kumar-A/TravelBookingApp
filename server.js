
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const DATA_DIR = path.join(__dirname, 'data');
const DEST_FILE = path.join(DATA_DIR, 'destinations.json');
const BOOK_FILE = path.join(DATA_DIR, 'bookings.json');

async function readJSON(file) {
  try {
    const raw = await fs.readFile(file, 'utf-8');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeJSON(file, obj) {
  await fs.writeFile(file, JSON.stringify(obj, null, 2));
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Get all destinations
app.get('/api/destinations', async (_req, res) => {
  try {
    const dests = await readJSON(DEST_FILE);
    res.json(dests);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read destinations' });
  }
});

// Get destination by id
app.get('/api/destinations/:id', async (req, res) => {
  try {
    const dests = await readJSON(DEST_FILE);
    const dest = dests.find(d => String(d.id) === String(req.params.id));
    if (!dest) return res.status(404).json({ error: 'Destination not found' });
    res.json(dest);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read destinations' });
  }
});

// Create a booking
app.post('/api/book', async (req, res) => {
  try {
    const { name, email, phone, destinationId, travelers, startDate, endDate } = req.body;

    if (!name || !email || !destinationId || !travelers || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const dests = await readJSON(DEST_FILE);
    const dest = dests.find(d => String(d.id) === String(destinationId));
    if (!dest) return res.status(400).json({ error: 'Invalid destinationId' });

    const nights = Math.max(1, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000*60*60*24)));
    const total = dest.pricePerNight * nights * Number(travelers);

    const bookings = await readJSON(BOOK_FILE);
    const id = `${Date.now()}-${Math.floor(Math.random()*10000)}`;

    const booking = {
      id,
      createdAt: new Date().toISOString(),
      name,
      email,
      phone: phone || '',
      destinationId: String(destinationId),
      destinationName: dest.name,
      travelers: Number(travelers),
      startDate,
      endDate,
      nights,
      pricePerNight: dest.pricePerNight,
      total
    };

    bookings.push(booking);
    await writeJSON(BOOK_FILE, bookings);

    res.status(201).json({ message: 'Booking successful', booking });
  } catch (e) {
    res.status(500).json({ error: 'Failed to create booking' });
  }
});

// Get all bookings (simple admin)
app.get('/api/bookings', async (_req, res) => {
  try {
    const bookings = await readJSON(BOOK_FILE);
    res.json(bookings);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read bookings' });
  }
});

// Get one booking
app.get('/api/booking/:id', async (req, res) => {
  try {
    const bookings = await readJSON(BOOK_FILE);
    const b = bookings.find(x => x.id === req.params.id);
    if (!b) return res.status(404).json({ error: 'Booking not found' });
    res.json(b);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read bookings' });
  }
});

// Fallback to index.html for root
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
