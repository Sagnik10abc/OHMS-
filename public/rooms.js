let currentRoom = null;
let currentBooking = null;
let completedBookingId = null;

// Load rooms
async function loadRooms() {
    try {
        const response = await fetch('/api/rooms');
        const rooms = await response.json();
        
        const roomsGrid = document.getElementById('roomsGrid');
        roomsGrid.innerHTML = rooms.map(room => `
            <div class="room-card">
                <div class="room-image">🏨</div>
                <div class="room-info">
                    <h3>${room.name}</h3>
                    <p>${room.description}</p>
                    <div class="room-price">₹${room.price}/night</div>
                    <p class="room-available">Available: ${room.available} rooms</p>
                    <button class="btn btn-primary btn-block" onclick="openBookingModal(${room.id})">Book Now</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading rooms:', error);
    }
}

// Open booking modal
async function openBookingModal(roomId) {
    // Check if user is logged in
    const user = await checkAuth();
    if (!user) {
        alert('Please login to book a room');
        window.location.href = 'login.html';
        return;
    }

    try {
        const response = await fetch(`/api/rooms/${roomId}`);
        currentRoom = await response.json();
        
        document.getElementById('selectedRoomId').value = currentRoom.id;
        document.getElementById('selectedRoomDetails').innerHTML = `
            <h3>${currentRoom.name}</h3>
            <p>${currentRoom.description}</p>
            <p><strong>Price:</strong> ₹${currentRoom.price}/night</p>
        `;
        document.getElementById('pricePerNight').textContent = currentRoom.price;
        
        // Set minimum date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('checkIn').min = today;
        document.getElementById('checkOut').min = today;
        
        document.getElementById('bookingModal').style.display = 'block';
    } catch (error) {
        console.error('Error:', error);
    }
}

// Calculate total
function calculateTotal() {
    const checkIn = new Date(document.getElementById('checkIn').value);
    const checkOut = new Date(document.getElementById('checkOut').value);
    
    if (checkIn && checkOut && checkOut > checkIn) {
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
        const total = nights * currentRoom.price;
        
        document.getElementById('totalNights').textContent = nights;
        document.getElementById('totalAmount').textContent = total;
    }
}

// Event listeners for date changes
document.getElementById('checkIn').addEventListener('change', calculateTotal);
document.getElementById('checkOut').addEventListener('change', calculateTotal);

// Booking form submission
document.getElementById('bookingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const roomId = document.getElementById('selectedRoomId').value;
    const checkIn = document.getElementById('checkIn').value;
    const checkOut = document.getElementById('checkOut').value;
    const guests = document.getElementById('guests').value;
    const errorDiv = document.getElementById('bookingError');

    try {
        const response = await fetch('/api/bookings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ roomId, checkIn, checkOut, guests })
        });

        const data = await response.json();

        if (response.ok) {
            currentBooking = data.booking;
            document.getElementById('bookingModal').style.display = 'none';
            openPaymentModal();
        } else {
            errorDiv.textContent = data.error || 'Booking failed';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'An error occurred. Please try again.';
        errorDiv.style.display = 'block';
    }
});

// Open payment modal
function openPaymentModal() {
    document.getElementById('paymentBookingId').value = currentBooking.id;
    document.getElementById('paymentRoomName').textContent = currentBooking.roomName;
    document.getElementById('paymentAmount').textContent = currentBooking.totalAmount;
    
    // Reset to card payment by default
    selectPaymentMethod('card');
    
    // Clear previous values
    document.getElementById('paymentForm').reset();
    document.getElementById('paymentBookingId').value = currentBooking.id;
    document.getElementById('paymentError').style.display = 'none';
    
    document.getElementById('paymentModal').style.display = 'block';
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

// Payment method selection
function selectPaymentMethod(method) {
    document.getElementById('paymentMethod').value = method;
    
    const cardSection = document.getElementById('cardPaymentSection');
    const upiSection = document.getElementById('upiPaymentSection');
    const tabs = document.querySelectorAll('.payment-tab');
    
    tabs.forEach(tab => tab.classList.remove('active'));
    
    if (method === 'card') {
        cardSection.style.display = 'block';
        upiSection.style.display = 'none';
        tabs[0].classList.add('active');
    } else {
        cardSection.style.display = 'none';
        upiSection.style.display = 'block';
        tabs[1].classList.add('active');
    }
}

// Payment form submission
document.getElementById('paymentForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const bookingId = document.getElementById('paymentBookingId').value;
    const paymentMethod = document.getElementById('paymentMethod').value;
    const errorDiv = document.getElementById('paymentError');

    let paymentData = { bookingId, paymentMethod };

    // Validate based on payment method
    if (paymentMethod === 'card') {
        const cardName = document.getElementById('cardName').value.trim();
        const cardNumber = document.getElementById('cardNumber').value.trim();
        const expiryDate = document.getElementById('expiryDate').value.trim();
        const cvv = document.getElementById('cvv').value.trim();
        
        if (!cardName || !cardNumber || !expiryDate || !cvv) {
            errorDiv.textContent = 'Please fill in all card details';
            errorDiv.style.display = 'block';
            return;
        }
        
        if (cardNumber.length < 13 || cardNumber.length > 19) {
            errorDiv.textContent = 'Invalid card number';
            errorDiv.style.display = 'block';
            return;
        }
        
        paymentData.cardName = cardName;
        paymentData.cardNumber = cardNumber;
        paymentData.expiryDate = expiryDate;
        paymentData.cvv = cvv;
    } else {
        const upiId = document.getElementById('upiId').value.trim();
        
        if (!upiId) {
            errorDiv.textContent = 'Please enter your UPI ID';
            errorDiv.style.display = 'block';
            return;
        }
        
        // Basic UPI ID validation
        if (!upiId.includes('@') || upiId.length < 5) {
            errorDiv.textContent = 'Invalid UPI ID format (e.g., yourname@upi)';
            errorDiv.style.display = 'block';
            return;
        }
        
        paymentData.upiId = upiId;
    }

    // Hide previous errors
    errorDiv.style.display = 'none';

    try {
        const response = await fetch('/api/payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });

        const data = await response.json();

        if (response.ok) {
            completedBookingId = data.booking.id;
            document.getElementById('paymentModal').style.display = 'none';
            showSuccessModal(data.booking);
        } else {
            errorDiv.textContent = data.error || 'Payment failed';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        errorDiv.textContent = 'An error occurred. Please try again.';
        errorDiv.style.display = 'block';
    }
});

// Show success modal
function showSuccessModal(booking) {
    document.getElementById('successBookingId').textContent = booking.id;
    document.getElementById('successAmount').textContent = booking.totalAmount;
    document.getElementById('successModal').style.display = 'block';
}

// Close success modal and redirect to bookings
function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
    window.location.href = 'bookings.html';
}

// Download invoice immediately
function downloadInvoiceNow() {
    if (completedBookingId) {
        window.open(`/api/invoice/${completedBookingId}`, '_blank');
        setTimeout(() => {
            closeSuccessModal();
        }, 500);
    }
}

// Close modal when clicking outside
window.onclick = function(event) {
    const bookingModal = document.getElementById('bookingModal');
    const paymentModal = document.getElementById('paymentModal');
    const successModal = document.getElementById('successModal');
    
    if (event.target == bookingModal) {
        bookingModal.style.display = 'none';
    }
    if (event.target == paymentModal) {
        paymentModal.style.display = 'none';
    }
    if (event.target == successModal) {
        closeSuccessModal();
    }
}

// Close modal buttons
document.querySelectorAll('.close').forEach(btn => {
    btn.onclick = function() {
        document.getElementById('bookingModal').style.display = 'none';
        document.getElementById('paymentModal').style.display = 'none';
    }
});

// Load rooms on page load
document.addEventListener('DOMContentLoaded', loadRooms);
