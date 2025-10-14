'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/profile');
        if (res.ok) {
          router.replace('/home');
        }
      } catch (error) {
        // User is not authenticated, show landing page
      }
    };
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Neural Network Canvas */}
      <canvas
        ref={(canvas) => {
          if (!canvas) return;
          const ctx = canvas.getContext('2d');
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;

          const nodes = [];
          const connections = [];
          const numNodes = 20;

          // Create nodes
          for (let i = 0; i < numNodes; i++) {
            nodes.push({
              x: Math.random() * canvas.width,
              y: Math.random() * canvas.height,
              vx: (Math.random() - 0.5) * 0.3,
              vy: (Math.random() - 0.5) * 0.3,
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
              node.x += node.vx;
              node.y += node.vy;

              if (node.x < 0 || node.x > canvas.width) node.vx *= -1;
              if (node.y < 0 || node.y > canvas.height) node.vy *= -1;

              node.x = Math.max(0, Math.min(canvas.width, node.x));
              node.y = Math.max(0, Math.min(canvas.height, node.y));

              node.vx *= 0.995;
              node.vy *= 0.995;

              node.pulse += 0.01;
              const pulseSize = node.size + Math.sin(node.pulse) * 0.3;

              ctx.beginPath();
              ctx.arc(node.x, node.y, pulseSize, 0, Math.PI * 2);
              ctx.fillStyle = `hsla(${node.hue}, 70%, 60%, 0.4)`;
              ctx.fill();

              ctx.beginPath();
              ctx.arc(node.x, node.y, pulseSize * 1.5, 0, Math.PI * 2);
              ctx.fillStyle = `hsla(${node.hue}, 70%, 60%, 0.1)`;
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
                ctx.lineWidth = connection.active ? 1.5 : 0.8;
                ctx.stroke();
              }
            });

            requestAnimationFrame(animate);
          };

          animate();
        }}
        className="fixed inset-0 w-full h-full pointer-events-none opacity-30"
      />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <Image
                  src="/platform_icon.png"
                  alt="Intelevo"
                  width={28}
                  height={28}
                  className="rounded-lg"
                />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white">Intelevo</span>
            </div>
            <div className="flex items-center gap-8">
              <Link
                href="/visual-mockups"
                className="text-white/70 hover:text-white transition-colors text-sm font-medium"
              >
                View Mockups
              </Link>
              <Link
                href="/login"
                className="text-white/70 hover:text-white transition-colors text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="bg-white text-black px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-100 transition-all duration-200 transform hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center z-10">
        <div className="text-center max-w-5xl mx-auto px-6">
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="mb-8">
              <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-none mb-6">
                <span className="inline-block animate-float">Where AI Meets</span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-pulse">
                  Human Learning
                </span>
              </h1>
              <div className="flex justify-center gap-2 mb-8">
                <div className="w-3 h-3 bg-blue-400 rounded-full animate-ping"></div>
                <div className="w-3 h-3 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-pink-400 rounded-full animate-ping" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>

            <p className="text-xl lg:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-12 font-light">
              Transform your educational experience with AI-powered courses, intelligent assistance,
              and collaborative learning environments designed for the modern learner.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Link
                href="/register"
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-blue-500/25"
              >
                Start Learning Today
              </Link>
              <Link
                href="#features"
                className="border border-white/30 text-white px-8 py-4 rounded-xl text-lg font-medium hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
              >
                Explore Features
              </Link>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">24/7</div>
                <div className="text-white/70">AI Learning Assistant</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">∞</div>
                <div className="text-white/70">Unlimited Courses</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-pink-400 mb-2">AI</div>
                <div className="text-white/70">Smart Analytics</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="relative py-32 bg-gradient-to-b from-black via-gray-900 to-black z-10">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-6xl font-black tracking-tighter mb-6 text-white">
              Real Learning
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Scenarios</span>
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              See how Intelevo transforms everyday learning challenges into opportunities for success.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Student Scenario */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">For Students</h3>
                <p className="text-white/70 leading-relaxed mb-6">
                  &ldquo;Stuck on calculus at 2 AM? Intelevo&rsquo;s AI explains complex problems step-by-step,
                  creates custom practice sets, and even generates study schedules based on your progress.&rdquo;
                </p>
                <div className="text-sm text-blue-400 font-medium">Sarah, Computer Science Student</div>
              </div>
            </div>

            {/* Instructor Scenario */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">For Instructors</h3>
                <p className="text-white/70 leading-relaxed mb-6">
                  &ldquo;Create engaging courses with AI-assisted content generation, automated grading,
                  and real-time student progress insights. Spend more time teaching, less time administrating.&rdquo;
                </p>
                <div className="text-sm text-purple-400 font-medium">Dr. Martinez, Physics Professor</div>
              </div>
            </div>

            {/* Group Learning Scenario */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-red-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-400 to-pink-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">For Groups</h3>
                <p className="text-white/70 leading-relaxed mb-6">
                  &ldquo;Form study clusters with classmates, share resources, collaborate on projects,
                  and learn from peers. Our AI matches you with compatible study partners.&rdquo;
                </p>
                <div className="text-sm text-pink-400 font-medium">Study Group Alpha</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-32 bg-black z-10">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-6xl font-black tracking-tighter mb-6 text-white">
              Intelligent
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Features</span>
            </h2>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Every feature designed with AI at its core, creating an educational experience that adapts, assists, and inspires.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* AI Assistant */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">AI Learning Assistant</h3>
                <p className="text-white/70 leading-relaxed mb-6">
                  Get instant help with any subject. Our advanced AI understands context, provides personalized explanations,
                  generates practice questions, and adapts to your learning style.
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-white/60 font-medium">Available 24/7</span>
                </div>
              </div>
            </div>

            {/* Course Management */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Smart Course Management</h3>
                <p className="text-white/70 leading-relaxed mb-6">
                  Create and join courses with intelligent organization. Track assignments, receive announcements,
                  submit work, and monitor progress with AI-powered insights and recommendations.
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-white/60 font-medium">Unlimited Courses</span>
                </div>
              </div>
            </div>

            {/* Document Creation */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-green-500 to-teal-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">AI Document Creation</h3>
                <p className="text-white/70 leading-relaxed mb-6">
                  Transform your ideas into professional documents instantly. Generate essays, reports, and study materials
                  with AI-powered writing assistance, research, and formatting.
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-white/60 font-medium">Smart Writing</span>
                </div>
              </div>
            </div>

            {/* Analytics & Progress */}
            <div className="group relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all duration-300">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Smart Analytics</h3>
                <p className="text-white/70 leading-relaxed mb-6">
                  Monitor your learning journey with detailed analytics. Track study time, assignment completion,
                  performance trends, and receive AI-powered recommendations for improvement.
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-white/60 font-medium">Data-Driven Learning</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="relative py-32 bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 z-10">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl lg:text-6xl font-black tracking-tighter mb-6 text-white">
              Getting
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Started</span>
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Join thousands of learners already using Intelevo to transform their educational experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
                <span className="text-2xl font-bold text-white">01</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Create Account</h3>
              <p className="text-white/70 leading-relaxed">
                Sign up in seconds and let our AI learn about your goals, preferences, and learning style.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
                <span className="text-2xl font-bold text-white">02</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Join or Create</h3>
              <p className="text-white/70 leading-relaxed">
                Browse available courses or create your own. Connect with instructors and fellow learners instantly.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
                <span className="text-2xl font-bold text-white">03</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white">Start Learning</h3>
              <p className="text-white/70 leading-relaxed">
                Access AI tools, complete assignments, and get personalized help whenever you need it.
              </p>
            </div>
          </div>

          <div className="text-center mt-16">
            <Link
              href="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-2xl"
            >
              Begin Your Learning Journey
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16 border-t border-white/10">
        <div className="max-w-screen-xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                  <Image
                    src="/platform_icon.png"
                    alt="Intelevo"
                    width={28}
                    height={28}
                    className="rounded-lg"
                  />
                </div>
                <span className="text-2xl font-bold">Intelevo</span>
              </div>
              <p className="text-white/60 leading-relaxed mb-8 max-w-md">
                Pioneering the future of education through artificial intelligence and neural network technology.
                Where every connection sparks learning.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-white/60 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-white/60 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-white">Platform</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-white/60 hover:text-white transition-colors">AI Assistant</Link></li>
                <li><Link href="#" className="text-white/60 hover:text-white transition-colors">Courses</Link></li>
                <li><Link href="#" className="text-white/60 hover:text-white transition-colors">Analytics</Link></li>
                <li><Link href="#" className="text-white/60 hover:text-white transition-colors">Clusters</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-6 text-white">Support</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-white/60 hover:text-white transition-colors">Help Center</Link></li>
                <li><Link href="#" className="text-white/60 hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="text-white/60 hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="#" className="text-white/60 hover:text-white transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-16 pt-8 text-center">
            <p className="text-white/40">&copy; 2025 Intelevo. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}