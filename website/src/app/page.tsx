"use client"

import { ArrowRight, Code2, Zap, Brain, Download, Sparkles, Terminal, Cpu, Layers } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-primary via-dark-secondary to-dark-tertiary text-white overflow-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(67, 97, 238, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(67, 97, 238, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite'
        }}></div>
      </div>

      {/* Floating Code Elements - Responsive positioning */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-16 sm:top-20 left-4 sm:left-10 text-primary-400 font-mono text-xs sm:text-sm opacity-30 animate-float hidden sm:block">
          {'const ai = new Intelligence()'}
        </div>
        <div className="absolute top-32 sm:top-40 right-4 sm:right-20 text-secondary-400 font-mono text-xs sm:text-sm opacity-30 animate-float-delayed hidden md:block">
          {'function enhance(code) {'}
        </div>
        <div className="absolute bottom-32 sm:bottom-40 left-4 sm:left-20 text-accent-400 font-mono text-xs sm:text-sm opacity-30 animate-float hidden sm:block">
          {'return suggestions.map(optimize)'}
        </div>
        <div className="absolute bottom-16 sm:bottom-20 right-8 sm:right-40 text-primary-400 font-mono text-xs sm:text-sm opacity-30 animate-float-delayed hidden md:block">
          {'}'}
        </div>
      </div>

      {/* Hero Section - Completely Custom */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 lg:py-24">
        {/* Neural Network Background Effect - Responsive */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96">
            {/* Neural connections - Using responsive CSS calculations */}
            {[...Array(8)].map((_, i) => {
              const angle = (i * Math.PI) / 4;
              const radius = 100; // Will be scaled by CSS
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              
              return (
                <div
                  key={i}
                  className="absolute w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary-500 rounded-full animate-pulse"
                  style={{
                    top: `calc(50% + ${y}px)`,
                    left: `calc(50% + ${x}px)`,
                    transform: 'translate(-50%, -50%)',
                    animationDelay: `${i * 0.2}s`
                  }}
                >
                  <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping"></div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center px-4 sm:px-6">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500/20 to-accent-500/20 backdrop-blur-sm border border-primary-500/30 px-4 sm:px-6 py-2 sm:py-3 rounded-full mb-6 sm:mb-8 animate-glow">
            <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
            <span className="text-primary-200 font-medium text-sm sm:text-base">AI Systems Online</span>
            <Cpu className="w-4 h-4 text-primary-400" />
          </div>

          {/* Main Headline - Responsive sizing */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-black mb-6 sm:mb-8 leading-none">
            <span className="block text-white">CODE</span>
            <span className="block bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400 bg-clip-text text-transparent animate-gradient">
              BEYOND
            </span>
            <span className="block text-white">HUMAN</span>
          </h1>

          {/* Subheadline - Better responsive text */}
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 mb-8 sm:mb-10 lg:mb-12 max-w-4xl mx-auto leading-relaxed px-4">
            LiveEditor isn&apos;t just another code editor. It&apos;s your AI coding partner that thinks, 
            learns, and evolves with every keystroke. Experience the future of development.
          </p>

          {/* CTA Buttons - Responsive sizing and spacing */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 sm:mb-14 lg:mb-16">
            <Link href="/auth/signup">
              <button className="group relative bg-gradient-to-r from-primary-500 to-secondary-500 px-8 sm:px-10 lg:px-12 py-4 sm:py-5 lg:py-6 rounded-2xl font-bold text-base sm:text-lg shadow-brutal hover:shadow-glow-primary transition-all duration-300 transform hover:-translate-y-2 w-full sm:w-auto">
                <span className="flex items-center justify-center gap-3">
                  <Download className="w-5 h-5 sm:w-6 sm:h-6" />
                  Experience LiveEditor
                  <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-2 transition-transform" />
                </span>
              </button>
            </Link>
            
            <Link href="/docs">
              <button className="group relative border-2 border-primary-500 bg-primary-500/10 backdrop-blur-sm px-8 sm:px-10 lg:px-12 py-4 sm:py-5 lg:py-6 rounded-2xl font-bold text-base sm:text-lg hover:bg-primary-500/20 transition-all duration-300 w-full sm:w-auto">
                <span className="flex items-center justify-center gap-3 text-primary-300">
                  <Terminal className="w-5 h-5 sm:w-6 sm:h-6" />
                  Watch AI in Action
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-12 transition-transform" />
                </span>
              </button>
            </Link>
          </div>

          {/* Metrics - Better responsive grid and spacing */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 max-w-5xl mx-auto px-4">
            {[
              { label: "AI Suggestions/Min", value: "100+", icon: Brain },
              { label: "Code Lines Analyzed", value: "50M+", icon: Code2 },
              { label: "Developer Hours Saved", value: "10K+", icon: Zap },
              { label: "Active AI Models", value: "12", icon: Layers }
            ].map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <div className="p-3 sm:p-4 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-2xl border border-primary-500/30 group-hover:shadow-glow-primary transition-all duration-300">
                    <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-primary-400" />
                  </div>
                </div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white mb-1 sm:mb-2">{stat.value}</div>
                <div className="text-primary-300 text-xs sm:text-sm font-medium leading-tight">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}