# Hotel Booking System

A minimal online hotel booking system with authentication, payment processing, and invoice generation.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. **Register/Login**: Create an account or login with existing credentials
2. **Browse Rooms**: View available rooms with prices
3. **Book a Room**: Select dates and number of guests
4. **Make Payment**: Enter payment details (test mode)
5. **Download Invoice**: Get PDF invoice for confirmed bookings

## Test Credentials

You can register a new account or use the system to create one.

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript
- **Backend**: Node.js, Express.js
- **Authentication**: bcryptjs, express-session
- **Invoice Generation**: PDFKit
- **Payment**: Simulated (Stripe integration ready)

## Project Structure

```
hotel-booking-system/
├── public/
│   ├── index.html       # Home page
│   ├── login.html       # Login/Register page
│   ├── rooms.html       # Rooms listing
│   ├── bookings.html    # User bookings
│   ├── styles.css       # Styling
│   ├── app.js           # Main app logic
│   ├── auth.js          # Authentication logic
│   ├── rooms.js         # Room booking logic
│   └── bookings.js      # Bookings management
├── server.js            # Express server
└── package.json         # Dependencies

```

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/:id` - Get room details

### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking details

### Payment
- `POST /api/payment` - Process payment

### Invoice
- `GET /api/invoice/:bookingId` - Download invoice PDF

## Notes

- This is a minimal implementation for demonstration purposes
- Payment processing is simulated (integrate Stripe for production)
- Data is stored in memory (use a database for production)
- Add proper validation and security measures for production use

