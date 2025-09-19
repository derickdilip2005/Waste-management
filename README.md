# Waste Management System (Frontend Demo)

A comprehensive React web application for managing waste reports, tracking collection activities, and engaging citizens in environmental conservation through a rewards system. This is a **frontend-only demo** that uses mock data to showcase the user interface and functionality.

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
- **Leaflet** for interactive maps
- **Mock Data** for demonstration purposes

### DevOps & Deployment
- **Docker** & Docker Compose
- **Nginx** reverse proxy (optional)
- **Jest** for testing
- **ESLint** & Prettier for code quality

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/waste-management.git
   cd waste-management
   ```

2. **Install dependencies**
   ```bash
   cd client
   npm install
   ```

3. **Environment Configuration (Optional)**
   ```bash
   # Copy environment template
   cp .env.example .env
   # Edit .env with your API keys (optional for demo)
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

   The application will open at `http://localhost:3000`

### Docker Deployment

1. **Using Docker Compose**
   ```bash
   docker-compose up --build
   ```

   The application will be available at `http://localhost:3000`

## 🌐 GitHub Pages Deployment

This project can be easily deployed to GitHub Pages:

1. **Fork or clone this repository**

2. **Enable GitHub Pages**
   - Go to your repository settings
   - Navigate to "Pages" section
   - Select "GitHub Actions" as the source

3. **Deploy using GitHub Actions**
   ```bash
   # The project includes a GitHub Actions workflow
   # Push to main branch to trigger automatic deployment
   git push origin main
   ```

## 🔧 Available Scripts

In the client directory, you can run:

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## 📱 Demo Features

Since this is a frontend-only demo, all data is mocked:

- **Authentication**: Demo login with predefined user roles
- **Reports**: Sample waste reports with various statuses
- **Analytics**: Mock data showing system statistics
- **Maps**: Interactive maps with sample locations
- **Rewards**: Demo reward system with point calculations

## 🎯 User Roles

The demo includes three user types:

1. **Citizen** (demo@citizen.com / password123)
   - Submit and track waste reports
   - View rewards and impact statistics

2. **Collector** (demo@collector.com / password123)
   - Manage assigned collection tasks
   - Update report statuses

3. **Admin** (demo@admin.com / password123)
   - Access full analytics dashboard
   - Manage users and system settings
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
│   │   ├── contexts/      # React contexts
│   │   ├── types/         # TypeScript type definitions
│   │   ├── utils/         # Utility functions and mock data
│   │   └── __tests__/     # Test files
│   ├── Dockerfile         # Docker configuration
│   └── package.json       # Dependencies and scripts
├── docker-compose.yml     # Docker Compose configuration
├── .gitignore            # Git ignore rules
├── .env.example          # Environment variables template
└── README.md             # This file
```

## 🧪 Testing

### Frontend Testing
```bash
cd client
npm test                 # Run tests
npm run test:coverage   # Run tests with coverage (if configured)
```

## 🔧 Configuration

### Environment Variables

The application uses environment variables for configuration. Copy `.env.example` to `.env` and update the values:

```env
# React App Environment Variables
REACT_APP_USE_MOCK_API=true
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_OPENCAGE_API_KEY=your_opencage_api_key_here
REACT_APP_MAPBOX_TOKEN=your_mapbox_token_here
REACT_APP_ENV=development
```

**Note**: Since this is a frontend-only demo, most API keys are optional and the app will work with mock data.

## 🚀 Deployment Options

### 1. GitHub Pages (Recommended for Demo)
- Fork this repository
- Enable GitHub Pages in repository settings
- Push to main branch for automatic deployment

### 2. Netlify
- Connect your GitHub repository to Netlify
- Set build command: `cd client && npm run build`
- Set publish directory: `client/build`

### 3. Vercel
- Import project from GitHub
- Set root directory to `client`
- Deploy with default React settings

### 4. Docker
```bash
docker-compose up --build
```

## 📱 Features Overview

This demo showcases a complete waste management system interface with:

- **Responsive Design**: Works on desktop, tablet, and mobile
- **Role-Based Access**: Different interfaces for citizens, collectors, and admins
- **Interactive Maps**: Leaflet integration for location-based features
- **Data Visualization**: Charts and analytics dashboards
- **Modern UI**: Clean, intuitive interface built with Tailwind CSS

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
- Ensure code passes linting and tests

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- React team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- Leaflet for the interactive maps
- All contributors and the open-source community

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