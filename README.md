# Assistive Learning Platform

A modern, accessible learning platform designed to enhance educational experiences through personalized learning paths, interactive exercises, and adaptive technology.

## 🎨 Design System

This project features a comprehensive, modern UI design system built with:

- **Tailwind CSS** for utility-first styling
- **Custom CSS variables** for consistent theming
- **Responsive design** that works on all devices
- **Accessibility-first** approach with proper ARIA labels and keyboard navigation
- **Modern animations** and smooth transitions

### Key Design Features

- **Clean, minimalist interface** with plenty of white space
- **Consistent color palette** with blue/indigo primary colors
- **Typography** using Inter font for excellent readability
- **Card-based layouts** for organized content presentation
- **Gradient backgrounds** for visual appeal
- **Smooth hover effects** and micro-interactions

## 🚀 Features

### Authentication System
- **Modern login/register pages** with split-screen design
- **Email verification** with OTP system
- **Google OAuth integration** for quick sign-up
- **Password reset functionality**
- **Form validation** with helpful error messages

### Dashboard & Navigation
- **Responsive sidebar** with collapsible mobile menu
- **Modern navbar** with user profile dropdown
- **Quick action buttons** for common tasks
- **Statistics cards** showing user progress
- **Recent activity feed**

### Course Management
- **Create and join courses** with unique course keys
- **Visual course cards** with custom colors
- **Course progress tracking**
- **Teacher and student roles**

### UI Components
- **Reusable Button component** with multiple variants
- **Card component** with header, content, and footer sections
- **Input component** with validation states
- **Modal component** with backdrop and keyboard navigation
- **Alert component** for notifications and messages

## 🛠️ Tech Stack

- **Next.js 15** - React framework with App Router
- **React 19** - Latest React features
- **Tailwind CSS** - Utility-first CSS framework
- **MongoDB** - Database for user and course data
- **Firebase** - Authentication and Google OAuth
- **JWT** - Secure token-based authentication
- **Nodemailer** - Email sending for verification

## 📱 Responsive Design

The platform is fully responsive and optimized for:
- **Desktop** (1024px+) - Full sidebar and multi-column layouts
- **Tablet** (768px-1023px) - Collapsible sidebar and adapted layouts
- **Mobile** (320px-767px) - Mobile-first navigation and single-column layouts

## 🎯 User Experience

### Authentication Flow
1. **Welcome screens** with compelling value propositions
2. **Streamlined registration** with progressive disclosure
3. **Email verification** with clear instructions
4. **Smooth onboarding** to the main dashboard

### Dashboard Experience
1. **Personalized welcome** with user statistics
2. **Quick actions** for immediate productivity
3. **Visual course overview** with progress indicators
4. **Recent activity** to maintain engagement

### Navigation
1. **Intuitive sidebar** with clear iconography
2. **Breadcrumb navigation** for context
3. **Mobile-friendly** hamburger menu
4. **Keyboard accessible** throughout

## 🔧 Development

### Getting Started
```bash
npm install
npm run dev
```

### Environment Variables
Create a `.env.local` file with:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FIREBASE_CONFIG=your_firebase_config
EMAIL_CONFIG=your_email_configuration
```

### Project Structure
```
src/
├── app/                 # Next.js App Router pages
│   ├── login/          # Authentication pages
│   ├── register/
│   └── api/            # API routes
├── components/         # Reusable UI components
│   ├── Layout.js       # Main layout wrapper
│   ├── Navbar.js       # Top navigation
│   ├── Sidebar.js      # Side navigation
│   ├── Button.js       # Button component
│   ├── Card.js         # Card component
│   ├── Input.js        # Input component
│   ├── Modal.js        # Modal component
│   └── Alert.js        # Alert component
└── lib/                # Utility functions
```

## 🎨 Design Tokens

### Colors
- **Primary**: Blue (#3B82F6) to Indigo (#1D4ED8)
- **Secondary**: Gray scale from #F8FAFC to #0F172A
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)

### Typography
- **Font Family**: Inter (Google Fonts)
- **Font Weights**: 300, 400, 500, 600, 700
- **Font Sizes**: Tailwind's default scale (text-xs to text-6xl)

### Spacing
- **Consistent spacing** using Tailwind's 4px base unit
- **Component padding**: 16px (p-4) to 32px (p-8)
- **Section margins**: 24px (mb-6) to 32px (mb-8)

## 📈 Performance

- **Optimized images** with Next.js Image component
- **Code splitting** with dynamic imports
- **CSS optimization** with Tailwind's purge
- **Font optimization** with Google Fonts display swap

## ♿ Accessibility

- **WCAG 2.1 AA compliant** color contrasts
- **Keyboard navigation** support throughout
- **Screen reader friendly** with proper ARIA labels
- **Focus management** in modals and dropdowns
- **Semantic HTML** structure

## 🚀 Deployment

The platform is configured for deployment on:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Any Node.js hosting platform**

## 📄 License

This project is currently under development and not yet licensed for public use.

---

Built with ❤️ for accessible and inclusive education.
