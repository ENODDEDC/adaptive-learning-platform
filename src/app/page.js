'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [activeMode, setActiveMode] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  // 8 AI Learning Modes with complete information
  const learningModes = [
    {
      id: 'ai-narrator',
      name: 'AI Narrator',
      tagline: 'Listen & Learn in Taglish',
      icon: '🎧',
      color: 'from-blue-500 to-cyan-400',
      description: 'AI-powered audio narration with interactive quizzes, study tips, and summaries in Taglish (English + Tagalog)',
      features: ['Audio Narration', 'Interactive Quizzes', 'Study Tips', 'Document Summaries'],
      tech: 'Google TTS + Gemini AI'
    },
    {
      id: 'visual-learning',
      name: 'Visual Learning',
      tagline: 'See Concepts Come Alive',
      icon: '📊',
      color: 'from-emerald-500 to-teal-400',
      description: 'Transform complex ideas into stunning diagrams, infographics, mind maps, and flowcharts',
      features: ['AI Diagrams', 'Infographics', 'Mind Maps', 'Flowcharts'],
      tech: 'Gemini Image Generation'
    },
    {
      id: 'active-learning',
      name: 'Active Learning Hub',
      tagline: 'Learn by Doing',
      icon: '🎯',
      color: 'from-purple-500 to-violet-400',
      description: 'Hands-on activities, simulated discussions, and real-world scenarios for active learners',
      features: ['Interactive Activities', 'Group Simulations', 'Real Scenarios', 'Immediate Practice'],
      tech: 'Felder-Silverman Model'
    },
    {
      id: 'intuitive-learning',
      name: 'Concept Constellation',
      tagline: 'Discover Hidden Patterns',
      icon: '🔮',
      color: 'from-pink-500 to-rose-400',
      description: 'Explore concept universes, discover patterns, and unlock creative insights',
      features: ['Pattern Discovery', 'Concept Universe', 'Creative Insights', 'Innovation Ideas'],
      tech: 'Abstract Pattern AI'
    },
    {
      id: 'sensing-learning',
      name: 'Hands-On Lab',
      tagline: 'Experiment & Explore',
      icon: '🔬',
      color: 'from-orange-500 to-amber-400',
      description: 'Interactive simulations, practical challenges, and step-by-step laboratory experiences',
      features: ['Virtual Labs', 'Simulations', 'Practical Challenges', 'Real Experiments'],
      tech: 'Interactive Simulation Engine'
    },
    {
      id: 'global-learning',
      name: 'Global Learning',
      tagline: 'See the Big Picture',
      icon: '🌍',
      color: 'from-indigo-500 to-blue-400',
      description: 'Holistic overviews, system interconnections, and comprehensive understanding',
      features: ['Big Picture View', 'Interconnections', 'System Dynamics', 'Context Mapping'],
      tech: 'Holistic AI Analysis'
    },
    {
      id: 'sequential-learning',
      name: 'Sequential Learning',
      tagline: 'Step-by-Step Mastery',
      icon: '📋',
      color: 'from-green-500 to-emerald-400',
      description: 'Logical progression, concept dependencies, and structured learning flows',
      features: ['Step Breakdown', 'Concept Flow', 'Dependencies', 'Progress Tracking'],
      tech: 'Sequential AI Processing'
    },
    {
      id: 'reflective-learning',
      name: 'Reflective Learning',
      tagline: 'Think Deep, Learn Deeper',
      icon: '🤔',
      color: 'from-violet-500 to-purple-400',
      description: 'Deep contemplation, self-assessment, and metacognitive awareness tracking',
      features: ['Deep Analysis', 'Self-Assessment', 'Thought Evolution', 'Metacognition'],
      tech: 'Reflective AI Mentor'
    }
  ];

  useEffect(() => {
    setIsVisible(true);

    // Check authentication
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/profile');
        if (res.ok) {
          router.replace('/home');
        }
      } catch (error) {
        // Not authenticated
      }
    };
    checkAuth();

    // Scroll tracking
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);

    // Auto-rotate learning modes
    const interval = setInterval(() => {
      setActiveMode(prev => (prev + 1) % learningModes.length);
    }, 5000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(interval);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-indigo-900 text-white overflow-x-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-20 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
          backgroundSize: '50px 50px',
          transform: `translateY(${scrollY * 0.5}px)`
        }}></div>
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/30 backdrop-blur-2xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                <Image src="/platform_icon.png" alt="Intelevo" width={28} height={28} className="rounded-lg" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">Intelevo</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-white/80 hover:text-white transition-colors font-medium">
                Sign In
              </Link>
              <Link href="/register" className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-3 rounded-xl font-semibold hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105">
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          {/* Main Headline */}
          <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="inline-block mb-6 px-6 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full">
              <span className="text-blue-400 font-semibold">🚀 Powered by Advanced AI Technology</span>
            </div>

            <h1 className="text-6xl lg:text-8xl font-black mb-8 leading-tight">
              <span className="block text-white">Transform Learning with</span>
              <span className="block bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                8 AI Learning Modes
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-white/70 max-w-4xl mx-auto mb-12 leading-relaxed">
              Personalized AI-powered education that adapts to your unique learning style.
              From audio narration to visual diagrams, hands-on labs to deep reflection.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Link href="/register" className="group relative px-10 py-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl font-bold text-lg overflow-hidden hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105">
                <span className="relative z-10">Start Learning Now</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
              <Link href="#learning-modes" className="px-10 py-5 border-2 border-white/30 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all duration-300">
                Explore AI Modes
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-5xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">8</div>
                <div className="text-white/60">AI Learning Modes</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">24/7</div>
                <div className="text-white/60">AI Assistant</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2">∞</div>
                <div className="text-white/60">Personalized Content</div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-3 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </section>

      {/* 8 AI Learning Modes Showcase */}
      <section id="learning-modes" className="relative py-32 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-5xl lg:text-6xl font-black mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                8 Ways to Master Any Subject
              </span>
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Each mode powered by advanced AI, designed for different learning styles based on research
            </p>
          </div>

          {/* Learning Modes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
            {learningModes.map((mode, index) => (
              <div
                key={mode.id}
                className={`group relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-500 ${activeMode === index
                  ? 'border-white/40 bg-white/10 scale-105 shadow-2xl'
                  : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                  }`}
                onClick={() => setActiveMode(index)}
                onMouseEnter={() => setActiveMode(index)}
              >
                {/* Icon */}
                <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {mode.icon}
                </div>

                {/* Name */}
                <h3 className="text-2xl font-bold mb-2 text-white">{mode.name}</h3>

                {/* Tagline */}
                <p className="text-sm text-white/60 mb-4">{mode.tagline}</p>

                {/* Gradient Bar */}
                <div className={`h-1 w-full bg-gradient-to-r ${mode.color} rounded-full mb-4`}></div>

                {/* Features */}
                <div className="space-y-2">
                  {mode.features.slice(0, 2).map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-white/70">
                      <div className="w-1.5 h-1.5 bg-white/50 rounded-full"></div>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Active Indicator */}
                {activeMode === index && (
                  <div className="absolute top-4 right-4 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                )}
              </div>
            ))}
          </div>

          {/* Active Mode Details */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left: Details */}
              <div>
                <div className="text-6xl mb-6">{learningModes[activeMode].icon}</div>
                <h3 className="text-4xl font-black mb-4 text-white">{learningModes[activeMode].name}</h3>
                <p className="text-xl text-white/80 mb-8 leading-relaxed">{learningModes[activeMode].description}</p>

                <div className="space-y-3 mb-8">
                  {learningModes[activeMode].features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${learningModes[activeMode].color} flex items-center justify-center`}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-white/90 font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="inline-block px-4 py-2 bg-white/10 rounded-lg border border-white/20">
                  <span className="text-sm text-white/60">Powered by: </span>
                  <span className="text-sm text-white font-semibold">{learningModes[activeMode].tech}</span>
                </div>
              </div>

              {/* Right: Animated UI Preview */}
              <div className="relative">
                <div className={`rounded-3xl bg-gradient-to-br ${learningModes[activeMode].color} p-1 shadow-2xl`}>
                  <div className="w-full bg-gray-900 rounded-3xl p-6 overflow-hidden">
                    {/* Dynamic UI Preview based on active mode */}
                    {activeMode === 0 && ( // AI Narrator
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-xl">🎧</span>
                          </div>
                          <div className="flex-1">
                            <div className="h-2 bg-blue-500/30 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full animate-[pulse_2s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 space-y-2">
                          <div className="h-3 bg-white/20 rounded w-full"></div>
                          <div className="h-3 bg-white/20 rounded w-5/6"></div>
                          <div className="h-3 bg-white/20 rounded w-4/6"></div>
                        </div>
                        <div className="flex gap-2">
                          <div className="flex-1 bg-blue-500/20 rounded-lg p-3 text-center text-xs">Quiz</div>
                          <div className="flex-1 bg-blue-500/20 rounded-lg p-3 text-center text-xs">Tips</div>
                        </div>
                      </div>
                    )}

                    {activeMode === 1 && ( // Visual Learning
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-emerald-500/20 rounded-lg p-4 aspect-square flex items-center justify-center">
                            <div className="text-3xl animate-bounce">📊</div>
                          </div>
                          <div className="bg-emerald-500/20 rounded-lg p-4 aspect-square flex items-center justify-center">
                            <div className="text-3xl animate-bounce" style={{ animationDelay: '0.2s' }}>🗺️</div>
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-xl p-3 space-y-2">
                          <div className="flex gap-2">
                            <div className="w-8 h-8 bg-emerald-500/30 rounded"></div>
                            <div className="flex-1 space-y-1">
                              <div className="h-2 bg-white/20 rounded w-full"></div>
                              <div className="h-2 bg-white/20 rounded w-3/4"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeMode === 2 && ( // Active Learning
                      <div className="space-y-3">
                        <div className="bg-purple-500/20 rounded-xl p-4">
                          <div className="text-center mb-3">
                            <div className="text-2xl mb-2">🎯</div>
                            <div className="text-xs text-white/60">Interactive Scenario</div>
                          </div>
                          <div className="space-y-2">
                            <div className="bg-white/10 rounded-lg p-2 text-xs">Option A</div>
                            <div className="bg-purple-500/40 rounded-lg p-2 text-xs border border-purple-400">Option B ✓</div>
                            <div className="bg-white/10 rounded-lg p-2 text-xs">Option C</div>
                          </div>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <div className="flex-1 bg-green-500/20 rounded p-2 text-center">Correct!</div>
                        </div>
                      </div>
                    )}

                    {activeMode === 3 && ( // Intuitive Learning
                      <div className="relative h-64 flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-16 h-16 bg-pink-500/30 rounded-full animate-ping"></div>
                        </div>
                        <div className="relative grid grid-cols-3 gap-4">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center text-xs animate-pulse" style={{ animationDelay: `${i * 0.2}s` }}>
                              💡
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeMode === 4 && ( // Sensing Learning (Hands-On Lab)
                      <div className="space-y-3">
                        <div className="bg-orange-500/20 rounded-xl p-4 text-center">
                          <div className="text-4xl mb-2 animate-bounce">🔬</div>
                          <div className="text-xs text-white/60 mb-3">Virtual Lab Simulation</div>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white/10 rounded p-2 text-xs">Step 1 ✓</div>
                            <div className="bg-orange-500/40 rounded p-2 text-xs border border-orange-400">Step 2</div>
                            <div className="bg-white/10 rounded p-2 text-xs opacity-50">Step 3</div>
                          </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 text-xs">
                          <div className="h-2 bg-orange-500/30 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 rounded-full" style={{ width: '65%' }}></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeMode === 5 && ( // Global Learning
                      <div className="space-y-3">
                        <div className="relative h-48 bg-indigo-500/10 rounded-xl p-4">
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-5xl animate-spin" style={{ animationDuration: '10s' }}>🌍</div>
                          </div>
                          <div className="absolute top-4 left-4 bg-indigo-500/30 rounded-lg p-2 text-xs">Context</div>
                          <div className="absolute top-4 right-4 bg-indigo-500/30 rounded-lg p-2 text-xs">Systems</div>
                          <div className="absolute bottom-4 left-4 bg-indigo-500/30 rounded-lg p-2 text-xs">Relations</div>
                          <div className="absolute bottom-4 right-4 bg-indigo-500/30 rounded-lg p-2 text-xs">Overview</div>
                        </div>
                      </div>
                    )}

                    {activeMode === 6 && ( // Sequential Learning
                      <div className="space-y-3">
                        <div className="space-y-2">
                          {[1, 2, 3, 4].map((step) => (
                            <div key={step} className={`flex items-center gap-3 p-3 rounded-lg ${step <= 2 ? 'bg-green-500/20 border border-green-500/40' : 'bg-white/5'}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step <= 2 ? 'bg-green-500' : 'bg-white/20'}`}>
                                {step <= 2 ? '✓' : step}
                              </div>
                              <div className="flex-1">
                                <div className="h-2 bg-white/20 rounded w-full"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeMode === 7 && ( // Reflective Learning
                      <div className="space-y-3">
                        <div className="bg-violet-500/20 rounded-xl p-4">
                          <div className="text-center mb-3">
                            <div className="text-3xl mb-2">🤔</div>
                            <div className="text-xs text-white/60">Deep Reflection</div>
                          </div>
                          <div className="space-y-2">
                            <div className="bg-white/5 rounded-lg p-3">
                              <div className="h-2 bg-white/20 rounded w-full mb-2"></div>
                              <div className="h-2 bg-white/20 rounded w-5/6 mb-2"></div>
                              <div className="h-2 bg-white/20 rounded w-4/6"></div>
                            </div>
                            <div className="flex gap-2 text-xs">
                              <div className="flex-1 bg-violet-500/30 rounded p-2 text-center">Self-Assess</div>
                              <div className="flex-1 bg-violet-500/30 rounded p-2 text-center">Analyze</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Floating Elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-32 px-6 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-5xl font-black mb-6 text-white">How Intelevo Works</h2>
            <p className="text-xl text-white/70">Simple, powerful, and personalized for you</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Upload Your Content', desc: 'Upload any document (PDF, DOCX, PPTX)', icon: '📄' },
              { step: '02', title: 'Choose AI Mode', desc: 'Select from 8 AI learning modes that match your style', icon: '🎯' },
              { step: '03', title: 'Learn & Master', desc: 'Get personalized AI-generated content instantly', icon: '🚀' }
            ].map((item, i) => (
              <div key={i} className="relative p-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105">
                <div className="text-6xl mb-6">{item.icon}</div>
                <div className="text-5xl font-black text-white/20 mb-4">{item.step}</div>
                <h3 className="text-2xl font-bold mb-3 text-white">{item.title}</h3>
                <p className="text-white/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-3xl p-16 border border-white/20">
            <h2 className="text-5xl font-black mb-6 text-white">Ready to Transform Your Learning?</h2>
            <p className="text-xl text-white/70 mb-10">Join thousands of students already using AI-powered education</p>
            <Link href="/register" className="inline-block px-12 py-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl font-bold text-xl hover:shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105">
              Start Free Today
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto text-center text-white/50">
          <p>&copy; 2025 Intelevo. Powered by Advanced AI Technology.</p>
        </div>
      </footer>
    </div>
  );
}
