import Link from "next/link"
import { Code2, Github, Twitter, MessageCircle, Terminal, Zap, Users } from "lucide-react"

const Footer = () => {
  return (
    <footer className="relative bg-gray-950 border-t border-gray-800/50 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-950/20 via-gray-950 to-purple-950/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,rgba(14,165,233,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(168,85,247,0.05),transparent_50%)]" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="space-y-6 md:col-span-2 lg:col-span-1">
            <Link href="/" className="group flex items-center space-x-3">
              <div className="relative">
                <Code2 className="h-10 w-10 text-primary-400 transition-all duration-300 group-hover:text-cyan-400 group-hover:scale-110" />
                <div className="absolute inset-0 bg-primary-400/20 rounded-lg blur-lg transition-all duration-300 group-hover:bg-cyan-400/30 group-hover:scale-125" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                LiveEditor
              </span>
            </Link>
            <p className="text-gray-400 max-w-sm leading-relaxed">
              The next-generation AI-powered code editor. Revolutionizing how developers create, collaborate, and innovate.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="group relative p-2 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:border-primary-500/50 transition-all duration-300">
                <Github className="h-5 w-5 text-gray-400 group-hover:text-primary-400 transition-colors duration-300" />
                <div className="absolute inset-0 bg-primary-400/0 group-hover:bg-primary-400/10 rounded-lg transition-all duration-300" />
              </Link>
              <Link href="#" className="group relative p-2 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:border-cyan-500/50 transition-all duration-300">
                <Twitter className="h-5 w-5 text-gray-400 group-hover:text-cyan-400 transition-colors duration-300" />
                <div className="absolute inset-0 bg-cyan-400/0 group-hover:bg-cyan-400/10 rounded-lg transition-all duration-300" />
              </Link>
              <Link href="#" className="group relative p-2 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300">
                <MessageCircle className="h-5 w-5 text-gray-400 group-hover:text-purple-400 transition-colors duration-300" />
                <div className="absolute inset-0 bg-purple-400/0 group-hover:bg-purple-400/10 rounded-lg transition-all duration-300" />
              </Link>
            </div>
          </div>

          {/* Product */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Terminal className="h-5 w-5 text-primary-400" />
              <h3 className="font-semibold text-white">Product</h3>
            </div>
            <ul className="space-y-3">
              <li><Link href="/features" className="text-gray-400 hover:text-primary-400 transition-colors duration-300 flex items-center group">
                <span className="w-1 h-1 bg-gray-600 rounded-full mr-3 group-hover:bg-primary-400 transition-colors duration-300"></span>
                Features
              </Link></li>
              <li><Link href="/docs" className="text-gray-400 hover:text-primary-400 transition-colors duration-300 flex items-center group">
                <span className="w-1 h-1 bg-gray-600 rounded-full mr-3 group-hover:bg-primary-400 transition-colors duration-300"></span>
                Documentation
              </Link></li>
              <li><Link href="/download" className="text-gray-400 hover:text-primary-400 transition-colors duration-300 flex items-center group">
                <span className="w-1 h-1 bg-gray-600 rounded-full mr-3 group-hover:bg-primary-400 transition-colors duration-300"></span>
                Download
              </Link></li>
              <li><Link href="/changelog" className="text-gray-400 hover:text-primary-400 transition-colors duration-300 flex items-center group">
                <span className="w-1 h-1 bg-gray-600 rounded-full mr-3 group-hover:bg-primary-400 transition-colors duration-300"></span>
                Changelog
              </Link></li>
            </ul>
          </div>

          {/* Community */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-cyan-400" />
              <h3 className="font-semibold text-white">Community</h3>
            </div>
            <ul className="space-y-3">
              <li><Link href="/community" className="text-gray-400 hover:text-cyan-400 transition-colors duration-300 flex items-center group">
                <span className="w-1 h-1 bg-gray-600 rounded-full mr-3 group-hover:bg-cyan-400 transition-colors duration-300"></span>
                Discussions
              </Link></li>
              <li><Link href="/showcase" className="text-gray-400 hover:text-cyan-400 transition-colors duration-300 flex items-center group">
                <span className="w-1 h-1 bg-gray-600 rounded-full mr-3 group-hover:bg-cyan-400 transition-colors duration-300"></span>
                Showcase
              </Link></li>
              <li><Link href="/contributors" className="text-gray-400 hover:text-cyan-400 transition-colors duration-300 flex items-center group">
                <span className="w-1 h-1 bg-gray-600 rounded-full mr-3 group-hover:bg-cyan-400 transition-colors duration-300"></span>
                Contributors
              </Link></li>
              <li><Link href="/support" className="text-gray-400 hover:text-cyan-400 transition-colors duration-300 flex items-center group">
                <span className="w-1 h-1 bg-gray-600 rounded-full mr-3 group-hover:bg-cyan-400 transition-colors duration-300"></span>
                Support
              </Link></li>
            </ul>
          </div>

          {/* Company */}
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5 text-purple-400" />
              <h3 className="font-semibold text-white">Company</h3>
            </div>
            <ul className="space-y-3">
              <li><Link href="/about" className="text-gray-400 hover:text-purple-400 transition-colors duration-300 flex items-center group">
                <span className="w-1 h-1 bg-gray-600 rounded-full mr-3 group-hover:bg-purple-400 transition-colors duration-300"></span>
                About
              </Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-purple-400 transition-colors duration-300 flex items-center group">
                <span className="w-1 h-1 bg-gray-600 rounded-full mr-3 group-hover:bg-purple-400 transition-colors duration-300"></span>
                Contact
              </Link></li>
              <li><Link href="/privacy" className="text-gray-400 hover:text-purple-400 transition-colors duration-300 flex items-center group">
                <span className="w-1 h-1 bg-gray-600 rounded-full mr-3 group-hover:bg-purple-400 transition-colors duration-300"></span>
                Privacy
              </Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-purple-400 transition-colors duration-300 flex items-center group">
                <span className="w-1 h-1 bg-gray-600 rounded-full mr-3 group-hover:bg-purple-400 transition-colors duration-300"></span>
                Terms
              </Link></li>
            </ul>
          </div>
        </div>

        {/* Divider with glow effect */}
        <div className="mt-16 pt-8 border-t border-gray-800/50 relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-primary-400/50 to-transparent" />
          
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-gray-500 text-sm">
              © 2025 LiveEditor. All rights reserved.
            </p>
            <div className="flex items-center space-x-1 text-gray-500 text-sm">
              <span>Built with</span>
              <span className="text-red-400 animate-pulse">❤️</span>
              <span>for developers worldwide</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
