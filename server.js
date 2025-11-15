const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
    secret: 'hotel-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// In-memory databases (replace with real database in production)
const users = [];
const bookings = [];
const rooms = [
    { id: 1, name: 'Standard Room', price: 2999, description: 'Comfortable room with basic amenities', image: 'standard.jpg', available: 10 },
    { id: 2, name: 'Deluxe Room', price: 4999, description: 'Spacious room with premium amenities', image: 'deluxe.jpg', available: 8 },
    { id: 3, name: 'Suite', price: 8999, description: 'Luxurious suite with stunning views', image: 'suite.jpg', available: 5 },
    { id: 4, name: 'Presidential Suite', price: 14999, description: 'Ultimate luxury experience', image: 'presidential.jpg', available: 2 }
];

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized' });
    }
};

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Auth routes
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;
        
        if (users.find(u => u.email === email)) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = {
            id: users.length + 1,
            name,
            email,
            password: hashedPassword,
            phone,
            createdAt: new Date()
        };
        
        users.push(user);
        req.session.userId = user.id;
        
        res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email);
        
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        req.session.userId = user.id;
        res.json({ success: true, user: { id: user.id, name: user.name, email: user.email } });
    } catch (error) {
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/user', requireAuth, (req, res) => {
    const user = users.find(u => u.id === req.session.userId);
    if (user) {
        res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// Room routes
app.get('/api/rooms', (req, res) => {
    res.json(rooms);
});

app.get('/api/rooms/:id', (req, res) => {
    const room = rooms.find(r => r.id === parseInt(req.params.id));
    if (room) {
        res.json(room);
    } else {
        res.status(404).json({ error: 'Room not found' });
    }
});

// Booking routes
app.post('/api/bookings', requireAuth, (req, res) => {
    try {
        const { roomId, checkIn, checkOut, guests } = req.body;
        const room = rooms.find(r => r.id === parseInt(roomId));
        
        if (!room || room.available < 1) {
            return res.status(400).json({ error: 'Room not available' });
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const totalAmount = room.price * nights;

        const booking = {
            id: bookings.length + 1,
            userId: req.session.userId,
            roomId: room.id,
            roomName: room.name,
            checkIn,
            checkOut,
            guests,
            nights,
            pricePerNight: room.price,
            totalAmount,
            status: 'pending',
            createdAt: new Date()
        };

        bookings.push(booking);
        room.available -= 1;

        res.json({ success: true, booking });
    } catch (error) {
        res.status(500).json({ error: 'Booking failed' });
    }
});

app.get('/api/bookings', requireAuth, (req, res) => {
    const userBookings = bookings.filter(b => b.userId === req.session.userId);
    res.json(userBookings);
});

app.get('/api/bookings/:id', requireAuth, (req, res) => {
    const booking = bookings.find(b => b.id === parseInt(req.params.id) && b.userId === req.session.userId);
    if (booking) {
        res.json(booking);
    } else {
        res.status(404).json({ error: 'Booking not found' });
    }
});

// Payment routes
app.post('/api/payment', requireAuth, (req, res) => {
    try {
        const { bookingId, paymentMethod, cardNumber, cardName, expiryDate, cvv, upiId } = req.body;
        const booking = bookings.find(b => b.id === parseInt(bookingId) && b.userId === req.session.userId);
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        if (booking.status === 'confirmed') {
            return res.status(400).json({ error: 'Booking already paid' });
        }

        // Simulate payment processing (in production, integrate with Stripe/PayPal/UPI)
        const payment = {
            id: Date.now(),
            bookingId: booking.id,
            amount: booking.totalAmount,
            method: paymentMethod || 'card',
            status: 'completed',
            transactionDate: new Date()
        };

        // Add payment method specific details
        if (paymentMethod === 'upi') {
            payment.upiId = upiId;
            payment.upiMasked = upiId.replace(/(.{3}).*(@.*)/, '$1***$2');
        } else {
            payment.cardLast4 = cardNumber ? cardNumber.slice(-4) : '****';
        }

        booking.status = 'confirmed';
        booking.payment = payment;

        res.json({ success: true, payment, booking });
    } catch (error) {
        res.status(500).json({ error: 'Payment failed' });
    }
});

// Invoice generation
app.get('/api/invoice/:bookingId', requireAuth, (req, res) => {
    try {
        const booking = bookings.find(b => b.id === parseInt(req.params.bookingId) && b.userId === req.session.userId);
        
        if (!booking || booking.status !== 'confirmed') {
            return res.status(404).json({ error: 'Confirmed booking not found' });
        }

        const user = users.find(u => u.id === req.session.userId);
        const doc = new PDFDocument();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=invoice-${booking.id}.pdf`);

        doc.pipe(res);

        // Header
        doc.fontSize(24).text('HOTEL BOOKING INVOICE', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text('Grand Hotel & Resort', { align: 'center' });
        doc.text('123 Luxury Avenue, City', { align: 'center' });
        doc.text('Phone: +1 234-567-8900', { align: 'center' });
        doc.moveDown(2);

        // Invoice details
        doc.fontSize(12).text(`Invoice #: ${booking.id}`, { underline: true });
        doc.fontSize(10).text(`Date: ${new Date(booking.createdAt).toLocaleDateString()}`);
        doc.moveDown();

        // Customer details
        doc.fontSize(12).text('Bill To:', { underline: true });
        doc.fontSize(10).text(`Name: ${user.name}`);
        doc.text(`Email: ${user.email}`);
        doc.text(`Phone: ${user.phone || 'N/A'}`);
        doc.moveDown();

        // Booking details
        doc.fontSize(12).text('Booking Details:', { underline: true });
        doc.fontSize(10).text(`Room Type: ${booking.roomName}`);
        doc.text(`Check-in: ${new Date(booking.checkIn).toLocaleDateString()}`);
        doc.text(`Check-out: ${new Date(booking.checkOut).toLocaleDateString()}`);
        doc.text(`Number of Nights: ${booking.nights}`);
        doc.text(`Number of Guests: ${booking.guests}`);
        doc.moveDown();

        // Payment breakdown
        doc.fontSize(12).text('Payment Details:', { underline: true });
        doc.fontSize(10).text(`Price per Night: ₹${booking.pricePerNight}`);
        doc.text(`Number of Nights: ${booking.nights}`);
        doc.text(`Subtotal: ₹${booking.pricePerNight * booking.nights}`);
        doc.moveDown();
        doc.fontSize(14).text(`Total Amount: ₹${booking.totalAmount}`, { bold: true });
        doc.moveDown();

        if (booking.payment) {
            doc.fontSize(10).text(`Payment Status: PAID`);
            doc.text(`Transaction ID: ${booking.payment.id}`);
            doc.text(`Payment Method: ${(booking.payment.method || 'CARD').toUpperCase()}`);
            if (booking.payment.method === 'upi') {
                doc.text(`UPI ID: ${booking.payment.upiMasked || booking.payment.upiId}`);
            } else {
                doc.text(`Card: **** **** **** ${booking.payment.cardLast4 || '****'}`);
            }
            doc.text(`Payment Date: ${new Date(booking.payment.transactionDate).toLocaleDateString()}`);
        }

        doc.moveDown(2);
        doc.fontSize(10).text('Thank you for choosing our hotel!', { align: 'center', italics: true });
        doc.text('We look forward to serving you.', { align: 'center', italics: true });

        doc.end();
    } catch (error) {
        res.status(500).json({ error: 'Invoice generation failed' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Hotel Booking System running on http://localhost:${PORT}`);
});
