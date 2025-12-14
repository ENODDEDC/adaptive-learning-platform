'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiEye, FiEyeOff, FiLock, FiCheck, FiX } from 'react-icons/fi';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false,
  });
  const router = useRouter();
  const params = useParams();
  const canvasRef = useRef(null);
  const token = params.token;

  useEffect(() => {
    setIsVisible(true);

    // Mouse tracking
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

      nodes.forEach((node) => {
        const dx = mousePosition.x - node.x;
        const dy = mousePosition.y - node.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 80) {
          const force = (80 - distance) / 80;
          node.vx += (dx / distance) * force * 0.005;
          node.vy += (dy / distance) * force * 0.005;
        }

        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
        if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

        node.x = Math.max(0, Math.min(canvas.width, node.x));
        node.y = Math.max(0, Math.min(canvas.height, node.y));

        node.vx *= 0.995;
        node.vy *= 0.995;

        node.pulse += 0.005;
        const pulseSize = node.size + Math.sin(node.pulse) * 0.3;

        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${node.hue}, 70%, 60%, 0.3)`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseSize * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${node.hue}, 70%, 60%, 0.05)`;
        ctx.fill();
      });

      connections.forEach((conn) => {
        const from = nodes[conn.from];
        const to = nodes[conn.to];

        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.strokeStyle = `hsla(220, 70%, 60%, ${conn.strength * 0.15})`;
        ctx.lineWidth = conn.active ? 1.5 : 0.5;
        ctx.stroke();
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mousePosition.x, mousePosition.y]);

  // Password validation
  useEffect(() => {
    const requirements = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    setPasswordRequirements(requirements);

    const strength = Object.values(requirements).filter(Boolean).length;
    setPasswordStrength(strength);
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordStrength < 5) {
      setError('Please meet all password requirements');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 2) return 'bg-red-500';
    if (passwordStrength <= 3) return 'bg-yellow-500';
    if (passwordStrength <= 4) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getStrengthText = () => {
    if (passwordStrength <= 2) return 'Weak';
    if (passwordStrength <= 3) return 'Fair';
    if (passwordStrength <= 4) return 'Good';
    return 'Strong';
  };

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      />

      <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-900/20 to-purple-900/20"></div>

      <nav className="fixed top-4 left-4 z-20">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all duration-300">
            <Image
              src="/favicon.svg"
              alt="Intelevo"
              width={24}
              height={24}
              className="group-hover:scale-110 transition-transform duration-300"
            />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Intelevo
          </span>
        </Link>
      </nav>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div
          className={`w-full max-w-md transition-all duration-700 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FiLock className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Reset Password
            </h1>
            <p className="text-center text-gray-400 mb-8">
              Enter your new password below
            </p>

            {message && (
              <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
                <FiCheck className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-green-400 text-sm">{message}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <FiX className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>

                {password && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400">Password Strength</span>
                      <span className={`text-xs font-medium ${
                        passwordStrength <= 2 ? 'text-red-400' :
                        passwordStrength <= 3 ? 'text-yellow-400' :
                        passwordStrength <= 4 ? 'text-blue-400' : 'text-green-400'
                      }`}>
                        {getStrengthText()}
                      </span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                        style={{ width: `${(passwordStrength / 5) * 100}%` }}
                      ></div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {[
                        { key: 'length', label: 'At least 8 characters' },
                        { key: 'lowercase', label: 'One lowercase letter' },
                        { key: 'uppercase', label: 'One uppercase letter' },
                        { key: 'number', label: 'One number' },
                        { key: 'special', label: 'One special character' },
                      ].map((req) => (
                        <div key={req.key} className="flex items-center gap-2">
                          {passwordRequirements[req.key] ? (
                            <FiCheck className="w-4 h-4 text-green-400" />
                          ) : (
                            <FiX className="w-4 h-4 text-gray-600" />
                          )}
                          <span className={`text-xs ${
                            passwordRequirements[req.key] ? 'text-green-400' : 'text-gray-500'
                          }`}>
                            {req.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
                    placeholder="Confirm new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || passwordStrength < 5 || password !== confirmPassword}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Resetting...</span>
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm text-gray-400 hover:text-white transition-colors inline-flex items-center gap-2"
              >
                <span>←</span>
                Back to Login
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              <Link href="/terms" className="hover:text-gray-400 transition-colors">
                Terms of Service
              </Link>
              {' • '}
              <Link href="/privacy" className="hover:text-gray-400 transition-colors">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full blur-2xl animate-pulse pointer-events-none"></div>
      <div className="fixed top-1/4 left-8 w-20 h-20 bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-full blur-2xl animate-pulse pointer-events-none" style={{ animationDelay: '1s' }}></div>
    </div>
  );
}
