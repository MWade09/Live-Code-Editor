"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X, Code2, Zap, Download } from "lucide-react"

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50
      setScrolled(isScrolled)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigation = [
    { name: "Features", href: "/features" },
    { name: "Documentation", href: "/docs" },
    { name: "Community", href: "/community" },
    { name: "About", href: "/about" },
  ]

  return (
    <header className={`fixed top-0 z-50 w-full transition-all duration-300 ${
      scrolled 
        ? 'bg-gray-950/95 backdrop-blur-xl border-b border-primary-500/20 shadow-lg shadow-primary-500/10' 
        : 'bg-gray-950/50 backdrop-blur-sm border-b border-primary-500/10'
    }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 sm:h-18 lg:h-20 items-center justify-between">
          {/* Logo - Futuristic */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Code2 className="h-7 w-7 sm:h-8 sm:w-8 text-primary-400 group-hover:text-primary-300 transition-colors" />
              <div className="absolute inset-0 bg-primary-400 blur-lg opacity-20 group-hover:opacity-30 transition-opacity"></div>
            </div>
            <span className="text-xl sm:text-2xl font-black text-white group-hover:text-primary-200 transition-colors">
              Live<span className="text-primary-400">Editor</span>
            </span>
          </Link>

          {/* Desktop Navigation - Futuristic */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="relative px-4 py-2 text-gray-300 hover:text-white font-medium transition-all duration-300 group"
              >
                <span className="relative z-10">{item.name}</span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-500/0 via-primary-500/10 to-primary-500/0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-gradient-to-r from-primary-400 to-secondary-400 group-hover:w-full group-hover:left-0 transition-all duration-300"></div>
              </Link>
            ))}
          </nav>

          {/* Desktop CTA - Enhanced */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link 
              href="/login"
              className="text-gray-300 hover:text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:bg-primary-500/10"
            >
              Sign In
            </Link>
            <Link href="/register">
              <button className="group relative bg-gradient-to-r from-primary-500 to-secondary-500 px-6 py-2.5 rounded-xl font-bold text-white shadow-lg hover:shadow-primary-500/25 transition-all duration-300 transform hover:-translate-y-0.5">
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Get Started
                  <Zap className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                </span>
              </button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4 bg-gray-950/95 backdrop-blur-xl border-t border-gray-800/50">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="block text-gray-300 hover:text-primary-400 py-2 px-4 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 space-y-2">
              <Link 
                href="/login"
                className="block w-full text-center px-3 py-2 text-gray-400 hover:text-white bg-gray-800/50 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link 
                href="/register"
                className="block w-full text-center px-3 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
