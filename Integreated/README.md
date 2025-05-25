# E-commerce Fraud Detection System

A Next.js-based e-commerce platform with integrated fraud detection and DoS attack monitoring capabilities. The system includes a user-facing storefront, an admin dashboard for monitoring security metrics, and a DoS attack simulator for testing purposes.

## Features

### 1. E-commerce Platform

- Product catalog display
- Shopping cart functionality
- User authentication
- Secure checkout process

### 2. Security Features

- Real-time fraud detection for transactions
- DoS attack detection and monitoring
- Alert system for security incidents
- Interactive DoS attack simulator for testing

### 3. Admin Dashboard

- Real-time monitoring of transactions
- Visual analytics with charts and graphs
- Fraud and DoS attack statistics
- Alert management system

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **UI Components**: Tailwind CSS, shadcn/ui
- **Charts**: Recharts
- **Database**: MongoDB
- **Authentication**: JWT, HTTP-only cookies
- **API**: REST endpoints

## Getting Started

### Prerequisites

- Node.js 18 or higher
- MongoDB instance
- npm or yarn package manager

### Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd ecommerce-fraud-detection
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:

```env
MONGODB_URI=mongodb+srv://admin:admin@ccfraud.hu6gj.mongodb.net/ccfraud
JWT_SECRET=frauddosdetectionsecretkey
NEXT_PUBLIC_API_URL=http://localhost:5001
IPINFO_TOKEN=e3fa46f1168c1b 
```

4. Run the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Admin Access

To access the admin dashboard, use the following credentials:

- **URL**: `/admin/login`
- **Username**: `admin`
- **Password**: `admin123`

## API Endpoints

### Dashboard API

- `GET /api/dashboard` - Get dashboard statistics and recent alerts

### Alerts API

- `GET /api/alerts` - Get all alerts
- `POST /api/alerts` - Create a new alert
- `GET /api/alerts?type=fraud` - Get fraud alerts
- `GET /api/alerts?type=dos` - Get DoS alerts

### DoS Simulator

- `POST /api/dos-alert` - Create a new DoS alert
- External API: `POST http://localhost:5001/dos` - DoS detection endpoint

## Security Features

### DoS Attack Detection

- Real-time monitoring of network traffic
- Pattern recognition for attack detection
- Automatic alert generation
- Integration with admin dashboard

### Fraud Detection

- Transaction analysis
- Pattern matching
- Risk scoring
- Alert system integration

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Next.js team for the amazing framework
- shadcn/ui for beautiful UI components
- MongoDB team for the database system
- All contributors who have helped with the project
