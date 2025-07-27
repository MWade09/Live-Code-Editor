'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { 
  Code, 
  Zap, 
  Database,
  Smartphone,
  Globe,
  Play,
  Star,
  Clock,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

interface Template {
  id: string
  title: string
  description: string
  language: string
  framework: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  estimatedTime: number
  tags: string[]
  code: string
  demoUrl?: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  featured: boolean
}

const TEMPLATES: Template[] = [
  {
    id: 'react-todo',
    title: 'React Todo App',
    description: 'A modern todo application with React hooks, local storage, and beautiful UI',
    language: 'JavaScript',
    framework: 'React',
    difficulty: 'beginner',
    estimatedTime: 45,
    tags: ['react', 'hooks', 'localStorage', 'css'],
    code: `import React, { useState, useEffect } from 'react';
import './TodoApp.css';

function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [input, setInput] = useState('');
  
  useEffect(() => {
    const saved = localStorage.getItem('todos');
    if (saved) setTodos(JSON.parse(saved));
  }, []);
  
  useEffect(() => {
    localStorage.setItem('todos', JSON.stringify(todos));
  }, [todos]);
  
  const addTodo = () => {
    if (input.trim()) {
      setTodos([...todos, { id: Date.now(), text: input, completed: false }]);
      setInput('');
    }
  };
  
  const toggleTodo = (id) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };
  
  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };
  
  return (
    <div className="todo-app">
      <h1>My Todos</h1>
      <div className="todo-input">
        <input 
          type="text" 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a new todo..."
        />
        <button onClick={addTodo}>Add</button>
      </div>
      <ul className="todo-list">
        {todos.map(todo => (
          <li key={todo.id} className={todo.completed ? 'completed' : ''}>
            <span onClick={() => toggleTodo(todo.id)}>{todo.text}</span>
            <button onClick={() => deleteTodo(todo.id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TodoApp;`,
    icon: Code,
    color: 'from-blue-500 to-cyan-500',
    featured: true
  },
  {
    id: 'vue-calculator',
    title: 'Vue Calculator',
    description: 'A responsive calculator built with Vue.js and modern CSS',
    language: 'JavaScript',
    framework: 'Vue.js',
    difficulty: 'beginner',
    estimatedTime: 30,
    tags: ['vue', 'css', 'calculator', 'responsive'],
    code: `<template>
  <div class="calculator">
    <div class="display">{{ display }}</div>
    <div class="buttons">
      <button @click="clear" class="clear">C</button>
      <button @click="backspace" class="backspace">⌫</button>
      <button @click="appendOperator('/')" class="operator">÷</button>
      <button @click="appendOperator('*')" class="operator">×</button>
      
      <button @click="appendNumber('7')" class="number">7</button>
      <button @click="appendNumber('8')" class="number">8</button>
      <button @click="appendNumber('9')" class="number">9</button>
      <button @click="appendOperator('-')" class="operator">-</button>
      
      <button @click="appendNumber('4')" class="number">4</button>
      <button @click="appendNumber('5')" class="number">5</button>
      <button @click="appendNumber('6')" class="number">6</button>
      <button @click="appendOperator('+')" class="operator">+</button>
      
      <button @click="appendNumber('1')" class="number">1</button>
      <button @click="appendNumber('2')" class="number">2</button>
      <button @click="appendNumber('3')" class="number">3</button>
      <button @click="calculate" class="equals" rowspan="2">=</button>
      
      <button @click="appendNumber('0')" class="number zero">0</button>
      <button @click="appendNumber('.')" class="number">.</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      display: '0',
      currentInput: '',
      operator: null,
      waitingForNext: false
    }
  },
  methods: {
    appendNumber(number) {
      if (this.waitingForNext) {
        this.display = number;
        this.waitingForNext = false;
      } else {
        this.display = this.display === '0' ? number : this.display + number;
      }
    },
    appendOperator(op) {
      this.currentInput = this.display;
      this.operator = op;
      this.waitingForNext = true;
    },
    calculate() {
      if (this.operator && this.currentInput) {
        const prev = parseFloat(this.currentInput);
        const current = parseFloat(this.display);
        let result;
        
        switch (this.operator) {
          case '+': result = prev + current; break;
          case '-': result = prev - current; break;
          case '*': result = prev * current; break;
          case '/': result = prev / current; break;
        }
        
        this.display = result.toString();
        this.operator = null;
        this.currentInput = '';
        this.waitingForNext = true;
      }
    },
    clear() {
      this.display = '0';
      this.currentInput = '';
      this.operator = null;
      this.waitingForNext = false;
    },
    backspace() {
      this.display = this.display.length > 1 ? this.display.slice(0, -1) : '0';
    }
  }
}
</script>`,
    icon: Zap,
    color: 'from-green-500 to-emerald-500',
    featured: true
  },
  {
    id: 'html-landing',
    title: 'Modern Landing Page',
    description: 'A beautiful, responsive landing page with HTML, CSS, and vanilla JavaScript',
    language: 'HTML',
    framework: 'Vanilla',
    difficulty: 'beginner',
    estimatedTime: 60,
    tags: ['html', 'css', 'responsive', 'landing-page'],
    code: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modern Landing Page</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        
        .hero {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 100px 0;
            text-align: center;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        .hero h1 {
            font-size: 3rem;
            margin-bottom: 20px;
            animation: fadeInUp 1s ease;
        }
        
        .hero p {
            font-size: 1.2rem;
            margin-bottom: 30px;
            animation: fadeInUp 1s ease 0.2s both;
        }
        
        .btn {
            display: inline-block;
            background: #ff6b6b;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 50px;
            transition: transform 0.3s ease;
            animation: fadeInUp 1s ease 0.4s both;
        }
        
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .features {
            padding: 80px 0;
            background: #f8f9fa;
        }
        
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 40px;
            margin-top: 50px;
        }
        
        .feature {
            text-align: center;
            padding: 40px 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
            transition: transform 0.3s ease;
        }
        
        .feature:hover {
            transform: translateY(-5px);
        }
        
        @media (max-width: 768px) {
            .hero h1 {
                font-size: 2rem;
            }
            
            .features-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <section class="hero">
        <div class="container">
            <h1>Welcome to the Future</h1>
            <p>Create amazing experiences with modern web technologies</p>
            <a href="#features" class="btn">Get Started</a>
        </div>
    </section>
    
    <section class="features" id="features">
        <div class="container">
            <h2 style="text-align: center; margin-bottom: 20px;">Our Features</h2>
            <div class="features-grid">
                <div class="feature">
                    <h3>Fast</h3>
                    <p>Lightning fast performance with optimized code</p>
                </div>
                <div class="feature">
                    <h3>Responsive</h3>
                    <p>Works perfectly on all devices and screen sizes</p>
                </div>
                <div class="feature">
                    <h3>Modern</h3>
                    <p>Built with the latest web technologies and best practices</p>
                </div>
            </div>
        </div>
    </section>
    
    <script>
        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                document.querySelector(this.getAttribute('href')).scrollIntoView({
                    behavior: 'smooth'
                });
            });
        });
    </script>
</body>
</html>`,
    icon: Globe,
    color: 'from-purple-500 to-pink-500',
    featured: false
  },
  {
    id: 'python-api',
    title: 'FastAPI REST API',
    description: 'A complete REST API with FastAPI, database integration, and authentication',
    language: 'Python',
    framework: 'FastAPI',
    difficulty: 'intermediate',
    estimatedTime: 90,
    tags: ['python', 'fastapi', 'rest-api', 'database'],
    code: `from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import hashlib
import jwt
from datetime import datetime, timedelta

app = FastAPI(title="Task Manager API", version="1.0.0")
security = HTTPBearer()

# Database setup
def init_db():
    conn = sqlite3.connect('tasks.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            completed BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

# Pydantic models
class Task(BaseModel):
    title: str
    description: Optional[str] = None
    completed: bool = False

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    completed: bool
    created_at: str

# API Routes
@app.get("/")
async def root():
    return {"message": "Task Manager API", "version": "1.0.0"}

@app.get("/tasks", response_model=List[TaskResponse])
async def get_tasks():
    conn = sqlite3.connect('tasks.db')
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM tasks ORDER BY created_at DESC")
    tasks = cursor.fetchall()
    conn.close()
    
    return [
        TaskResponse(
            id=task[0],
            title=task[1],
            description=task[2],
            completed=bool(task[3]),
            created_at=task[4]
        )
        for task in tasks
    ]

@app.post("/tasks", response_model=TaskResponse)
async def create_task(task: Task):
    conn = sqlite3.connect('tasks.db')
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO tasks (title, description, completed) VALUES (?, ?, ?)",
        (task.title, task.description, task.completed)
    )
    task_id = cursor.lastrowid
    conn.commit()
    
    cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    new_task = cursor.fetchone()
    conn.close()
    
    return TaskResponse(
        id=new_task[0],
        title=new_task[1],
        description=new_task[2],
        completed=bool(new_task[3]),
        created_at=new_task[4]
    )

@app.put("/tasks/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, task: Task):
    conn = sqlite3.connect('tasks.db')
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE tasks SET title = ?, description = ?, completed = ? WHERE id = ?",
        (task.title, task.description, task.completed, task_id)
    )
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
    
    conn.commit()
    
    cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
    updated_task = cursor.fetchone()
    conn.close()
    
    return TaskResponse(
        id=updated_task[0],
        title=updated_task[1],
        description=updated_task[2],
        completed=bool(updated_task[3]),
        created_at=updated_task[4]
    )

@app.delete("/tasks/{task_id}")
async def delete_task(task_id: int):
    conn = sqlite3.connect('tasks.db')
    cursor = conn.cursor()
    cursor.execute("DELETE FROM tasks WHERE id = ?", (task_id,))
    
    if cursor.rowcount == 0:
        conn.close()
        raise HTTPException(status_code=404, detail="Task not found")
    
    conn.commit()
    conn.close()
    
    return {"message": "Task deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`,
    icon: Database,
    color: 'from-orange-500 to-red-500',
    featured: true
  },
  {
    id: 'flutter-app',
    title: 'Flutter Mobile App',
    description: 'A cross-platform mobile app with Flutter and Dart',
    language: 'Dart',
    framework: 'Flutter',
    difficulty: 'intermediate',
    estimatedTime: 120,
    tags: ['flutter', 'dart', 'mobile', 'cross-platform'],
    code: `import 'package:flutter/material.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Weather App',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: WeatherScreen(),
    );
  }
}

class WeatherScreen extends StatefulWidget {
  @override
  _WeatherScreenState createState() => _WeatherScreenState();
}

class _WeatherScreenState extends State<WeatherScreen> {
  String city = "New York";
  int temperature = 22;
  String condition = "Sunny";
  List<Map<String, dynamic>> forecast = [
    {"day": "Today", "temp": 22, "condition": "Sunny"},
    {"day": "Tomorrow", "temp": 18, "condition": "Cloudy"},
    {"day": "Wednesday", "temp": 25, "condition": "Sunny"},
    {"day": "Thursday", "temp": 20, "condition": "Rainy"},
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Weather App'),
        backgroundColor: Colors.blue.shade300,
        elevation: 0,
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [Colors.blue.shade300, Colors.blue.shade700],
          ),
        ),
        child: Column(
          children: [
            Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                children: [
                  Text(
                    city,
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  SizedBox(height: 10),
                  Text(
                    '$temperature°C',
                    style: TextStyle(
                      fontSize: 64,
                      fontWeight: FontWeight.w200,
                      color: Colors.white,
                    ),
                  ),
                  Text(
                    condition,
                    style: TextStyle(
                      fontSize: 20,
                      color: Colors.white70,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: Container(
                margin: EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: ListView.builder(
                  itemCount: forecast.length,
                  itemBuilder: (context, index) {
                    final item = forecast[index];
                    return ListTile(
                      title: Text(
                        item['day'],
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                      ),
                      trailing: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            item['condition'],
                            style: TextStyle(color: Colors.white70),
                          ),
                          SizedBox(width: 10),
                          Text(
                            '\${item['temp']}°',
                            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          // Simulate weather refresh
          setState(() {
            temperature = 15 + (temperature % 15) + 10;
          });
        },
        child: Icon(Icons.refresh),
      ),
    );
  }
}`,
    icon: Smartphone,
    color: 'from-teal-500 to-blue-500',
    featured: false
  }
]

export default function TemplatesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced' | 'expert'>('all')
  const [languageFilter, setLanguageFilter] = useState<string>('all')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [supabase])

  const filteredTemplates = TEMPLATES.filter(template => {
    const difficultyMatch = filter === 'all' || template.difficulty === filter
    const languageMatch = languageFilter === 'all' || template.language === languageFilter
    return difficultyMatch && languageMatch
  })

  const featuredTemplates = TEMPLATES.filter(template => template.featured)
  const languages = ['all', ...Array.from(new Set(TEMPLATES.map(t => t.language)))]

  const handleUseTemplate = async (template: Template) => {
    if (!user) {
      router.push('/auth/login?redirect=/templates')
      return
    }

    try {
      const { error } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          title: template.title,
          description: template.description,
          content: template.code,
          language: template.language,
          framework: template.framework,
          tags: template.tags,
          difficulty_level: template.difficulty,
          estimated_time: template.estimatedTime,
          is_public: false,
          status: 'published'
        })

      if (error) throw error

      // Redirect to editor with the new project
      router.push('/editor')
    } catch (error) {
      console.error('Error creating project from template:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading templates...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900 pt-16 sm:pt-18 lg:pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/20">
                <Play className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent">
                  Project Templates
                </h1>
                <p className="text-slate-400 mt-1">
                  Start with pre-built templates and customize them to your needs
                </p>
              </div>
            </div>
            <Link 
              href="/dashboard"
              className="text-slate-400 hover:text-white transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center space-x-2">
            <span className="text-slate-300 text-sm">Difficulty:</span>
            {(['all', 'beginner', 'intermediate', 'advanced', 'expert'] as const).map(level => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  filter === level
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-slate-300 text-sm">Language:</span>
            {languages.map(lang => (
              <button
                key={lang}
                onClick={() => setLanguageFilter(lang)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  languageFilter === lang
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Templates */}
        {filter === 'all' && languageFilter === 'all' && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Star className="w-6 h-6 text-yellow-400 mr-2" />
              Featured Templates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="group bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:bg-slate-800/50 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${template.color}`}>
                      <template.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>{template.estimatedTime}min</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2">{template.title}</h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{template.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                      template.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      template.difficulty === 'advanced' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {template.difficulty}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all text-sm font-medium flex items-center justify-center space-x-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Use Template</span>
                    </button>
                    {template.demoUrl && (
                      <a
                        href={template.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Templates */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-6">
            All Templates {filteredTemplates.length !== TEMPLATES.length && `(${filteredTemplates.length})`}
          </h2>
          
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <Play className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">No templates found</h3>
              <p className="text-slate-400 mb-4">Try adjusting your filters to see more templates</p>
              <button
                onClick={() => {setFilter('all'); setLanguageFilter('all')}}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 text-white rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  className="group bg-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-6 hover:bg-slate-800/50 transition-all duration-200 transform hover:scale-[1.02]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${template.color}`}>
                      <template.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>{template.estimatedTime}min</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-white mb-2">{template.title}</h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">{template.description}</p>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-slate-300">
                      <span className="font-medium">{template.language}</span>
                      {template.framework && <span className="text-slate-400"> • {template.framework}</span>}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.difficulty === 'beginner' ? 'bg-green-500/20 text-green-400' :
                      template.difficulty === 'intermediate' ? 'bg-yellow-500/20 text-yellow-400' :
                      template.difficulty === 'advanced' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {template.difficulty}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {template.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleUseTemplate(template)}
                      className="flex-1 bg-gradient-to-r from-cyan-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-cyan-500 hover:to-purple-500 transition-all text-sm font-medium flex items-center justify-center space-x-2"
                    >
                      <Play className="w-4 h-4" />
                      <span>Use Template</span>
                    </button>
                    {template.demoUrl && (
                      <a
                        href={template.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-slate-700 text-slate-300 rounded-lg hover:bg-slate-600 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
