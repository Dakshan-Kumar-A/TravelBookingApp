async function fetchJSON(url){
  const res = await fetch(url);
  if(!res.ok) throw new Error('Request failed');
  return await res.json();
}

function qsel(id){ return document.getElementById(id); }

async function loadDestinationsCards(){
  const container = qsel('destinations');
  container.innerHTML = '<p>Loading...</p>';
  try{
    const dests = await fetchJSON('/api/destinations');
    container.innerHTML = dests.map(d => `
      <div class="col-md-4">
        <div class="card h-100 shadow-sm">
          <img src="${d.image}" class="card-img-top" alt="${d.name}">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${d.name}</h5>
            <p class="card-text small text-muted mb-2">${d.country}</p>
            <p class="card-text">${d.description}</p>
            <div class="mt-auto d-flex justify-content-between align-items-center">
              <div class="fw-semibold">₹${d.pricePerNight}/night</div>
              <a href="booking.html?destinationId=${encodeURIComponent(d.id)}" class="btn btn-primary">Book</a>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }catch(e){
    container.innerHTML = '<div class="alert alert-danger">Failed to load destinations.</div>';
  }
}

async function populateDestinationSelect(selectEl, selectedId){
  const dests = await fetchJSON('/api/destinations');
  selectEl.innerHTML = dests.map(d => `<option value="${d.id}" ${d.id===selectedId?'selected':''}>${d.name} — ₹${d.pricePerNight}/night</option>`).join('');
  return dests;
}

async function initBookingPage(){
  const params = new URLSearchParams(location.search);
  const preselect = params.get('destinationId') || '';
  const select = document.getElementById('destinationSelect');
  const alertBox = document.getElementById('formAlert');

  const dests = await populateDestinationSelect(select, preselect);

  function updateSelectedCard(){
    const id = select.value;
    const d = dests.find(x => String(x.id)===String(id));
    if(!d) return;
    document.getElementById('selected-destination').innerHTML = `
      <div class="card shadow-sm">
        <div class="row g-0">
          <div class="col-md-4"><img src="${d.image}" alt="${d.name}" class="img-fluid rounded-start"></div>
          <div class="col-md-8">
            <div class="card-body">
              <h5 class="card-title">${d.name}</h5>
              <p class="card-text">${d.description}</p>
              <p class="card-text"><small class="text-muted">${d.highlights.join(' • ')}</small></p>
              <span class="badge bg-primary">₹${d.pricePerNight} per night</span>
            </div>
          </div>
        </div>
      </div>`;
  }
  select.addEventListener('change', updateSelectedCard);
  updateSelectedCard();

  document.getElementById('bookingForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    alertBox.className = 'alert d-none'; alertBox.textContent = '';

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());

    try{
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data)
      });
      const out = await res.json();
      if(!res.ok) throw new Error(out.error || 'Booking failed');
      sessionStorage.setItem('lastBooking', JSON.stringify(out.booking));
      location.href = `confirmation.html?id=${encodeURIComponent(out.booking.id)}`;
    }catch(err){
      alertBox.className = 'alert alert-danger';
      alertBox.textContent = err.message;
    }
  });
}

async function loadConfirmation(){
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  let booking = null;
  if(id){
    try { booking = await fetchJSON(`/api/booking/${id}`); } catch {}
  }
  if(!booking){
    try { booking = JSON.parse(sessionStorage.getItem('lastBooking')||'null'); } catch {}
  }
  const wrap = document.getElementById('summaryContent');
  if(!booking){ wrap.innerHTML = '<div class="alert alert-warning">No booking data found.</div>'; return; }

  wrap.innerHTML = `
    <div class="row">
      <div class="col-md-7">
        <h4 class="mb-3">${booking.destinationName}</h4>
        <dl class="row">
          <dt class="col-sm-4">Name</dt><dd class="col-sm-8">${booking.name}</dd>
          <dt class="col-sm-4">Email</dt><dd class="col-sm-8">${booking.email}</dd>
          <dt class="col-sm-4">Phone</dt><dd class="col-sm-8">${booking.phone || '-'}</dd>
          <dt class="col-sm-4">Travelers</dt><dd class="col-sm-8">${booking.travelers}</dd>
          <dt class="col-sm-4">Dates</dt><dd class="col-sm-8">${booking.startDate} → ${booking.endDate} (${booking.nights} night(s))</dd>
          <dt class="col-sm-4">Price/Night</dt><dd class="col-sm-8">₹${booking.pricePerNight}</dd>
          <dt class="col-sm-4 fw-bold">Total</dt><dd class="col-sm-8 fw-bold">₹${booking.total}</dd>
        </dl>
        <div class="text-muted small">Booking ID: ${booking.id}</div>
      </div>
    </div>
  `;

  // Download as JSON
  const blob = new Blob([JSON.stringify(booking, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const btn = document.getElementById('downloadBtn');
  btn.href = url;
  btn.download = `booking-${booking.id}.json`;
}

async function loadAdmin(){
  const rows = document.getElementById('bookingRows');
  rows.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
  try{
    const bookings = await fetchJSON('/api/bookings');
    rows.innerHTML = bookings.map(b => `
      <tr>
        <td>${b.id}</td>
        <td>${b.name}</td>
        <td>${b.destinationName}</td>
        <td>${b.startDate} → ${b.endDate}</td>
        <td>${b.travelers}</td>
        <td>₹${b.total}</td>
      </tr>
    `).join('');
  }catch(e){
    rows.innerHTML = '<tr><td colspan="6" class="text-danger">Failed to load bookings</td></tr>';
  }
}
