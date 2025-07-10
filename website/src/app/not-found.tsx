'use client'

import { 
  Home, 
  Search, 
  ArrowLeft, 
  Zap, 
  Brain, 
  Code2, 
  Sparkles,
  RefreshCcw,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

export default function NotFound() {
  const quickLinks = [
    {
      title: "Homepage",
      description: "Back to the main experience",
      href: "/",
      icon: <Home className="h-5 w-5" />,
      gradient: "from-blue-600 to-cyan-400"
    },
    {
      title: "Features",
      description: "Explore AI-powered tools",
      href: "/features",
      icon: <Zap className="h-5 w-5" />,
      gradient: "from-purple-600 to-pink-400"
    },
    {
      title: "Community",
      description: "Join 25,000+ developers",
      href: "/community",
      icon: <Brain className="h-5 w-5" />,
      gradient: "from-green-600 to-emerald-400"
    },
    {
      title: "Documentation",
      description: "Learn and start building today",
      href: "/docs",
      icon: <Code2 className="h-5 w-5" />,
      gradient: "from-yellow-600 to-orange-400"
    }
  ]

  const suggestions = [
    "Check the URL for typos",
    "Use the search above to find what you're looking for",
    "Browse our navigation menu",
    "Visit our community for help",
    "Check our documentation"
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/20 to-gray-950" />
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="neural-network opacity-30" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
      <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400 rounded-full animate-ping" />
      <div className="absolute bottom-40 left-20 w-3 h-3 bg-blue-400 rounded-full animate-bounce" />
      <div className="absolute bottom-20 right-10 w-2 h-2 bg-pink-400 rounded-full animate-pulse" />

      <div className="relative min-h-screen flex items-center justify-center px-4 py-20 lg:py-32">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* 404 Animation */}
          <div className="mb-8 lg:mb-12">
            <div className="relative inline-block">
              <div className="text-[8rem] sm:text-[10rem] lg:text-[12rem] xl:text-[16rem] font-black leading-none">
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent animate-pulse">
                  4
                </span>
                  <span className="relative inline-block mx-2 sm:mx-4">
                    <span className="bg-gradient-to-r from-purple-400 via-pink-300 to-cyan-400 bg-clip-text text-transparent">
                      0
                    </span>
                    {/* Rotating Sparkle */}
                    <Sparkles className="absolute top-4 sm:top-6 lg:top-8 -right-1 sm:-right-2 h-6 w-6 sm:h-8 sm:w-8 lg:h-12 lg:w-12 text-cyan-400 animate-spin" />
                  </span>
                <span className="bg-gradient-to-r from-cyan-400 via-blue-300 to-purple-400 bg-clip-text text-transparent animate-pulse">
                  4
                </span>
              </div>
              
              {/* Glowing Underline */}
              <div className="absolute -bottom-2 lg:-bottom-4 left-1/2 transform -translate-x-1/2 w-20 sm:w-24 lg:w-32 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-purple-600 rounded-full animate-pulse" />
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-12 lg:mb-16">
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black mb-4 lg:mb-6">
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                PAGE NOT FOUND
              </span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-300 mb-6 lg:mb-8 max-w-2xl mx-auto leading-relaxed px-4">
              Looks like this page got lost in the <span className="text-cyan-400 font-semibold">neural network</span>. 
              Don&apos;t worry, even AI makes mistakes sometimes.
            </p>
            
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-4 lg:p-6 max-w-md mx-auto">
              <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4 flex items-center justify-center gap-2">
                <Search className="h-5 w-5 text-cyan-400" />
                Quick Search
              </h3>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search for features, docs, community..." 
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 transition-all"
                />
                <button className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-cyan-400 p-2 rounded-lg hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
                  <Search className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="mb-12 lg:mb-16">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-6 lg:mb-8">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Where would you like to go?
              </span>
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {quickLinks.map((link, index) => (
                <Link key={index} href={link.href}>
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r opacity-20 rounded-2xl blur group-hover:blur-md transition-all duration-300" />
                    <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-4 lg:p-6 hover:border-cyan-400/50 transition-all duration-300 group-hover:-translate-y-2">
                      <div className={`inline-flex p-2 lg:p-3 rounded-xl bg-gradient-to-r ${link.gradient} mb-3 lg:mb-4`}>
                        {link.icon}
                      </div>
                      <h3 className="text-base lg:text-lg font-bold text-white mb-1 lg:mb-2">
                        {link.title}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {link.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Helpful Suggestions */}
          <div className="mb-12 lg:mb-16">
            <h3 className="text-lg lg:text-xl font-semibold text-white mb-4 lg:mb-6">
              Here&apos;s what you can try:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 max-w-4xl mx-auto">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0" />
                    <span className="text-gray-300">{suggestion}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 justify-center items-center mb-16 lg:mb-20">
            <Link href="/">
              <button className="group bg-gradient-to-r from-blue-600 to-cyan-400 px-6 lg:px-8 py-3 lg:py-4 rounded-xl text-base lg:text-lg font-semibold hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 hover:-translate-y-1">
                <span className="flex items-center gap-2 lg:gap-3">
                  <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                  Back to Homepage
                </span>
              </button>
            </Link>
            
            <button 
              onClick={() => window.location.reload()} 
              className="group border border-gray-600 hover:border-cyan-400 px-6 lg:px-8 py-3 lg:py-4 rounded-xl text-base lg:text-lg font-semibold hover:bg-cyan-400/10 transition-all duration-300"
            >
              <span className="flex items-center gap-2 lg:gap-3">
                <RefreshCcw className="h-5 w-5 group-hover:rotate-180 transition-transform duration-500" />
                Try Again
              </span>
            </button>
          </div>

          {/* Footer Help */}
          <div className="pt-6 lg:pt-8 border-t border-gray-800">
            <p className="text-gray-400 mb-3 lg:mb-4 text-sm lg:text-base">
              Still need help? Our AI-powered community is here for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 justify-center items-center">
              <Link href="/community">
                <button className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                  <Brain className="h-4 w-4" />
                  Ask the Community
                </button>
              </Link>
              <span className="hidden sm:block text-gray-600">•</span>
              <Link href="/docs">
                <button className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
                  <ExternalLink className="h-4 w-4" />
                  Browse Documentation
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
