"use client"

import { Code2, Brain, Heart, Users, Target, Zap, Globe, Github, Sparkles, ArrowRight, Star, Trophy, Rocket } from "lucide-react"
import Link from "next/link"

export default function AboutPage() {
  const values = [
    {
      icon: <Brain className="h-8 w-8 text-primary-400" />,
      title: "AI-First Innovation",
      description: "We believe AI should amplify human creativity, not replace it. Every feature is designed to enhance your natural coding abilities.",
      gradient: "from-primary-400 to-cyan-400"
    },
    {
      icon: <Heart className="h-8 w-8 text-cyan-400" />,
      title: "Developer-Centric",
      description: "Built by developers, for developers. We understand the pain points because we live them every day.",
      gradient: "from-cyan-400 to-purple-400"
    },
    {
      icon: <Globe className="h-8 w-8 text-purple-400" />,
      title: "Open & Transparent",
      description: "Open source at heart. We believe in transparency, community collaboration, and shared innovation.",
      gradient: "from-purple-400 to-primary-400"
    },
    {
      icon: <Zap className="h-8 w-8 text-primary-400" />,
      title: "Performance First",
      description: "Speed and efficiency are not negotiable. Every millisecond matters when you're in the flow state.",
      gradient: "from-primary-400 to-cyan-400"
    }
  ]

  const stats = [
    { value: "2024", label: "Founded", subtitle: "Born from necessity" },
    { value: "10K+", label: "Developers", subtitle: "Growing community" },
    { value: "50+", label: "Languages", subtitle: "Supported" },
    { value: "∞", label: "Possibilities", subtitle: "With AI power" }
  ]

  const timeline = [
    {
      year: "2024",
      title: "The Spark",
      description: "Frustrated with existing editors, we envisioned an AI-first development environment that truly understands code."
    },
    {
      year: "2024",
      title: "First Lines",
      description: "Development began with a focus on creating the most intelligent and responsive code editor ever built."
    },
    {
      year: "2025",
      title: "Community Growth",
      description: "Thousands of developers joined our mission to revolutionize the coding experience with AI."
    },
    {
      year: "Future",
      title: "The Vision",
      description: "Building towards a future where AI and humans collaborate seamlessly in the creative process of coding."
    }
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-primary-950/20 to-purple-950/20" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_25%_75%,rgba(14,165,233,0.08),transparent_50%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(168,85,247,0.08),transparent_50%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.05),transparent_50%)]" />
      
      {/* Animated Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:32px_32px] animate-pulse-gentle" />
      
      <div className="relative pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Hero Section */}
          <div className="max-w-6xl mx-auto text-center mb-24">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="flex items-center gap-4">
                  <Code2 className="h-20 w-20 text-primary-400 animate-pulse" />
                  <Heart className="h-12 w-12 text-cyan-400 animate-pulse" style={{ animationDelay: '0.5s' }} />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-400/20 to-cyan-400/20 rounded-full blur-2xl animate-pulse-gentle" />
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                About
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                LiveEditor
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-gray-400 leading-relaxed max-w-5xl mx-auto mb-12">
              We&apos;re on a mission to revolutionize how developers create, collaborate, and innovate. 
              <span className="text-primary-400 font-semibold"> AI-powered. </span>
              <span className="text-cyan-400 font-semibold"> Community-driven. </span>
              <span className="text-purple-400 font-semibold"> Future-focused.</span>
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="text-4xl md:text-5xl font-black text-primary-400 mb-2 group-hover:scale-110 transition-transform">
                    {stat.value}
                  </div>
                  <div className="text-white font-semibold mb-1">{stat.label}</div>
                  <div className="text-sm text-gray-500">{stat.subtitle}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Mission Section */}
          <div className="max-w-6xl mx-auto mb-24">
            <div className="relative p-12 bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-3xl border border-gray-700/50 backdrop-blur-sm overflow-hidden">
              {/* Background Effects */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(14,165,233,0.1),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(168,85,247,0.1),transparent_50%)]" />
              
              <div className="relative">
                <div className="text-center mb-16">
                  <Target className="h-16 w-16 text-primary-400 mx-auto mb-6 animate-pulse" />
                  <h2 className="text-5xl md:text-6xl font-bold mb-8">
                    <span className="bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent">
                      Our Mission
                    </span>
                  </h2>
                  <p className="text-xl md:text-2xl text-gray-300 leading-relaxed max-w-4xl mx-auto">
                    To create the most intelligent, efficient, and delightful coding experience ever built. 
                    We envision a future where AI and human creativity merge seamlessly, where every developer 
                    can focus on solving problems rather than fighting tools.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-white mb-4">The Problem</h3>
                    <p className="text-gray-400 leading-relaxed">
                      Traditional code editors haven&apos;t evolved with the times. Developers spend countless hours 
                      on repetitive tasks, debugging syntax errors, and context-switching between tools. 
                      The development process should be fluid, intelligent, and inspiring.
                    </p>
                  </div>
                  <div className="space-y-6">
                    <h3 className="text-2xl font-bold text-white mb-4">Our Solution</h3>
                    <p className="text-gray-400 leading-relaxed">
                      LiveEditor leverages cutting-edge AI to understand not just what you&apos;re typing, 
                      but what you&apos;re trying to achieve. It anticipates your needs, suggests improvements, 
                      and learns from your patterns to become your perfect coding companion.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Values Section */}
          <div className="max-w-7xl mx-auto mb-24">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Our Values
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                The principles that guide every decision, every line of code, and every interaction with our community.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {values.map((value, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl backdrop-blur-sm border border-gray-700/50 group-hover:border-primary-500/30 transition-all duration-500" />
                  <div className={`absolute inset-0 bg-gradient-to-br ${value.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-all duration-500`} />
                  
                  <div className="relative p-8">
                    <div className="flex items-start gap-6">
                      <div className="relative flex-shrink-0">
                        <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 group-hover:border-primary-500/30 transition-all duration-300">
                          {value.icon}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-primary-300 transition-colors">
                          {value.title}
                        </h3>
                        <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                          {value.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="max-w-6xl mx-auto mb-24">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-purple-400 to-primary-400 bg-clip-text text-transparent">
                  Our Journey
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                From a simple idea to a revolutionary development platform. Here&apos;s how we&apos;re building the future of coding.
              </p>
            </div>

            <div className="space-y-8">
              {timeline.map((item, index) => (
                <div key={index} className="group relative">
                  <div className="flex items-start gap-8">
                    {/* Timeline Line */}
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-primary-400 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-sm group-hover:scale-110 transition-transform">
                        {item.year}
                      </div>
                      {index < timeline.length - 1 && (
                        <div className="w-px h-24 bg-gradient-to-b from-primary-400/50 to-transparent mt-4" />
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 pb-12">
                      <div className="relative p-6 bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-xl border border-gray-700/50 backdrop-blur-sm group-hover:border-primary-500/30 transition-all duration-300">
                        <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary-300 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Technology & Innovation Section */}
          <div className="max-w-6xl mx-auto mb-24">
            <div className="relative p-12 bg-gradient-to-br from-primary-950/20 via-gray-800/30 to-purple-950/20 rounded-3xl border border-gray-700/50 backdrop-blur-sm overflow-hidden">
              {/* Background Effects */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(14,165,233,0.1),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.1),transparent_50%)]" />
              
              <div className="relative text-center">
                <Rocket className="h-16 w-16 text-primary-400 mx-auto mb-8 animate-pulse" />
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent">
                    Cutting-Edge Technology
                  </span>
                </h2>
                <p className="text-xl text-gray-400 mb-12 max-w-4xl mx-auto leading-relaxed">
                  LiveEditor is built on the latest technologies and powered by advanced AI models. 
                  We&apos;re constantly pushing the boundaries of what&apos;s possible in developer tools.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    { 
                      icon: <Brain className="h-8 w-8" />, 
                      title: "Advanced AI", 
                      desc: "State-of-the-art language models fine-tuned for code understanding",
                      tech: "GPT-4, CodeT5, Custom Models"
                    },
                    { 
                      icon: <Zap className="h-8 w-8" />, 
                      title: "High Performance", 
                      desc: "Optimized architecture built for speed and responsiveness",
                      tech: "Rust, WebAssembly, V8"
                    },
                    { 
                      icon: <Globe className="h-8 w-8" />, 
                      title: "Modern Web", 
                      desc: "Progressive web app with native-like performance",
                      tech: "React, TypeScript, Next.js"
                    }
                  ].map((item, index) => (
                    <div key={index} className="text-center group">
                      <div className="mx-auto w-16 h-16 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center justify-center mb-6 group-hover:border-primary-500/30 transition-all duration-300">
                        <div className="text-primary-400">
                          {item.icon}
                        </div>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3">{item.title}</h3>
                      <p className="text-gray-400 mb-3 leading-relaxed">{item.desc}</p>
                      <p className="text-sm text-primary-400 font-mono">{item.tech}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Community & Open Source */}
          <div className="max-w-6xl mx-auto mb-24">
            <div className="text-center mb-16">
              <Users className="h-16 w-16 text-cyan-400 mx-auto mb-6 animate-pulse" />
              <h2 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Open Source & Community
                </span>
              </h2>
              <p className="text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
                LiveEditor thrives because of our amazing community. We believe in transparency, 
                collaboration, and the collective power of developers worldwide.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="relative p-8 bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                <Github className="h-12 w-12 text-primary-400 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4">Open Source First</h3>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Our code is open, our roadmap is public, and our decisions are transparent. 
                  Join us in building the future of development tools.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Star className="h-4 w-4 text-yellow-400" />
                    <span>5.2k stars</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="h-4 w-4 text-cyan-400" />
                    <span>430 contributors</span>
                  </div>
                </div>
              </div>

              <div className="relative p-8 bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-2xl border border-gray-700/50 backdrop-blur-sm">
                <Trophy className="h-12 w-12 text-cyan-400 mb-6" />
                <h3 className="text-2xl font-bold text-white mb-4">Community Driven</h3>
                <p className="text-gray-400 leading-relaxed mb-6">
                  Every feature request, bug report, and suggestion matters. Our community 
                  shapes the direction of LiveEditor.
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="h-4 w-4 text-purple-400" />
                    <span>12k+ community members</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="max-w-5xl mx-auto text-center">
            <div className="relative p-12 bg-gradient-to-br from-primary-950/20 via-gray-800/30 to-purple-950/20 rounded-3xl border border-gray-700/50 backdrop-blur-sm overflow-hidden">
              {/* Background Effects */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.1),transparent_70%)]" />
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-primary-400/50 to-transparent" />
              
              <div className="relative">
                <Sparkles className="h-16 w-16 text-primary-400 mx-auto mb-8 animate-pulse" />
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Join the Revolution
                  </span>
                </h2>
                
                <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-3xl mx-auto">
                  Be part of the future of development. Whether you&apos;re contributing code, 
                  sharing feedback, or simply using LiveEditor, you&apos;re helping shape the next generation of developer tools.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
                  <Link href="/community">
                    <button className="group relative px-8 py-4 bg-gradient-to-r from-primary-500 to-cyan-500 rounded-xl font-bold text-white shadow-lg hover:shadow-primary-500/25 transition-all duration-300 transform hover:-translate-y-1">
                      <span className="flex items-center gap-3">
                        <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Join Our Community
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  </Link>
                  
                  <Link href="https://github.com/liveeditor" target="_blank">
                    <button className="group px-8 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl font-semibold text-white hover:border-primary-500/50 hover:bg-gray-700/50 transition-all duration-300">
                      <span className="flex items-center gap-3">
                        <Github className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        View on GitHub
                      </span>
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
