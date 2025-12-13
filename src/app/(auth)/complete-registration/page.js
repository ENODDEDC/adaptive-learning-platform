'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

// Password strength calculator
const calculatePasswordStrength = (password) => {
  if (!password) return { score: 0, strength: '', color: '', bgColor: '' };

  let score = 0;

  // Length score
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;

  // Character variety
  if (/[a-z]/.test(password)) score += 15;
  if (/[A-Z]/.test(password)) score += 15;
  if (/[0-9]/.test(password)) score += 15;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score += 15;

  // Bonus for variety
  const variety = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  ].filter(Boolean).length;

  if (variety === 4) score += 10;

  // Determine strength label and color
  let strength, color, bgColor;
  if (score < 40) {
    strength = 'Weak';
    color = 'text-red-400';
    bgColor = 'bg-red-500';
  } else if (score < 60) {
    strength = 'Fair';
    color = 'text-yellow-400';
    bgColor = 'bg-yellow-500';
  } else if (score < 80) {
    strength = 'Good';
    color = 'text-blue-400';
    bgColor = 'bg-blue-500';
  } else {
    strength = 'Strong';
    color = 'text-green-400';
    bgColor = 'bg-green-500';
  }

  return { score: Math.min(score, 100), strength, color, bgColor };
};

export default function CompleteRegistrationPage() {
  const [formData, setFormData] = useState({
    name: '',
    middleName: '',
    surname: '',
    suffix: '',
    role: 'student',
    password: '',
    confirmPassword: ''
  });
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, strength: '', color: '', bgColor: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const [googleData, setGoogleData] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const router = useRouter();
  const canvasRef = useRef(null);

  useEffect(() => {
    // Load Google temp data from sessionStorage
    const tempData = sessionStorage.getItem('googleTempData');
    if (!tempData) {
      console.log('❌ No Google temp data found, redirecting to login');
      router.push('/login');
      return;
    }

    try {
      const parsed = JSON.parse(tempData);
      setGoogleData(parsed);
      console.log('✅ Google temp data loaded:', parsed);

      // Pre-populate name fields from Google displayName
      if (parsed.displayName) {
        const parts = parsed.displayName.split(' ');
        setFormData(prev => ({
          ...prev,
          name: parts[0] || '',
          surname: parts.length > 1 ? parts[parts.length - 1] : ''
        }));
      }
    } catch (error) {
      console.error('❌ Failed to parse Google temp data:', error);
      // Clear corrupted session data
      try {
        sessionStorage.removeItem('googleTempData');
      } catch (clearError) {
        console.error('Error clearing corrupted session data:', clearError);
      }
      router.push('/login');
      return;
    }

    setIsVisible(true);

    // Cleanup function to clear session data when component unmounts
    // This ensures data is cleared if user navigates away
    return () => {
      // Only clear if registration wasn't successful (no token in localStorage)
      const token = localStorage.getItem('token');
      if (!token) {
        try {
          const currentData = sessionStorage.getItem('googleTempData');
          if (currentData) {
            sessionStorage.removeItem('googleTempData');
            console.log('🧹 Cleaned up session data on unmount');
          }
        } catch (error) {
          console.error('Error cleaning up session data:', error);
        }
      }
    };

    // Mouse tracking for neural network interaction
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Neural Network Animation
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const nodes = [];
    const connections = [];
    const numNodes = 15;

    // Create nodes
    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2 + 1,
        pulse: Math.random() * Math.PI * 2,
        hue: Math.random() * 60 + 200,
      });
    }

    // Create connections
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 100) {
          connections.push({
            from: i,
            to: j,
            strength: 1 - distance / 100,
            active: Math.random() > 0.8,
          });
        }
      }
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update nodes
      nodes.forEach((node) => {
        // Mouse interaction
        const dx = mousePosition.x - node.x;
        const dy = mousePosition.y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 80) {
          const force = (80 - distance) / 80;
          node.vx += (dx / distance) * force * 0.005;
          node.vy += (dy / distance) * force * 0.005;
        }

        // Update position
        node.x += node.vx;
        node.y += node.vy;

        // Bounce off edges
        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        // Keep within bounds
        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));

        // Damping
        node.vx *= 0.995;
        node.vy *= 0.995;

        // Pulse animation
        node.pulse += 0.005;
        const pulseSize = node.size + Math.sin(node.pulse) * 0.3;

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${node.hue}, 70%, 60%, 0.3)`;
        ctx.fill();

        // Glow effect
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${node.hue}, 70%, 60%, 0.05)`;
        ctx.fill();
      });

      // Draw connections
      connections.forEach((connection) => {
        const fromNode = nodes[connection.from];
        const toNode = nodes[connection.to];

        const dx = fromNode.x - toNode.x;
        const dy = fromNode.y - toNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 100) {
          const opacity = (1 - distance / 100) * connection.strength * 0.15;

          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.strokeStyle = `hsla(${fromNode.hue}, 70%, 60%, ${opacity})`;
          ctx.lineWidth = connection.active ? 1.2 : 0.6;
          ctx.stroke();
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [router, mousePosition]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    
    // Calculate password strength when password changes
    if (id === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleCancel = () => {
    // Clear session data and return to login
    try {
      sessionStorage.removeItem('googleTempData');
      console.log('🔄 Registration cancelled, returning to login');
    } catch (error) {
      console.error('Error clearing session data:', error);
    }
    router.push('/login');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsLoading(true);

    // Client-side validation with specific error messages
    if (!formData.name.trim()) {
      setError('First name is required');
      setIsLoading(false);
      return;
    }

    if (formData.name.trim().length < 2) {
      setError('First name must be at least 2 characters long');
      setIsLoading(false);
      return;
    }

    if (formData.name.trim().length > 50) {
      setError('First name must not exceed 50 characters');
      setIsLoading(false);
      return;
    }

    if (!formData.surname.trim()) {
      setError('Last name is required');
      setIsLoading(false);
      return;
    }

    if (formData.surname.trim().length < 2) {
      setError('Last name must be at least 2 characters long');
      setIsLoading(false);
      return;
    }

    if (formData.surname.trim().length > 50) {
      setError('Last name must not exceed 50 characters');
      setIsLoading(false);
      return;
    }

    if (formData.middleName.trim().length > 50) {
      setError('Middle name must not exceed 50 characters');
      setIsLoading(false);
      return;
    }

    if (formData.suffix.trim().length > 10) {
      setError('Suffix must not exceed 10 characters');
      setIsLoading(false);
      return;
    }

    // Password validation
    if (!formData.password) {
      setError('Password is required');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter');
      setIsLoading(false);
      return;
    }

    if (!/[a-z]/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter');
      setIsLoading(false);
      return;
    }

    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one number');
      setIsLoading(false);
      return;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
      setError('Password must contain at least one special character');
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Role is automatically set to "student" - no validation needed

    if (!googleData) {
      setError('Google authentication data is missing. Please start the sign-in process again.');
      setIsLoading(false);
      setTimeout(() => router.push('/login'), 2000);
      return;
    }

    try {
      console.log('📤 Submitting registration data...');
      const res = await fetch('/api/auth/complete-google-registration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          googleData: {
            email: googleData.email,
            googleId: googleData.googleId,
            photoURL: googleData.photoURL,
          },
          userData: {
            name: formData.name.trim(),
            middleName: formData.middleName.trim(),
            surname: formData.surname.trim(),
            suffix: formData.suffix.trim(),
            role: formData.role,
            password: formData.password,
          }
        }),
      });

      const data = await res.json();

      if (res.ok) {
        console.log('✅ Registration completed successfully');
        
        // Store token in localStorage
        if (data.token) {
          localStorage.setItem('token', data.token);
          console.log('✅ Token stored in localStorage');
        }

        // Clear sessionStorage - critical security step
        try {
          sessionStorage.removeItem('googleTempData');
          console.log('✅ Session data cleared');
        } catch (clearError) {
          console.error('Error clearing session data:', clearError);
        }

        // Show success message before redirect
        setSuccessMessage('Registration successful! Redirecting to your dashboard...');
        
        // Redirect to dashboard after brief delay
        setTimeout(() => {
          router.push('/home');
        }, 1500);
      } else {
        console.error('❌ Registration failed:', data.message);
        
        // Handle specific error cases with appropriate messaging
        if (res.status === 409) {
          // Clear session data for duplicate email error
          try {
            sessionStorage.removeItem('googleTempData');
          } catch (clearError) {
            console.error('Error clearing session data:', clearError);
          }
          setError('This email is already registered. Redirecting to login...');
          setTimeout(() => router.push('/login'), 3000);
        } else if (res.status === 400) {
          setError(data.message || 'Please check your information and try again.');
        } else if (res.status === 429) {
          setError('Too many registration attempts. Please wait a moment and try again.');
        } else if (res.status === 500) {
          setError('Server error occurred. Please try again in a moment.');
        } else {
          setError(data.message || 'Registration failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      
      // Handle network and connection errors
      if (error.message && error.message.includes('fetch')) {
        setError('Connection error. Please check your internet connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      
      // Don't clear session data on network errors - allow user to retry
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Neural Network Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-900/20 to-purple-900/20"></div>

      {/* Navigation */}
      <nav className="fixed top-4 left-4 z-20">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all duration-300">
            <Image
              src="/platform_icon.png"
              alt="Intelevo"
              width={24}
              height={24}
              className="rounded-lg"
            />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Intelevo</span>
        </Link>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-2">
        <div className={`w-full max-w-md transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-black tracking-tighter mb-2">
              Complete Your
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Profile</span>
            </h1>
            <p className="text-white/70 text-sm">
              Just a few more details to get started
            </p>
          </div>

          {/* Profile Preview Card */}
          {googleData && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 mb-4 shadow-2xl">
              <div className="flex items-center gap-4">
                {/* Google Profile Picture */}
                {googleData.photoURL && (
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20">
                      <Image
                        src={googleData.photoURL}
                        alt="Profile"
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Verified Badge */}
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-black">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Email Display */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-green-400">Verified by Google</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-sm text-white/90">{googleData.email}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Registration Form */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">First Name *</label>
                  <div className="relative">
                    <input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                      placeholder="Enter first name"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Last Name *</label>
                  <div className="relative">
                    <input
                      id="surname"
                      type="text"
                      value={formData.surname}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                      placeholder="Enter last name"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Middle Name</label>
                  <div className="relative">
                    <input
                      id="middleName"
                      type="text"
                      value={formData.middleName}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                      placeholder="Optional"
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-white/80">Suffix</label>
                  <div className="relative">
                    <input
                      id="suffix"
                      type="text"
                      value={formData.suffix}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                      placeholder="Jr., Sr., etc."
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                  </div>
                </div>
              </div>

              {/* Role is automatically set to "student" - no UI needed */}

              {/* Password Fields */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Password *</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPasswords ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                  >
                    {showPasswords ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">Password Strength:</span>
                      <span className={passwordStrength.color}>{passwordStrength.strength}</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.bgColor} transition-all duration-300`}
                        style={{ width: `${passwordStrength.score}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-white/60">
                  Must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Confirm Password *</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showPasswords ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                    placeholder="Confirm password"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className="text-xs text-red-400">Passwords do not match</p>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm animate-shake">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-300">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-xl backdrop-blur-sm animate-fade-in">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-green-300">{successMessage}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="flex-1 py-3 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all duration-300 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl hover:shadow-2xl"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating...
                    </div>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="text-center mt-4 text-xs text-white/50">
            <p>
              By completing registration, you agree to our{' '}
              <Link href="/terms" className="text-blue-400 hover:text-blue-300">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-blue-400 hover:text-blue-300">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-10 animate-float-slow opacity-30">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
      </div>

      <div className="absolute bottom-1/4 right-10 animate-float-slower opacity-30">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl flex items-center justify-center shadow-xl rotate-12">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      </div>
    </div>
  );
}
