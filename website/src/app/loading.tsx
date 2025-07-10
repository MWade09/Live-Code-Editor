import { Brain, Loader2, Sparkles } from "lucide-react"

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/20 to-gray-950" />
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="neural-network opacity-30" />
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
      <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400 rounded-full animate-ping" />
      <div className="absolute bottom-40 left-20 w-3 h-3 bg-blue-400 rounded-full animate-bounce" />
      <div className="absolute bottom-20 right-10 w-2 h-2 bg-pink-400 rounded-full animate-pulse" />

      <div className="relative text-center">
        {/* Main Loading Animation */}
        <div className="mb-8">
          <div className="relative inline-block">
            {/* Outer Ring */}
            <div className="w-24 h-24 border-4 border-gray-700 rounded-full animate-spin">
              <div className="w-full h-full border-4 border-transparent border-t-cyan-400 rounded-full animate-spin" 
                   style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
            
            {/* Inner Brain Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-400 p-4 rounded-full">
                <Brain className="h-8 w-8 text-white animate-pulse" />
              </div>
            </div>
            
            {/* Orbiting Sparkles */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '3s' }}>
              <Sparkles className="absolute -top-2 left-1/2 transform -translate-x-1/2 h-4 w-4 text-cyan-400" />
            </div>
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}>
              <Sparkles className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 h-4 w-4 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Loading Text */}
        <div className="mb-6">
          <h2 className="text-2xl lg:text-3xl font-bold mb-2">
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              INITIALIZING AI
            </span>
          </h2>
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-lg">Loading neural networks...</span>
          </div>
        </div>

        {/* Loading Steps */}
        <div className="space-y-3 max-w-md mx-auto">
          <div className="flex items-center justify-between bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-3">
            <span className="text-gray-300">Connecting to AI systems</span>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-3">
            <span className="text-gray-300">Loading workspace</span>
            <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full animate-pulse" style={{ width: '75%' }} />
            </div>
          </div>
          
          <div className="flex items-center justify-between bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-3">
            <span className="text-gray-300">Preparing interface</span>
            <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>

        {/* Loading Progress */}
        <div className="mt-8">
          <div className="w-64 h-1 bg-gray-700 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-400 rounded-full animate-pulse transform origin-left animate-pulse" />
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Powered by AI • Optimizing for your experience
          </p>
        </div>
      </div>
    </div>
  )
}
