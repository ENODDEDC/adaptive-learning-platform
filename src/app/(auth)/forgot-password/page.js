'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
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
  }, [mousePosition.x, mousePosition.y]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage(data.message);
        setEmail('');
      } else {
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
        .forgot-viewport {
          min-height: 100dvh;
          height: 100dvh;
          overflow: hidden;
        }

        .forgot-shell {
          width: min(100%, 24rem);
          transform: scale(var(--forgot-scale, 1));
          transform-origin: center;
        }

        @media (max-height: 900px) {
          .forgot-shell {
            --forgot-scale: 0.95;
          }
        }

        @media (max-height: 820px) {
          .forgot-shell {
            --forgot-scale: 0.89;
          }
        }

        @media (max-height: 760px) {
          .forgot-shell {
            --forgot-scale: 0.83;
          }
        }
      `}</style>

    <div className="forgot-viewport relative bg-black text-white">
      {/* Neural Network Canvas */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Background Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-blue-900/20 to-purple-900/20"></div>

      {/* Navigation */}
      <nav className="fixed top-3 left-3 z-20">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all duration-300">
            <Image
              src="/favicon.svg"
              alt="Intelevo"
              width={20}
              height={20}
              className="rounded-lg"
            />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">Intelevo</span>
        </Link>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 flex h-full items-center justify-center px-3 py-3 sm:px-4">
        <div className={`forgot-shell transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>

          {/* Header */}
          <div className="text-center mb-3">
            <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-2.5 shadow-xl">
              <KeyIcon className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-[1.65rem] leading-tight font-black tracking-tighter mb-1.5">
              Reset Your
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Password</span>
            </h1>
            <p className="text-white/70 text-xs sm:text-sm">
              Enter your email and we&apos;ll send you a reset link
            </p>
          </div>

          {/* Reset Form */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Email Field */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-white/80">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Enter your email"
                  />
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                </div>
              </div>

              {/* Success Message */}
              {message && (
                <div className="p-2.5 bg-green-500/20 border border-green-500/30 rounded-xl backdrop-blur-sm">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-green-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-green-300">{message}</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-2.5 bg-red-500/20 border border-red-500/30 rounded-xl backdrop-blur-sm">
                  <div className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-xs text-red-300">{error}</p>
                  </div>
                </div>
              )}

              {/* Send Reset Link Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-sm text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-xl hover:shadow-2xl"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending...
                  </div>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>

            {/* Back to Login Link */}
            <div className="text-center mt-4">
              <Link
                href="/login"
                className="text-blue-400 hover:text-blue-300 transition-colors text-xs font-medium inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Login
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-3 text-[11px] text-white/50 leading-snug">
            <p>
              Remember your password?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-1/4 left-8 animate-float-slow opacity-20">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-xl">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        </div>
      </div>

      <div className="absolute bottom-1/4 right-8 animate-float-slower opacity-20">
        <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-3xl flex items-center justify-center shadow-xl rotate-12">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    </div>
    </>
  );
}

// Icon component
const KeyIcon = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
  </svg>
);
