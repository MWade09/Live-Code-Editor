"use client"

import { Code2, Zap, Brain, Users, Search, Settings, Eye, Shield, CheckCircle, Sparkles, Download } from "lucide-react"
import Link from "next/link"

export default function FeaturesPage() {
  const features = [
    {
      icon: <Brain className="h-12 w-12 text-primary-400" />,
      title: "AI Code Intelligence",
      description: "Revolutionary AI-powered coding assistance that understands context, predicts intent, and generates intelligent code solutions.",
      benefits: [
        "Context-aware completions",
        "Multi-language support",
        "Smart error detection",
        "Code explanation & optimization"
      ],
      gradient: "from-primary-400 to-cyan-400"
    },
    {
      icon: <Code2 className="h-12 w-12 text-cyan-400" />,
      title: "Advanced Code Actions",
      description: "Transform your development workflow with intelligent refactoring, automated testing, and comprehensive code analysis.",
      benefits: [
        "Intelligent refactoring",
        "Automated test generation",
        "Code quality analysis",
        "Documentation generation"
      ],
      gradient: "from-cyan-400 to-primary-400"
    },
    {
      icon: <Zap className="h-12 w-12 text-purple-400" />,
      title: "Lightning Performance",
      description: "Built for speed with cutting-edge architecture, optimized rendering, and real-time responsiveness that keeps up with your thoughts.",
      benefits: [
        "Instant startup & response",
        "Smooth 60fps editing",
        "Efficient memory usage",
        "Real-time syntax highlighting"
      ],
      gradient: "from-purple-400 to-primary-400"
    },
    {
      icon: <Users className="h-12 w-12 text-cyan-400" />,
      title: "Collaborative Workspace",
      description: "Connect with developers worldwide through seamless sharing, real-time collaboration, and community-driven development.",
      benefits: [
        "Real-time collaboration",
        "Code sharing & discovery",
        "Community discussions",
        "Team workspace management"
      ],
      gradient: "from-cyan-400 to-purple-400"
    },
    {
      icon: <Search className="h-12 w-12 text-primary-400" />,
      title: "Intelligent Search",
      description: "Find anything instantly with AI-powered search that understands code semantics, patterns, and developer intent.",
      benefits: [
        "Semantic code search",
        "Advanced regex support",
        "Cross-file navigation",
        "Smart search suggestions"
      ],
      gradient: "from-primary-400 to-purple-400"
    },
    {
      icon: <Settings className="h-12 w-12 text-purple-400" />,
      title: "Infinite Customization",
      description: "Tailor every aspect of your coding environment with deep customization options, themes, and extensibility.",
      benefits: [
        "Custom themes & layouts",
        "Personalized keybindings",
        "Extension ecosystem",
        "Workspace configurations"
      ],
      gradient: "from-purple-400 to-cyan-400"
    },
    {
      icon: <Eye className="h-12 w-12 text-cyan-400" />,
      title: "Live Preview & Execution",
      description: "See your code come to life instantly with integrated preview, execution environments, and real-time debugging.",
      benefits: [
        "Instant HTML/CSS preview",
        "JavaScript execution",
        "Real-time debugging",
        "Mobile responsive testing"
      ],
      gradient: "from-cyan-400 to-primary-400"
    },
    {
      icon: <Shield className="h-12 w-12 text-primary-400" />,
      title: "Privacy & Security",
      description: "Your code remains private and secure with local processing, encrypted connections, and privacy-first architecture.",
      benefits: [
        "Local AI processing",
        "End-to-end encryption",
        "Zero-trust architecture",
        "No code tracking or storage"
      ],
      gradient: "from-primary-400 to-purple-400"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-950 via-primary-950/20 to-purple-950/20" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(14,165,233,0.08),transparent_50%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(168,85,247,0.08),transparent_50%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(79,70,229,0.05),transparent_50%)]" />
      
      {/* Animated Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:32px_32px] animate-pulse-gentle" />
      
      <div className="relative pt-32 pb-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="max-w-5xl mx-auto text-center mb-20">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Sparkles className="h-16 w-16 text-primary-400 animate-pulse" />
                <div className="absolute inset-0 bg-primary-400/20 rounded-full blur-xl animate-pulse-gentle" />
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Revolutionary
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                Features
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-400 leading-relaxed max-w-4xl mx-auto mb-8">
              Experience the future of development with{" "}
              <span className="text-primary-400 font-semibold">AI-powered intelligence</span>,{" "}
              <span className="text-cyan-400 font-semibold">lightning performance</span>, and{" "}
              <span className="text-purple-400 font-semibold">infinite customization</span>.
            </p>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {[
                { value: "99.9%", label: "Uptime" },
                { value: "<100ms", label: "Response" },
                { value: "50+", label: "Languages" },
                { value: "∞", label: "Possibilities" }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary-400 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-500 uppercase tracking-wider">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto mb-24">
            {features.map((feature, index) => (
              <div key={index} className="group relative">
                {/* Card Background with Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl backdrop-blur-sm border border-gray-700/50 group-hover:border-primary-500/30 transition-all duration-500" />
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-all duration-500`} />
                
                {/* Card Content */}
                <div className="relative p-8">
                  <div className="flex items-start gap-6 mb-6">
                    <div className="relative flex-shrink-0">
                      <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 group-hover:border-primary-500/30 transition-all duration-300">
                        {feature.icon}
                      </div>
                      <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 rounded-xl transition-all duration-300`} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary-300 transition-colors duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Benefits List */}
                  <ul className="space-y-3">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center gap-3 text-gray-300 group-hover:text-white transition-colors duration-300">
                        <div className="relative">
                          <CheckCircle className="h-5 w-5 text-primary-400 flex-shrink-0" />
                          <div className="absolute inset-0 bg-primary-400/20 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <span className="font-medium">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

          {/* Advanced Features Highlight */}
          <div className="max-w-6xl mx-auto mb-24">
            <div className="relative p-12 bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-3xl border border-gray-700/50 backdrop-blur-sm overflow-hidden">
              {/* Background Effects */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(14,165,233,0.1),transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(168,85,247,0.1),transparent_50%)]" />
              
              <div className="relative text-center">
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent">
                    More Than Just an Editor
                  </span>
                </h2>
                <p className="text-xl text-gray-400 mb-8 max-w-3xl mx-auto leading-relaxed">
                  LiveEditor is a complete development ecosystem that grows with you, learns from your patterns, 
                  and adapts to your unique coding style.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
                  {[
                    { icon: <Brain className="h-8 w-8" />, title: "AI-First", desc: "Built from the ground up with AI at its core" },
                    { icon: <Zap className="h-8 w-8" />, title: "Performance", desc: "Optimized for speed and responsiveness" },
                    { icon: <Code2 className="h-8 w-8" />, title: "Developer-Centric", desc: "Designed by developers, for developers" }
                  ].map((item, index) => (
                    <div key={index} className="text-center group">
                      <div className="mx-auto w-16 h-16 bg-gray-800/50 rounded-xl border border-gray-700/50 flex items-center justify-center mb-4 group-hover:border-primary-500/30 transition-all duration-300">
                        <div className="text-primary-400">
                          {item.icon}
                        </div>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                      <p className="text-gray-400 text-sm">{item.desc}</p>
                    </div>
                  ))}
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
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Ready to Transform Your
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-primary-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                    Development Experience?
                  </span>
                </h2>
                
                <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-3xl mx-auto">
                  Join thousands of developers who have revolutionized their workflow with LiveEditor&apos;s 
                  AI-powered features and lightning-fast performance.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
                  <Link href="/download">
                    <button className="group relative px-8 py-4 bg-gradient-to-r from-primary-500 to-cyan-500 rounded-xl font-bold text-white shadow-lg hover:shadow-primary-500/25 transition-all duration-300 transform hover:-translate-y-1">
                      <span className="flex items-center gap-3">
                        <Download className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Download LiveEditor
                        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-cyan-400 rounded-xl opacity-0 group-hover:opacity-20 transition-opacity" />
                    </button>
                  </Link>
                  
                  <Link href="/docs">
                    <button className="group px-8 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl font-semibold text-white hover:border-primary-500/50 hover:bg-gray-700/50 transition-all duration-300">
                      <span className="flex items-center gap-3">
                        <Code2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        View Documentation
                      </span>
                    </button>
                  </Link>
                </div>
                
                {/* Trust Indicators */}
                <div className="flex flex-wrap items-center justify-center gap-8 text-gray-500">
                  {[
                    { icon: <CheckCircle className="h-4 w-4" />, text: "100% Free & Open Source" },
                    { icon: <Shield className="h-4 w-4" />, text: "Privacy-First Design" },
                    { icon: <Zap className="h-4 w-4" />, text: "No Setup Required" }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2 group">
                      <div className="text-primary-400 group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <span className="text-sm font-medium group-hover:text-gray-400 transition-colors">
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
