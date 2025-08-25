# Travel Booking Application

A simple full-stack prototype where users can browse destinations and make bookings.

## Tech
- Frontend: HTML, CSS, Bootstrap, JavaScript
- Backend: Node.js + Express
- Storage: JSON files (`data/`)

## Run Locally
```bash
cd travel-booking-app
npm install
npm start
# open http://localhost:5000
```

## API
- `GET /api/destinations` — list destinations
- `GET /api/destinations/:id` — one destination
- `POST /api/book` — create booking
- `GET /api/bookings` — list bookings (simple admin)
- `GET /api/booking/:id` — one booking

## Project Structure
```
travel-booking-app/
  public/
    css/style.css
    js/script.js
    images/*.svg
    index.html
    destinations.html
    booking.html
    confirmation.html
    admin.html
  data/
    destinations.json
    bookings.json
  server.js
  package.json
  .gitignore
```

## Notes
- Prices are sample values in INR.
- Upgrade path: replace JSON with a database (MongoDB/MySQL) and add authentication for admin.
