"use client"

import Link from "next/link"
import { BookOpen, Zap, Code2, Settings, Search, Download, Play, CheckCircle, ArrowRight, Terminal, Brain, Shield, Users, Sparkles, Copy, ExternalLink } from "lucide-react"
import { useState } from "react"

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState("")

  const quickStart = [
    {
      step: 1,
      title: "Download LiveEditor",
      description: "Get the latest version for your operating system with one-click installation.",
      action: "Download Now",
      icon: <Download className="h-6 w-6" />,
      gradient: "from-primary-400 to-cyan-400",
      code: "curl -sSL https://get.liveeditor.dev | bash"
    },
    {
      step: 2,
      title: "Install & Configure",
      description: "Quick setup wizard gets you coding in under 60 seconds.",
      action: "Start Setup",
      icon: <Settings className="h-6 w-6" />,
      gradient: "from-cyan-400 to-purple-400",
      code: "liveeditor --setup"
    },
    {
      step: 3,
      title: "Create First Project",
      description: "Open your first project and experience AI-powered development.",
      action: "Start Coding",
      icon: <Play className="h-6 w-6" />,
      gradient: "from-purple-400 to-primary-400",
      code: "liveeditor new my-project"
    }
  ]

  const docSections = [
    {
      icon: <Zap className="h-10 w-10 text-primary-400" />,
      title: "Getting Started",
      description: "Everything you need to begin your LiveEditor journey",
      topics: [
        { name: "Installation Guide", time: "5 min", difficulty: "Beginner" },
        { name: "First Time Setup", time: "3 min", difficulty: "Beginner" },
        { name: "Creating Projects", time: "10 min", difficulty: "Beginner" },
        { name: "Basic Navigation", time: "8 min", difficulty: "Beginner" }
      ],
      gradient: "from-primary-400 to-cyan-400",
      featured: true
    },
    {
      icon: <Brain className="h-10 w-10 text-cyan-400" />,
      title: "AI Features",
      description: "Master AI-powered coding assistance and intelligent automation",
      topics: [
        { name: "Code Suggestions", time: "15 min", difficulty: "Intermediate" },
        { name: "AI Code Actions", time: "12 min", difficulty: "Intermediate" },
        { name: "Refactoring Tools", time: "20 min", difficulty: "Advanced" },
        { name: "Error Detection", time: "8 min", difficulty: "Beginner" }
      ],
      gradient: "from-cyan-400 to-purple-400",
      featured: true
    },
    {
      icon: <Settings className="h-10 w-10 text-purple-400" />,
      title: "Configuration",
      description: "Customize LiveEditor to match your workflow perfectly",
      topics: [
        { name: "Settings Overview", time: "10 min", difficulty: "Beginner" },
        { name: "Themes & Appearance", time: "7 min", difficulty: "Beginner" },
        { name: "Keyboard Shortcuts", time: "15 min", difficulty: "Intermediate" },
        { name: "Extension Management", time: "12 min", difficulty: "Intermediate" }
      ],
      gradient: "from-purple-400 to-primary-400"
    },
    {
      icon: <Terminal className="h-10 w-10 text-primary-400" />,
      title: "Advanced Usage",
      description: "Deep dive into professional features and customization",
      topics: [
        { name: "Plugin Development", time: "45 min", difficulty: "Advanced" },
        { name: "API Reference", time: "30 min", difficulty: "Advanced" },
        { name: "Troubleshooting", time: "20 min", difficulty: "Intermediate" },
        { name: "Performance Tips", time: "15 min", difficulty: "Intermediate" }
      ],
      gradient: "from-primary-400 to-cyan-400"
    },
    {
      icon: <Shield className="h-10 w-10 text-cyan-400" />,
      title: "Security & Privacy",
      description: "Understanding LiveEditor's privacy-first architecture",
      topics: [
        { name: "Data Privacy", time: "10 min", difficulty: "Beginner" },
        { name: "Local Processing", time: "8 min", difficulty: "Beginner" },
        { name: "Security Features", time: "12 min", difficulty: "Intermediate" },
        { name: "Enterprise Setup", time: "25 min", difficulty: "Advanced" }
      ],
      gradient: "from-cyan-400 to-purple-400"
    },
    {
      icon: <Users className="h-10 w-10 text-purple-400" />,
      title: "Collaboration",
      description: "Team features, sharing, and community integration",
      topics: [
        { name: "Team Workspaces", time: "15 min", difficulty: "Intermediate" },
        { name: "Code Sharing", time: "8 min", difficulty: "Beginner" },
        { name: "Real-time Collaboration", time: "20 min", difficulty: "Intermediate" },
        { name: "Community Features", time: "10 min", difficulty: "Beginner" }
      ],
      gradient: "from-purple-400 to-primary-400"
    }
  ]

  const apiExamples = [
    {
      title: "AI Code Completion",
      description: "Get intelligent code suggestions",
      code: `// Get AI suggestions for your code
const suggestions = await liveEditor.ai.complete({
  context: currentCode,
  language: 'typescript',
  position: cursorPosition
});`
    },
    {
      title: "File Management",
      description: "Programmatically manage files",
      code: `// Create and manage files
const newFile = await liveEditor.files.create({
  path: 'src/components/Button.tsx',
  content: template.react.component
});`
    },
    {
      title: "Plugin Development",
      description: "Extend LiveEditor with custom plugins",
      code: `// Create a custom plugin
export const myPlugin = {
  name: 'my-awesome-plugin',
  activate: (context) => {
    // Your plugin logic here
  }
};`
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
          
          {/* Hero Section */}
          <div className="max-w-6xl mx-auto text-center mb-24">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <BookOpen className="h-20 w-20 text-primary-400 animate-pulse" />
                <div className="absolute inset-0 bg-primary-400/20 rounded-full blur-2xl animate-pulse-gentle" />
              </div>
            </div>
            
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-black mb-8 leading-tight">
              <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                Comprehensive
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                Documentation
              </span>
            </h1>
            
            <p className="text-2xl md:text-3xl text-gray-400 leading-relaxed max-w-5xl mx-auto mb-12">
              Master LiveEditor with our complete guides, tutorials, and API reference. 
              <span className="text-primary-400 font-semibold"> Learn fast. </span>
              <span className="text-cyan-400 font-semibold"> Build better. </span>
              <span className="text-purple-400 font-semibold"> Ship faster.</span>
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:border-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-300"
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <kbd className="px-2 py-1 text-xs text-gray-400 bg-gray-700/50 rounded">⌘K</kbd>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
              {[
                { value: "100+", label: "Guides" },
                { value: "50+", label: "Tutorials" },
                { value: "API", label: "Reference" },
                { value: "24/7", label: "Support" }
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

        {/* Quick Start Guide */}
        <div className="max-w-6xl mx-auto mb-24">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent">
                Quick Start Guide
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Get up and running with LiveEditor in just 3 simple steps. From download to your first AI-powered project.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {quickStart.map((step, index) => (
              <div key={step.step} className="group relative">
                {/* Connection Line */}
                {index < quickStart.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-8 h-px bg-gradient-to-r from-primary-400/50 to-transparent z-10" />
                )}
                
                {/* Card */}
                <div className="relative p-8 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl backdrop-blur-sm border border-gray-700/50 group-hover:border-primary-500/30 transition-all duration-500 h-full">
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-all duration-500`} />
                  
                  <div className="relative">
                    {/* Step Number */}
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-12 h-12 bg-gradient-to-r ${step.gradient} rounded-full flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform`}>
                        {step.step}
                      </div>
                      <div className={`p-3 bg-gray-800/50 rounded-xl border border-gray-700/50 group-hover:border-primary-500/30 transition-all duration-300`}>
                        {step.icon}
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-primary-300 transition-colors">
                      {step.title}
                    </h3>
                    
                    <p className="text-gray-400 leading-relaxed mb-6 group-hover:text-gray-300 transition-colors">
                      {step.description}
                    </p>
                    
                    {/* Code Example */}
                    <div className="bg-gray-900/50 rounded-lg p-4 mb-6 border border-gray-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500 uppercase tracking-wider">Terminal</span>
                        <button className="p-1 hover:bg-gray-700/50 rounded transition-colors">
                          <Copy className="h-4 w-4 text-gray-400" />
                        </button>
                      </div>
                      <code className="text-sm text-primary-400 font-mono">{step.code}</code>
                    </div>
                    
                    <button className={`w-full py-3 px-6 bg-gradient-to-r ${step.gradient} rounded-xl font-semibold text-white hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5`}>
                      {step.action}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documentation Sections */}
        <div className="max-w-7xl mx-auto mb-24">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold mb-6">
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Complete Documentation
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Comprehensive guides covering every aspect of LiveEditor, from basics to advanced customization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {docSections.map((section, index) => (
              <div key={index} className={`group relative ${section.featured ? 'xl:col-span-1 md:col-span-1' : ''}`}>
                {section.featured && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-primary-400 to-cyan-400 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Popular
                  </div>
                )}
                
                <div className="relative p-8 bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl backdrop-blur-sm border border-gray-700/50 group-hover:border-primary-500/30 transition-all duration-500 h-full">
                  <div className={`absolute inset-0 bg-gradient-to-br ${section.gradient} opacity-0 group-hover:opacity-5 rounded-2xl transition-all duration-500`} />
                  
                  <div className="relative">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-4 bg-gray-800/50 rounded-xl border border-gray-700/50 group-hover:border-primary-500/30 transition-all duration-300">
                        {section.icon}
                      </div>
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-4 group-hover:text-primary-300 transition-colors">
                      {section.title}
                    </h3>
                    
                    <p className="text-gray-400 leading-relaxed mb-6 group-hover:text-gray-300 transition-colors">
                      {section.description}
                    </p>
                    
                    <ul className="space-y-3">
                      {section.topics.map((topic, topicIndex) => (
                        <li key={topicIndex} className="group/item">
                          <Link 
                            href={`/docs/${section.title.toLowerCase().replace(/\s+/g, '-')}/${topic.name.toLowerCase().replace(/\s+/g, '-')}`}
                            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-700/30 transition-all duration-300 group"
                          >
                            <div className="flex items-center gap-3">
                              <CheckCircle className="h-4 w-4 text-primary-400 flex-shrink-0" />
                              <span className="text-gray-300 group-hover/item:text-white transition-colors font-medium">
                                {topic.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-gray-500">{topic.time}</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                topic.difficulty === 'Beginner' ? 'bg-green-500/20 text-green-400' :
                                topic.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              }`}>
                                {topic.difficulty}
                              </span>
                              <ArrowRight className="h-4 w-4 text-gray-500 group-hover/item:text-primary-400 group-hover/item:translate-x-1 transition-all" />
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Reference Preview */}
        <div className="max-w-6xl mx-auto mb-24">
          <div className="relative p-12 bg-gradient-to-br from-gray-800/30 to-gray-900/30 rounded-3xl border border-gray-700/50 backdrop-blur-sm overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(14,165,233,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(168,85,247,0.1),transparent_50%)]" />
            
            <div className="relative">
              <div className="text-center mb-12">
                <Code2 className="h-16 w-16 text-primary-400 mx-auto mb-6 animate-pulse" />
                <h2 className="text-4xl md:text-5xl font-bold mb-6">
                  <span className="bg-gradient-to-r from-primary-400 to-cyan-400 bg-clip-text text-transparent">
                    API Reference
                  </span>
                </h2>
                <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                  Comprehensive API documentation with live examples and interactive playground.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {apiExamples.map((example, index) => (
                  <div key={index} className="group">
                    <div className="bg-gray-900/50 rounded-xl border border-gray-700/50 overflow-hidden group-hover:border-primary-500/30 transition-all duration-300">
                      <div className="p-4 border-b border-gray-700/50">
                        <h3 className="text-lg font-semibold text-white mb-2">{example.title}</h3>
                        <p className="text-sm text-gray-400">{example.description}</p>
                      </div>
                      <div className="p-4">
                        <pre className="text-sm text-gray-300 overflow-x-auto">
                          <code>{example.code}</code>
                        </pre>
                      </div>
                      <div className="p-4 border-t border-gray-700/50 flex items-center justify-between">
                        <button className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-2 transition-colors">
                          <Play className="h-4 w-4" />
                          Try it live
                        </button>
                        <button className="text-gray-400 hover:text-gray-300 transition-colors">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-8">
                <Link href="/docs/api">
                  <button className="group px-8 py-4 bg-gradient-to-r from-primary-500 to-cyan-500 rounded-xl font-bold text-white shadow-lg hover:shadow-primary-500/25 transition-all duration-300 transform hover:-translate-y-1">
                    <span className="flex items-center gap-3">
                      View Full API Reference
                      <ExternalLink className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Community Support */}
        <div className="max-w-5xl mx-auto text-center">
          <div className="relative p-12 bg-gradient-to-br from-primary-950/20 via-gray-800/30 to-purple-950/20 rounded-3xl border border-gray-700/50 backdrop-blur-sm overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.1),transparent_70%)]" />
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-64 h-px bg-gradient-to-r from-transparent via-primary-400/50 to-transparent" />
            
            <div className="relative">
              <Sparkles className="h-16 w-16 text-primary-400 mx-auto mb-8 animate-pulse" />
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Need More Help?
                </span>
              </h2>
              
              <p className="text-xl text-gray-400 mb-10 leading-relaxed max-w-3xl mx-auto">
                Can&apos;t find what you&apos;re looking for? Our community and support team are here to help you succeed.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {[
                  { icon: <Users className="h-6 w-6" />, title: "Community Forum", desc: "Get help from other developers", link: "/community" },
                  { icon: <BookOpen className="h-6 w-6" />, title: "Video Tutorials", desc: "Step-by-step video guides", link: "/tutorials" },
                  { icon: <Shield className="h-6 w-6" />, title: "Premium Support", desc: "Priority assistance for teams", link: "/support" }
                ].map((item, index) => (
                  <Link key={index} href={item.link}>
                    <div className="group p-6 bg-gray-800/30 rounded-xl border border-gray-700/50 hover:border-primary-500/30 transition-all duration-300 hover:-translate-y-1">
                      <div className="text-primary-400 mb-3 group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                      <p className="text-gray-400 text-sm">{item.desc}</p>
                    </div>
                  </Link>
                ))}
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/community">
                  <button className="group relative px-8 py-4 bg-gradient-to-r from-primary-500 to-cyan-500 rounded-xl font-bold text-white shadow-lg hover:shadow-primary-500/25 transition-all duration-300 transform hover:-translate-y-1">
                    <span className="flex items-center gap-3">
                      <Users className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Join Community
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </button>
                </Link>
                
                <Link href="/contact">
                  <button className="group px-8 py-4 bg-gray-800/50 border border-gray-700/50 rounded-xl font-semibold text-white hover:border-primary-500/50 hover:bg-gray-700/50 transition-all duration-300">
                    <span className="flex items-center gap-3">
                      <Shield className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      Contact Support
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
