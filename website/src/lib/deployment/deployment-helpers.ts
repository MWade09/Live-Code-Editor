/**
 * Deployment Helper Utilities
 * Shared functions for file validation, bundling, and deployment operations
 */

interface ProjectFile {
  path: string
  content: string
  name?: string
}

interface FileValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate project files for deployment
 */
export function validateDeploymentFiles(
  files: { [path: string]: string } | ProjectFile[]
): FileValidationResult {
  const result: FileValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  }

  // Convert array format to object format if needed
  const fileMap = Array.isArray(files)
    ? files.reduce((acc, file) => {
        acc[file.path] = file.content
        return acc
      }, {} as { [path: string]: string })
    : files

  // Check if files object is empty
  if (!fileMap || Object.keys(fileMap).length === 0) {
    result.isValid = false
    result.errors.push('No files provided for deployment')
    return result
  }

  // Check for index.html
  const hasIndexHtml = Object.keys(fileMap).some((path) =>
    path.toLowerCase().endsWith('index.html')
  )
  if (!hasIndexHtml) {
    result.warnings.push(
      'No index.html found. A default index.html will be generated.'
    )
  }

  // Check file size limits (100MB total)
  const MAX_TOTAL_SIZE = 100 * 1024 * 1024 // 100MB
  let totalSize = 0

  for (const [path, content] of Object.entries(fileMap)) {
    const size = new Blob([content]).size
    totalSize += size

    // Check individual file size (10MB)
    if (size > 10 * 1024 * 1024) {
      result.warnings.push(`File ${path} is larger than 10MB`)
    }
  }

  if (totalSize > MAX_TOTAL_SIZE) {
    result.isValid = false
    result.errors.push(`Total file size exceeds 100MB limit (${Math.round(totalSize / 1024 / 1024)}MB)`)
  }

  // Validate file paths
  for (const path of Object.keys(fileMap)) {
    if (path.includes('..')) {
      result.isValid = false
      result.errors.push(`Invalid file path: ${path} (contains ..)`)
    }

    if (path.startsWith('/')) {
      result.warnings.push(`File path ${path} should not start with /`)
    }
  }

  return result
}

/**
 * Generate a default index.html if none exists
 */
export function generateDefaultIndexHtml(files: { [path: string]: string }): string {
  const fileList = Object.keys(files)
    .filter((path) => path !== 'index.html')
    .sort()

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Project Files</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 40px 20px;
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        h1 {
            font-size: 32px;
            margin-bottom: 10px;
        }
        
        .subtitle {
            opacity: 0.9;
            font-size: 16px;
        }
        
        .file-list {
            padding: 30px 40px;
        }
        
        .file-item {
            display: block;
            padding: 16px 20px;
            margin-bottom: 12px;
            background: #f8f9fa;
            border-radius: 8px;
            text-decoration: none;
            color: #333;
            transition: all 0.2s ease;
            border: 2px solid transparent;
        }
        
        .file-item:hover {
            background: #667eea;
            color: white;
            border-color: #667eea;
            transform: translateX(5px);
        }
        
        .file-icon {
            display: inline-block;
            width: 20px;
            height: 20px;
            margin-right: 12px;
            vertical-align: middle;
        }
        
        .file-name {
            font-size: 16px;
            font-weight: 500;
        }
        
        .empty-state {
            text-align: center;
            padding: 60px 40px;
            color: #666;
        }
        
        .footer {
            text-align: center;
            padding: 20px;
            color: #999;
            font-size: 14px;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Project Files</h1>
            <p class="subtitle">Your deployed website files</p>
        </div>
        
        <div class="file-list">
${
  fileList.length > 0
    ? fileList
        .map(
          (file) => `            <a href="./${file}" class="file-item">
                <span class="file-icon">📄</span>
                <span class="file-name">${file}</span>
            </a>`
        )
        .join('\n')
    : `            <div class="empty-state">
                <p>No files to display</p>
            </div>`
}
        </div>
        
        <div class="footer">
            Deployed with Live Code Editor
        </div>
    </div>
</body>
</html>`
}

/**
 * Prepare files for deployment (ensure index.html exists)
 */
export function prepareFilesForDeployment(files: {
  [path: string]: string
}): { [path: string]: string } {
  const prepared = { ...files }

  // Check if index.html exists
  const hasIndexHtml = Object.keys(prepared).some((path) =>
    path.toLowerCase().endsWith('index.html')
  )

  if (!hasIndexHtml) {
    prepared['index.html'] = generateDefaultIndexHtml(files)
  }

  return prepared
}

/**
 * Sanitize project name for deployment (remove invalid characters)
 */
export function sanitizeProjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-') // Replace invalid chars with hyphen
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 63) // Max length for domain names
    || 'unnamed-project' // Fallback if name becomes empty
}

/**
 * Format deployment status for display
 */
export function formatDeploymentStatus(
  status: 'pending' | 'building' | 'success' | 'failed'
): {
  label: string
  color: string
  icon: string
} {
  const statusMap = {
    pending: {
      label: 'Pending',
      color: '#FFA500',
      icon: '⏳',
    },
    building: {
      label: 'Building',
      color: '#2196F3',
      icon: '🔨',
    },
    success: {
      label: 'Deployed',
      color: '#4CAF50',
      icon: '✅',
    },
    failed: {
      label: 'Failed',
      color: '#F44336',
      icon: '❌',
    },
  }

  return statusMap[status]
}

/**
 * Parse project content from database format
 */
export function parseProjectContent(
  content: unknown
): { [path: string]: string } {
  // Handle multi-file projects (array format)
  if (Array.isArray(content)) {
    return content.reduce((acc, file) => {
      acc[file.path] = file.content
      return acc
    }, {} as { [path: string]: string })
  }

  // Handle legacy single-file format (object with html/css/js)
  if (typeof content === 'object' && content !== null) {
    const obj = content as Record<string, unknown>
    const files: { [path: string]: string } = {}

    if (typeof obj.html === 'string') {
      files['index.html'] = obj.html
    }

    if (typeof obj.css === 'string') {
      files['styles.css'] = obj.css
    }

    if (typeof obj.js === 'string') {
      files['script.js'] = obj.js
    }

    return files
  }

  // Handle string content (treat as HTML)
  if (typeof content === 'string') {
    return { 'index.html': content }
  }

  return {}
}

/**
 * Estimate deployment time based on file count and size
 */
export function estimateDeploymentTime(files: { [path: string]: string }): number {
  const fileCount = Object.keys(files).length
  const totalSize = Object.values(files).reduce(
    (sum, content) => sum + new Blob([content]).size,
    0
  )

  // Base time: 5 seconds
  // + 0.5 seconds per file
  // + 1 second per MB
  const baseTime = 5
  const fileTime = fileCount * 0.5
  const sizeTime = (totalSize / (1024 * 1024)) * 1

  return Math.ceil(baseTime + fileTime + sizeTime)
}

/**
 * Check if deployment is ready (not rate limited)
 */
export function canDeployNow(lastDeploymentTime: Date | null): {
  canDeploy: boolean
  waitTime: number
} {
  if (!lastDeploymentTime) {
    return { canDeploy: true, waitTime: 0 }
  }

  const COOLDOWN_MINUTES = 5
  const now = new Date()
  const timeSinceLastDeploy = now.getTime() - lastDeploymentTime.getTime()
  const cooldownMs = COOLDOWN_MINUTES * 60 * 1000

  if (timeSinceLastDeploy >= cooldownMs) {
    return { canDeploy: true, waitTime: 0 }
  }

  const waitTime = Math.ceil((cooldownMs - timeSinceLastDeploy) / 1000)
  return { canDeploy: false, waitTime }
}
