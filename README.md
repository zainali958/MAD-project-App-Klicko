# MAD-project-App-Klicko

# KLICKO - E-commerce Mobile App

A full-featured e-commerce mobile application built with React Native (Expo) that provides a seamless shopping experience for buyers and a management platform for sellers.

## 📱 Overview

KLICKO is a luxury fashion e-commerce app that allows users to browse products, add items to cart, and complete purchases. The app includes user authentication with role-based access (buyer/seller), product search and filtering, cart management, and checkout functionality.

## ✨ Features

### User Authentication
- **Sign Up / Login** with JWT authentication
- Role selection: **Buyer** or **Seller**
- Secure token storage using AsyncStorage

### Shopping Experience
- **Product Catalog** with grid layout
- **Category Filtering** - Browse products by category
- **Search Functionality** - Search by product name or description
- **Product Details** - View detailed product information
- **Shopping Cart** - Add/remove items, update quantities
- **Checkout** - Place orders with shipping details

### User Profile
- View profile information (name, email, role)
- Secure logout functionality

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React Native (Expo SDK 54) |
| Navigation | React Navigation (Stack + Bottom Tabs) |
| UI Library | React Native Paper |
| HTTP Client | Axios |
| Storage | AsyncStorage |
| Icons | MaterialCommunityIcons |

## 📦 Prerequisites

- Node.js (v18 or later)
- npm or yarn
- Expo CLI
- iOS Simulator (Mac only) or Android Emulator
- Physical device with Expo Go app

## 🚀 Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd voguevault
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure API endpoint**

The app uses a backend API deployed at:
```
https://ecommerce-apk-opal.vercel.app
```

To change the API URL, update the `API` constant in `App.tsx`:
```typescript
export const API = 'https://ecommerce-apk-opal.vercel.app';
```

4. **Start the development server**
```bash
npm start
```

5. **Run on device/emulator**
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

## 📁 Project Structure

```
voguevault/
├── App.tsx              # Main application code
├── app.json             # Expo configuration
├── eas.json             # EAS Build configuration
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript configuration
├── index.ts             # App entry point
├── assets/              # Images and assets
│   ├── icon.png
│   ├── splash-icon.png
│   ├── adaptive-icon.png
│   └── favicon.png
```

## 🔗 API Endpoints

The app communicates with the following backend endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/signup` | POST | User registration |
| `/login` | POST | User authentication |
| `/products` | GET | Fetch all products |
| `/cart` | GET | Get user's cart |
| `/cart` | POST | Add item to cart |
| `/cart/:id` | PUT | Update quantity |
| `/cart/:id` | DELETE | Remove item |
| `/checkout` | POST | Place order |
| `/profile` | GET | Get user profile |

## 📱 Screens

| Screen | Description |
|--------|-------------|
| Login | User authentication |
| Signup | New user registration with role selection |
| Home | Product listing with search and category filters |
| Details | Product details and add to cart |
| Cart | Shopping cart management |
| Profile | User information and logout |

## 🎨 UI Features

- Modern, minimalist design with luxury aesthetic
- Responsive grid layout for products
- Category chips for easy filtering
- Search bar with real-time filtering
- Custom tab bar navigation
- Loading states and error handling
- Empty cart state with call-to-action

## 🏗️ Building for Production

### Using EAS Build

1. **Configure EAS**
```bash
eas build:configure
```

2. **Build for Android**
```bash
eas build -p android --profile production
```

3. **Build for iOS**
```bash
eas build -p ios --profile production
```

## 📝 Environment Variables

The app uses the following Expo configuration in `app.json`:
- `projectId`: EAS project ID
- `package`: Android package name (`com.umairhmed01.AuthEaseApp`)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential.


## 🙏 Acknowledgments

- React Native community
- Expo team
- React Navigation team
- React Native Paper contributors
