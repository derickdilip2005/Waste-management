# Waste Management System

A comprehensive web application for managing waste reports, tracking collection activities, and engaging citizens in environmental conservation through a rewards system.

## 🌟 Features

### For Citizens
- **Report Waste Issues**: Submit reports with photos, location, and description
- **Track Reports**: Monitor the status of submitted reports
- **Earn Rewards**: Get points for verified reports and redeem rewards
- **View Impact**: See environmental impact and contribution statistics
- **Notifications**: Receive updates on report status and rewards

### For Collectors
- **Dashboard**: View assigned reports and collection statistics
- **Report Management**: Update report status, add notes, and upload photos
- **Route Optimization**: Efficient collection route planning
- **Progress Tracking**: Monitor collection progress and completion rates

### For Administrators
- **Analytics Dashboard**: Comprehensive system statistics and insights
- **User Management**: Manage citizen and collector accounts
- **Report Oversight**: Review, approve, and assign reports
- **Rewards Management**: Create and manage reward programs
- **System Monitoring**: Track application performance and usage

## 🛠 Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for data fetching
- **React Hook Form** for form management
- **Chart.js** for data visualization

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Multer** for file uploads
- **Redis** for caching (optional)

### DevOps & Deployment
- **Docker** & Docker Compose
- **Nginx** reverse proxy
- **Jest** for testing
- **ESLint** & Prettier for code quality

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB 6.0+
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd waste-management
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Environment Configuration**
   ```bash
   # Server environment
   cd server
   cp .env.example .env
   # Edit .env with your configuration
   
   # Client environment
   cd ../client
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the development servers**
   ```bash
   # Terminal 1 - Start MongoDB (if not using Docker)
   mongod
   
   # Terminal 2 - Start backend server
   cd server
   npm run dev
   
   # Terminal 3 - Start frontend development server
   cd client
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api/docs

### Docker Setup (Recommended)

1. **Start with Docker Compose**
   ```bash
   # Development environment
   docker-compose up -d
   
   # Production environment
   docker-compose --profile production up -d
   
   # With monitoring
   docker-compose --profile monitoring up -d
   ```

2. **Access services**
   - Application: http://localhost:3000
   - API: http://localhost:5000
   - MongoDB: localhost:27017
   - Redis: localhost:6379
   - Prometheus: http://localhost:9090 (monitoring profile)
   - Grafana: http://localhost:3001 (monitoring profile)

## 📁 Project Structure

```
waste-management/
├── client/                 # React frontend application
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── admin/     # Admin-specific components
│   │   │   ├── citizen/   # Citizen-specific components
│   │   │   ├── collector/ # Collector-specific components
│   │   │   └── common/    # Shared components
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   └── __tests__/     # Test files
│   ├── Dockerfile         # Docker configuration
│   └── package.json       # Dependencies and scripts
├── server/                # Node.js backend application
│   ├── middleware/        # Express middleware
│   ├── models/           # MongoDB models
│   ├── routes/           # API routes
│   ├── uploads/          # File upload directory
│   ├── Dockerfile        # Docker configuration
│   └── package.json      # Dependencies and scripts
├── docker-compose.yml    # Docker Compose configuration
├── nginx/               # Nginx configuration
├── monitoring/          # Prometheus & Grafana configs
└── README.md           # This file
```

## 🧪 Testing

### Frontend Testing
```bash
cd client
npm test                 # Run tests
npm run test:coverage   # Run tests with coverage
npm run test:watch      # Run tests in watch mode
```

### Backend Testing
```bash
cd server
npm test                 # Run tests
npm run test:coverage   # Run tests with coverage
npm run test:integration # Run integration tests
```

### End-to-End Testing
```bash
npm run test:e2e        # Run E2E tests with Cypress
```

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Report Endpoints
- `GET /api/reports` - Get reports (with filters)
- `POST /api/reports` - Create new report
- `GET /api/reports/:id` - Get specific report
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report

### User Management
- `GET /api/users` - Get users (admin only)
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Rewards System
- `GET /api/rewards` - Get available rewards
- `POST /api/rewards/redeem` - Redeem reward
- `GET /api/rewards/history` - Get redemption history

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics
- `GET /api/analytics/reports` - Report analytics
- `GET /api/analytics/users` - User analytics

## 🔧 Configuration

### Environment Variables

#### Server (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/waste-management
JWT_SECRET=your-super-secret-jwt-key
CLIENT_URL=http://localhost:3000
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
REDIS_URL=redis://localhost:6379
```

#### Client (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_MAPBOX_TOKEN=your-mapbox-token
REACT_APP_ENVIRONMENT=development
```

## 🚀 Deployment

### Production Deployment with Docker

1. **Build and deploy**
   ```bash
   # Build production images
   docker-compose -f docker-compose.yml --profile production build
   
   # Deploy to production
   docker-compose -f docker-compose.yml --profile production up -d
   ```

2. **Environment setup**
   - Update environment variables for production
   - Configure SSL certificates
   - Set up domain and DNS
   - Configure monitoring and logging

### Manual Deployment

1. **Build frontend**
   ```bash
   cd client
   npm run build
   ```

2. **Deploy backend**
   ```bash
   cd server
   npm install --production
   npm start
   ```

3. **Serve frontend**
   - Use Nginx or Apache to serve the built React app
   - Configure reverse proxy for API requests

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Input validation and sanitization
- File upload restrictions
- CORS configuration
- Security headers with Helmet.js
- Environment variable protection

## 📈 Performance Optimizations

- React component memoization
- Lazy loading of components
- Image optimization and compression
- API response caching
- Database query optimization
- CDN integration ready
- Bundle splitting and code optimization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Update documentation as needed
- Ensure code passes linting and tests

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review existing issues and discussions

## 🗺 Roadmap

- [ ] Mobile application (React Native)
- [ ] Advanced ML for waste classification
- [ ] IoT sensor integration
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Offline functionality
- [ ] Advanced notification system
- [ ] Integration with municipal systems

## 📊 System Requirements

### Minimum Requirements
- Node.js 16+
- MongoDB 5.0+
- 2GB RAM
- 10GB storage

### Recommended Requirements
- Node.js 18+
- MongoDB 6.0+
- Redis 6.0+
- 4GB RAM
- 50GB storage
- SSL certificate for production

---

**Built with ❤️ for a cleaner environment**