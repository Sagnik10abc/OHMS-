// Load user bookings
async function loadBookings() {
    try {
        const response = await fetch('/api/bookings');
        
        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Failed to load bookings');
        }

        const bookings = await response.json();
        const bookingsList = document.getElementById('bookingsList');

        if (bookings.length === 0) {
            bookingsList.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h3>No bookings yet</h3>
                    <p>Book a room to see your reservations here</p>
                    <a href="rooms.html" class="btn btn-primary">Browse Rooms</a>
                </div>
            `;
            return;
        }

        bookingsList.innerHTML = bookings.map(booking => `
            <div class="booking-card">
                <div class="booking-header">
                    <div class="booking-id">Booking #${booking.id}</div>
                    <div class="status-badge status-${booking.status}">
                        ${booking.status.toUpperCase()}
                    </div>
                </div>
                <div class="booking-details">
                    <div class="detail-item">
                        <div class="detail-label">Room</div>
                        <div class="detail-value">${booking.roomName}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Check-in</div>
                        <div class="detail-value">${new Date(booking.checkIn).toLocaleDateString()}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Check-out</div>
                        <div class="detail-value">${new Date(booking.checkOut).toLocaleDateString()}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Guests</div>
                        <div class="detail-value">${booking.guests}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Nights</div>
                        <div class="detail-value">${booking.nights}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Total Amount</div>
                        <div class="detail-value">₹${booking.totalAmount}</div>
                    </div>
                </div>
                <div class="booking-actions">
                    ${booking.status === 'confirmed' ? 
                        `<button class="btn btn-primary" onclick="downloadInvoice(${booking.id})">Download Invoice</button>` :
                        `<button class="btn btn-warning" disabled>Payment Pending</button>`
                    }
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('bookingsList').innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <p style="color: red;">Error loading bookings. Please try again.</p>
            </div>
        `;
    }
}

// Download invoice
function downloadInvoice(bookingId) {
    window.location.href = `/api/invoice/${bookingId}`;
}

// Load bookings on page load
document.addEventListener('DOMContentLoaded', async () => {
    const user = await checkAuth();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    loadBookings();
});
