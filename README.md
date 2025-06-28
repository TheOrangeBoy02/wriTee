# WriTee Journal App

A React Native journal application built with Expo, featuring secure authentication, daily prompts, and streak tracking.

## Features

- 🔐 **Secure Authentication** with Supabase
- 📝 **Daily Journal Entries** with rich text formatting
- 🔥 **Writing Streak Tracking** to maintain consistency
- 💡 **Daily Prompts** to inspire creativity
- 📱 **Cross-platform** (iOS, Android, Web)
- 🎨 **Modern UI** with custom typography and colors
- ♿ **Accessibility** support for all users
- 🛡️ **Security Best Practices** implemented

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wriTee
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with your Supabase credentials:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Start the development server:
```bash
npm run dev
```

## Available Scripts

- `npm run dev` - Start the Expo development server
- `npm run build:web` - Build for web deployment
- `npm run lint` - Run ESLint
- `npm test` - Run the test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## Testing

The project includes comprehensive testing for:
- Authentication services
- Input validation utilities
- Error boundary components
- Core business logic

Run tests with:
```bash
npm test
```

## Architecture

### Tech Stack
- **Framework**: React Native with Expo
- **Navigation**: Expo Router
- **Backend**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: React hooks
- **Styling**: React Native StyleSheet
- **Testing**: Jest + React Native Testing Library
- **Validation**: Zod

### Project Structure
```
wriTee/
├── app/                    # App screens and routing
│   ├── (auth)/            # Authentication screens
│   ├── (tabs)/            # Main tab navigation
│   └── journal/           # Journal-specific screens
├── components/            # Reusable UI components
├── constants/            # App constants (colors, etc.)
├── hooks/               # Custom React hooks
├── services/            # API and business logic
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── __tests__/           # Test files
```

## Security Features

- Environment variables for sensitive data
- Input validation on all forms
- Secure authentication with Supabase
- Error boundaries for graceful error handling
- Access control for user data

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Update documentation as needed
4. Ensure all tests pass before submitting

## License

This project is licensed under the MIT License.