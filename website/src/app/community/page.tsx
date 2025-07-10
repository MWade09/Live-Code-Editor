import { 
  Users, 
  MessageCircle, 
  Star, 
  Code2, 
  Share2, 
  Trophy, 
  Github, 
  ExternalLink,
  Heart,
  Eye,

  MessageSquare,
  Zap,
  Crown,
  Rocket,
  Brain,
  Shield,
  Globe
} from "lucide-react"

export default function CommunityPage() {
  const stats = [
    { 
      label: "Active Developers", 
      value: "25,000+", 
      icon: <Users className="h-8 w-8" />,
      trend: "+2.3k this month",
      gradient: "from-blue-600 to-cyan-400"
    },
    { 
      label: "Code Snippets", 
      value: "180,000+", 
      icon: <Code2 className="h-8 w-8" />,
      trend: "+15k this week",
      gradient: "from-purple-600 to-pink-400"
    },
    { 
      label: "Community Posts", 
      value: "45,000+", 
      icon: <MessageCircle className="h-8 w-8" />,
      trend: "+890 today",
      gradient: "from-green-600 to-emerald-400"
    },
    { 
      label: "GitHub Stars", 
      value: "87,000+", 
      icon: <Star className="h-8 w-8" />,
      trend: "+1.2k this week",
      gradient: "from-yellow-600 to-orange-400"
    }
  ]

  const features = [
    {
      icon: <MessageCircle className="h-12 w-12" />,
      title: "AI-Powered Discussions",
      description: "Join intelligent conversations with AI-assisted code reviews, instant Q&A, and collaborative problem-solving.",
      action: "Start Discussing",
      gradient: "from-blue-600/20 to-cyan-400/20",
      highlight: "Most Active"
    },
    {
      icon: <Share2 className="h-12 w-12" />,
      title: "Neural Code Sharing",
      description: "Share AI-enhanced code snippets with automatic optimization suggestions and intelligent categorization.",
      action: "Share Code",
      gradient: "from-purple-600/20 to-pink-400/20",
      highlight: "Trending"
    },
    {
      icon: <Trophy className="h-12 w-12" />,
      title: "Project Showcase",
      description: "Display your AI-powered creations, get community feedback, and climb the innovation leaderboard.",
      action: "Show Your Work",
      gradient: "from-yellow-600/20 to-orange-400/20",
      highlight: "Popular"
    },
    {
      icon: <Brain className="h-12 w-12" />,
      title: "AI Collaboration Hub",
      description: "Connect with developers through AI-matched interests, skills, and project compatibility.",
      action: "Find Collaborators",
      gradient: "from-green-600/20 to-emerald-400/20",
      highlight: "New"
    }
  ]

  const communityChannels = [
    {
      platform: "Discord",
      members: "12,000+",
      description: "Real-time chat, voice channels, and instant help",
      icon: <MessageSquare className="h-6 w-6" />,
      color: "bg-indigo-600"
    },
    {
      platform: "GitHub",
      stars: "87,000+",
      description: "Open source contributions and issue tracking",
      icon: <Github className="h-6 w-6" />,
      color: "bg-gray-800"
    },
    {
      platform: "Forums",
      posts: "45,000+",
      description: "In-depth discussions and knowledge sharing",
      icon: <Globe className="h-6 w-6" />,
      color: "bg-blue-600"
    }
  ]

  const topContributors = [
    {
      name: "Alex Chen",
      avatar: "AC",
      contributions: 1250,
      specialty: "AI Integration",
      badge: "Neural Architect",
      color: "bg-gradient-to-r from-blue-600 to-cyan-400"
    },
    {
      name: "Sarah Kim",
      avatar: "SK",
      contributions: 980,
      specialty: "Frontend Magic",
      badge: "UI Wizard",
      color: "bg-gradient-to-r from-purple-600 to-pink-400"
    },
    {
      name: "Marcus Tech",
      avatar: "MT",
      contributions: 875,
      specialty: "Backend Systems",
      badge: "Code Architect",
      color: "bg-gradient-to-r from-green-600 to-emerald-400"
    },
    {
      name: "Luna Dev",
      avatar: "LD",
      contributions: 720,
      specialty: "DevOps & AI",
      badge: "Cloud Master",
      color: "bg-gradient-to-r from-yellow-600 to-orange-400"
    }
  ]

  const recentActivity = [
    {
      user: "CodeNinja47",
      avatar: "CN",
      action: "shared an AI-powered component",
      content: "Auto-generating responsive layouts with GPT-4 integration - 95% faster prototyping!",
      time: "2 minutes ago",
      engagement: { likes: 34, comments: 12, views: 287 },
      color: "bg-gradient-to-r from-blue-600 to-cyan-400",
      tags: ["React", "AI", "Components"]
    },
    {
      user: "AIWhisperer",
      avatar: "AW",
      action: "started a discussion",
      content: "Best practices for prompt engineering in code generation - let's share our techniques!",
      time: "18 minutes ago",
      engagement: { likes: 89, comments: 45, views: 512 },
      color: "bg-gradient-to-r from-purple-600 to-pink-400",
      tags: ["AI", "Prompts", "Best Practices"]
    },
    {
      user: "ReactMaster",
      avatar: "RM",
      action: "showcased a project",
      content: "Built a real-time collaborative editor with AI code completion - live demo inside!",
      time: "1 hour ago",
      engagement: { likes: 156, comments: 67, views: 1200 },
      color: "bg-gradient-to-r from-green-600 to-emerald-400",
      tags: ["React", "Real-time", "Demo"]
    }
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-white overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/20 via-purple-950/20 to-gray-950" />
      <div className="absolute inset-0 bg-grid-pattern opacity-10" />
      <div className="neural-network" />
      
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto text-center">
            <div className="flex items-center justify-center mb-8">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-400 p-4 rounded-2xl">
                <Users className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-black mb-8">
              <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-purple-400 bg-clip-text text-transparent">
                JOIN THE FUTURE
              </span>
              <br />
              <span className="text-white">OF CODING</span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Connect with <span className="text-cyan-400 font-semibold">25,000+ developers</span> building the next generation of applications with AI-powered tools. Share knowledge, collaborate on projects, and shape the future of development.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button className="group bg-gradient-to-r from-blue-600 to-cyan-400 px-8 py-4 rounded-xl text-lg font-semibold hover:shadow-xl hover:shadow-cyan-500/25 transition-all duration-300 hover:-translate-y-1">
                <span className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                  Join Community Free
                </span>
              </button>
              <button className="group border border-gray-600 hover:border-cyan-400 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-cyan-400/10 transition-all duration-300">
                <span className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Explore Projects
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Live Stats */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Community Pulse
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r opacity-20 rounded-2xl blur group-hover:blur-md transition-all duration-300" 
                       style={{ background: `linear-gradient(135deg, var(--tw-gradient-stops))` }} />
                  <div className="relative bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-cyan-400/50 transition-all duration-300 group-hover:-translate-y-2">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${stat.gradient} mb-6`}>
                      {stat.icon}
                    </div>
                    <div className="text-4xl font-black text-white mb-2">
                      {stat.value}
                    </div>
                    <div className="text-gray-400 font-medium mb-2">
                      {stat.label}
                    </div>
                    <div className="text-sm text-cyan-400 font-semibold">
                      {stat.trend}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Community Features */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl lg:text-5xl font-black mb-6">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  SUPERCHARGE
                </span>
                <br />
                <span className="text-white">YOUR DEVELOPMENT</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Experience the next evolution of collaborative coding with AI-enhanced features
              </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r opacity-20 rounded-3xl blur group-hover:blur-lg transition-all duration-500" />
                  <div className={`relative bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-3xl p-8 hover:border-cyan-400/50 transition-all duration-500 group-hover:-translate-y-3 bg-gradient-to-br ${feature.gradient}`}>
                    {feature.highlight && (
                      <div className="absolute -top-3 -right-3">
                        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                          {feature.highlight}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-center mb-6">
                      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 p-4 rounded-2xl mr-4">
                        {feature.icon}
                      </div>
                      <h3 className="text-2xl font-bold text-white">
                        {feature.title}
                      </h3>
                    </div>
                    
                    <p className="text-gray-300 mb-8 text-lg leading-relaxed">
                      {feature.description}
                    </p>
                    
                    <button className="group/btn bg-gradient-to-r from-blue-600 to-cyan-400 px-6 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 hover:-translate-y-1">
                      <span className="flex items-center gap-2">
                        {feature.action}
                        <ExternalLink className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Community Channels */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16">
              <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
                Connect Everywhere
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {communityChannels.map((channel, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-cyan-400/20 rounded-2xl blur group-hover:blur-md transition-all duration-300" />
                  <div className="relative bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-cyan-400/50 transition-all duration-300 group-hover:-translate-y-2">
                    <div className={`inline-flex p-4 rounded-xl ${channel.color} mb-6`}>
                      {channel.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {channel.platform}
                    </h3>
                    <div className="text-cyan-400 font-semibold mb-4">
                      {channel.members || channel.stars || channel.posts}
                    </div>
                    <p className="text-gray-300 mb-6">
                      {channel.description}
                    </p>
                    <button className="w-full bg-gradient-to-r from-gray-800 to-gray-700 hover:from-blue-600 hover:to-cyan-400 px-6 py-3 rounded-xl font-semibold transition-all duration-300">
                      Join Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Top Contributors */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Community Champions
              </span>
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {topContributors.map((contributor, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r opacity-20 rounded-2xl blur group-hover:blur-md transition-all duration-300" />
                  <div className="relative bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-yellow-400/50 transition-all duration-300 group-hover:-translate-y-2 text-center">
                    {index === 0 && (
                      <div className="absolute -top-3 -right-3">
                        <Crown className="h-6 w-6 text-yellow-400" />
                      </div>
                    )}
                    
                    <div className={`w-16 h-16 ${contributor.color} rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4`}>
                      {contributor.avatar}
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mb-2">
                      {contributor.name}
                    </h3>
                    
                    <div className="text-sm text-cyan-400 font-semibold mb-2">
                      {contributor.badge}
                    </div>
                    
                    <div className="text-gray-400 text-sm mb-3">
                      {contributor.specialty}
                    </div>
                    
                    <div className="text-xl font-bold text-white">
                      {contributor.contributions.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      contributions
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Live Activity Feed */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-center mb-16">
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Live Community Pulse
              </span>
            </h2>
            
            <div className="space-y-6">
              {recentActivity.map((activity, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 bg-gradient-to-r opacity-10 rounded-2xl blur group-hover:blur-md transition-all duration-300" />
                  <div className="relative bg-gray-900/90 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 hover:border-cyan-400/50 transition-all duration-300">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 ${activity.color} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
                        {activity.avatar}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2 flex-wrap">
                          <span className="font-bold text-white">{activity.user}</span>
                          <span className="text-gray-400">{activity.action}</span>
                          <span className="text-sm text-gray-500">{activity.time}</span>
                        </div>
                        
                        <p className="text-gray-300 mb-4 leading-relaxed">
                          {activity.content}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-6 text-sm text-gray-400">
                            <span className="flex items-center gap-1 hover:text-red-400 transition-colors cursor-pointer">
                              <Heart className="h-4 w-4" />
                              {activity.engagement.likes}
                            </span>
                            <span className="flex items-center gap-1 hover:text-blue-400 transition-colors cursor-pointer">
                              <MessageCircle className="h-4 w-4" />
                              {activity.engagement.comments}
                            </span>
                            <span className="flex items-center gap-1 hover:text-green-400 transition-colors cursor-pointer">
                              <Eye className="h-4 w-4" />
                              {activity.engagement.views}
                            </span>
                          </div>
                          
                          <div className="flex space-x-2">
                            {activity.tags.map((tag, tagIndex) => (
                              <span key={tagIndex} className="bg-gray-800 text-cyan-400 px-2 py-1 rounded-md text-xs font-medium">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 hover:-translate-y-1">
                <span className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  View All Activity
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-cyan-600/20 rounded-3xl p-12 backdrop-blur-sm border border-gray-800">
              <h2 className="text-4xl lg:text-5xl font-black mb-6">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  READY TO SHAPE
                </span>
                <br />
                <span className="text-white">THE FUTURE?</span>
              </h2>
              
              <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
                Join thousands of developers who are already building tomorrow&apos;s applications with AI-powered tools and collaborative intelligence.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <button className="group bg-gradient-to-r from-blue-600 to-cyan-400 px-10 py-5 rounded-xl text-xl font-bold hover:shadow-2xl hover:shadow-cyan-500/25 transition-all duration-300 hover:-translate-y-2">
                  <span className="flex items-center gap-3">
                    <Brain className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                    Join Community Free
                  </span>
                </button>
                <button className="group border-2 border-gray-600 hover:border-cyan-400 px-10 py-5 rounded-xl text-xl font-bold hover:bg-cyan-400/10 transition-all duration-300">
                  <span className="flex items-center gap-3">
                    <Github className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    Star on GitHub
                  </span>
                </button>
              </div>
              
              <div className="flex items-center justify-center mt-8 text-gray-400">
                <Shield className="h-5 w-5 mr-2" />
                <span>Free forever • No credit card required • Join 25,000+ developers</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
