'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import TermsModal from '@/components/TermsModal';
import PrivacyModal from '@/components/PrivacyModal';

// Password strength calculator
const calculatePasswordStrength = (password) => {
  if (!password) return { score: 0, strength: '', color: '' };

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

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    middleName: '',
    surname: '',
    suffix: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, strength: '', color: '', bgColor: '' });
  const [showPasswords, setShowPasswords] = useState(false);
  const router = useRouter();
  const canvasRef = useRef(null);

  useEffect(() => {
    setIsVisible(true);

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
    const numNodes = 18;

    // Create nodes
    for (let i = 0; i < numNodes; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2.5 + 1,
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

        if (distance < 120) {
          connections.push({
            from: i,
            to: j,
            strength: 1 - distance / 120,
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

        if (distance < 100) {
          const force = (100 - distance) / 100;
          node.vx += (dx / distance) * force * 0.008;
          node.vy += (dy / distance) * force * 0.008;
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
        node.pulse += 0.008;
        const pulseSize = node.size + Math.sin(node.pulse) * 0.4;

        // Draw node
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${node.hue}, 70%, 60%, 0.35)`;
        ctx.fill();

        // Glow effect
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize * 1.3, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${node.hue}, 70%, 60%, 0.08)`;
        ctx.fill();
      });

      // Draw connections
      connections.forEach((connection) => {
        const fromNode = nodes[connection.from];
        const toNode = nodes[connection.to];

        const dx = fromNode.x - toNode.x;
        const dy = fromNode.y - toNode.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 120) {
          const opacity = (1 - distance / 120) * connection.strength * 0.2;

          ctx.beginPath();
          ctx.moveTo(fromNode.x, fromNode.y);
          ctx.lineTo(toNode.x, toNode.y);
          ctx.strokeStyle = `hsla(${fromNode.hue}, 70%, 60%, ${opacity})`;
          ctx.lineWidth = connection.active ? 1.3 : 0.7;
          ctx.stroke();
        }
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/profile');
        if (res.ok) {
          router.push('/home');
        }
      } catch (error) {
        console.error('Failed to check authentication status:', error);
      }
    };
    checkAuth();
  }, [router]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
    
    // Calculate password strength when password changes
    if (id === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setStep(2);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: formData.email, otp }),
      });

      if (res.ok) {
        router.push('/login?verified=true');
      } else {
        const data = await res.json();
        setError(data.message);
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
      
      <div className="relative min-h-screen bg-black text-white overflow-hidden">
        {/* Neural Network Canvas */}
        <canvas
          ref={canvasRef}
          className="fixed inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 1 }}
        />

      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900/15 to-blue-900/15"></div>

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

          {/* Step Indicator */}
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${step === 1 ? 'bg-blue-400 scale-125' : 'bg-white/30'}`}></div>
              <div className="w-4 h-px bg-white/20"></div>
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${step === 2 ? 'bg-purple-400 scale-125' : 'bg-white/30'}`}></div>
            </div>
          </div>

          {step === 1 ? (
            <>
              {/* Header */}
              <div className="text-center mb-4">
                <h1 className="text-2xl font-black tracking-tighter mb-2">
                  Start Your
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Learning Journey</span>
                </h1>
                <p className="text-white/70 text-sm">
                  Create your account and become part of the intelligent learning ecosystem
                </p>
              </div>

              {/* Registration Form */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                <form onSubmit={handleRegister} className="space-y-3">
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

                  {/* Email Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">Email Address *</label>
                    <div className="relative">
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                        placeholder="Enter your email"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </div>

                  {/* Password Fields */}
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-white/80">Password Fields</label>
                        <button
                          type="button"
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="flex items-center gap-2 text-xs text-white/60 hover:text-white/90 transition-colors"
                        >
                          {showPasswords ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                              Hide
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              Show
                            </>
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white/80">Password *</label>
                          <div className="relative">
                            <input
                              id="password"
                              type={showPasswords ? "text" : "password"}
                              value={formData.password}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                              placeholder="Create password"
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-white/80">Confirm Password *</label>
                          <div className="relative">
                            <input
                              id="confirmPassword"
                              type={showPasswords ? "text" : "password"}
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              required
                              className="w-full px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                              placeholder="Confirm password"
                            />
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Password Strength Indicator */}
                    {formData.password && (
                      <div className="space-y-2 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-white/60">Password Strength:</span>
                          <span className={`text-xs font-semibold ${passwordStrength.color}`}>
                            {passwordStrength.strength}
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                          <div
                            className={`h-full ${passwordStrength.bgColor} transition-all duration-500 ease-out rounded-full`}
                            style={{ width: `${passwordStrength.score}%` }}
                          >
                            <div className="h-full w-full bg-gradient-to-r from-transparent to-white/30 animate-shimmer"></div>
                          </div>
                        </div>

                        {/* Password Requirements */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className={`flex items-center gap-1 ${/[a-z]/.test(formData.password) ? 'text-green-400' : 'text-white/40'}`}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              {/[a-z]/.test(formData.password) ? (
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              ) : (
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              )}
                            </svg>
                            <span>Lowercase</span>
                          </div>
                          <div className={`flex items-center gap-1 ${/[A-Z]/.test(formData.password) ? 'text-green-400' : 'text-white/40'}`}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              {/[A-Z]/.test(formData.password) ? (
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              ) : (
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              )}
                            </svg>
                            <span>Uppercase</span>
                          </div>
                          <div className={`flex items-center gap-1 ${/[0-9]/.test(formData.password) ? 'text-green-400' : 'text-white/40'}`}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              {/[0-9]/.test(formData.password) ? (
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              ) : (
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              )}
                            </svg>
                            <span>Number</span>
                          </div>
                          <div className={`flex items-center gap-1 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? 'text-green-400' : 'text-white/40'}`}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password) ? (
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              ) : (
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              )}
                            </svg>
                            <span>Special</span>
                          </div>
                          <div className={`flex items-center gap-1 col-span-2 ${formData.password.length >= 8 ? 'text-green-400' : 'text-white/40'}`}>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              {formData.password.length >= 8 ? (
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              ) : (
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              )}
                            </svg>
                            <span>At least 8 characters</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Terms Checkboxes */}
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 text-sm text-white/80 cursor-pointer">
                      <input
                        id="terms"
                        type="checkbox"
                        required
                        className="mt-1 w-4 h-4 bg-white/10 border-white/20 rounded focus:ring-blue-500 text-blue-500"
                      />
                      <span>
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setShowTermsModal(true)}
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          Terms and Conditions
                        </button>
                      </span>
                    </label>
                    <label className="flex items-start gap-3 text-sm text-white/80 cursor-pointer">
                      <input
                        id="privacy"
                        type="checkbox"
                        required
                        className="mt-1 w-4 h-4 bg-white/10 border-white/20 rounded focus:ring-blue-500 text-blue-500"
                      />
                      <span>
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={() => setShowPrivacyModal(true)}
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          Privacy Policy
                        </button>
                      </span>
                    </label>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  )}

                  {/* Register Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl hover:shadow-2xl"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Creating Account...
                      </div>
                    ) : (
                      'Sign Up'
                    )}
                  </button>
                </form>

                {/* Sign In Link */}
                <div className="text-center mt-6">
                  <p className="text-white/70">
                    Already have an account?{' '}
                    <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                      Sign in
                    </Link>
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* OTP Verification Header */}
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl">
                  <MailIcon className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-black tracking-tighter mb-2">
                  Verify Your
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-500">Connection</span>
                </h1>
                <p className="text-white/70 text-sm">
                  We&rsquo;ve sent a verification code to <strong className="text-blue-400">{formData.email}</strong>
                </p>
              </div>

              {/* OTP Form */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl">
                {message && (
                  <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl backdrop-blur-sm mb-6">
                    <p className="text-sm text-blue-300">{message}</p>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80 block text-center">Verification Code</label>
                    <div className="relative">
                      <input
                        id="otp"
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        required
                        className="w-full px-4 py-3 text-center text-xl tracking-widest bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm"
                        placeholder="000000"
                        maxLength="6"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-green-500/20 to-blue-500/20 opacity-0 focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                    <p className="text-xs text-white/60 text-center">Enter the 6-digit code sent to your email</p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
                      <p className="text-sm text-red-300">{error}</p>
                    </div>
                  )}

                  {/* Verify Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl hover:shadow-2xl"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Verifying...
                      </div>
                    ) : (
                      'Verify & Connect'
                    )}
                  </button>
                </form>

                {/* Go Back Link */}
                <div className="text-center mt-6">
                  <button
                    onClick={() => setStep(1)}
                    className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
                  >
                    ← Go back and try again
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Footer */}
          <div className="text-center mt-4 text-xs text-white/50">
            <p>
              By creating an account, you agree to our{' '}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Terms
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Privacy Policy
              </button>
            </p>
          </div>
        </div>
      </div>

        {/* Modals */}
        <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
        <PrivacyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} />

        {/* Floating Elements */}
        <div className="absolute top-1/4 left-10 animate-float-slow opacity-20">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-3xl flex items-center justify-center shadow-xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>

        <div className="absolute bottom-1/4 right-10 animate-float-slower opacity-20">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}

// Icon components
const MailIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 21.75 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
  </svg>
);