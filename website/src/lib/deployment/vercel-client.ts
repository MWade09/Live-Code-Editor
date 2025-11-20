/**
 * Vercel API Client
 * Handles deployment to Vercel platform
 */

import axios, { AxiosError } from 'axios'

export interface VercelDeployOptions {
  name: string
  files: { [path: string]: string }
  envVars?: { [key: string]: string }
  projectId?: string
}

export interface VercelDeployResponse {
  id: string
  url: string
  readyState: 'QUEUED' | 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED'
  project_id?: string
}

export interface VercelProject {
  id: string
  name: string
  url: string
}

export class VercelClient {
  private accessToken: string
  private apiUrl = 'https://api.vercel.com'

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error('Vercel access token is required')
    }
    this.accessToken = accessToken
  }

  /**
   * Deploy project to Vercel
   */
  async deployProject(options: VercelDeployOptions): Promise<VercelDeployResponse> {
    const { name, files, projectId } = options

    if (!name) {
      throw new Error('Project name is required')
    }

    if (!files || Object.keys(files).length === 0) {
      throw new Error('At least one file is required for deployment')
    }

    try {
      // Ensure index.html exists
      if (!files['index.html']) {
        throw new Error('index.html is required for deployment')
      }

      // Convert files to Vercel format (base64 encoded)
      const vercelFiles = Object.entries(files).map(([path, content]) => ({
        file: path,
        data: Buffer.from(content).toString('base64'),
      }))

      interface VercelDeploymentRequest {
        name: string
        files: Array<{ file: string; data: string }>
        projectSettings: {
          framework: null
          buildCommand: null
          outputDirectory: null
        }
        target: string
        project?: string
      }

      const requestBody: VercelDeploymentRequest = {
        name,
        files: vercelFiles,
        projectSettings: {
          framework: null,
          buildCommand: null,
          outputDirectory: null,
        },
        target: 'production',
      }

      // Add project ID if updating existing project
      if (projectId) {
        requestBody.project = projectId
      }

      const response = await axios.post(
        `${this.apiUrl}/v13/deployments`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return {
        id: response.data.id,
        url: `https://${response.data.url}`,
        readyState: response.data.readyState,
        project_id: response.data.projectId,
      }
    } catch (error) {
      this.handleError(error, 'Failed to deploy to Vercel')
      throw error
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(deploymentId: string): Promise<VercelDeployResponse> {
    if (!deploymentId) {
      throw new Error('Deployment ID is required')
    }

    try {
      const response = await axios.get(
        `${this.apiUrl}/v13/deployments/${deploymentId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      )

      return {
        id: response.data.id,
        url: `https://${response.data.url}`,
        readyState: response.data.readyState,
        project_id: response.data.projectId,
      }
    } catch (error) {
      this.handleError(error, 'Failed to get deployment status')
      throw error
    }
  }

  /**
   * Get project by name
   */
  async getProject(projectName: string): Promise<VercelProject | null> {
    if (!projectName) {
      throw new Error('Project name is required')
    }

    try {
      const response = await axios.get(
        `${this.apiUrl}/v9/projects/${projectName}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      )

      return {
        id: response.data.id,
        name: response.data.name,
        url: response.data.link?.url || `https://${projectName}.vercel.app`,
      }
    } catch (error: unknown) {
      const axiosError = error as AxiosError
      if (axios.isAxiosError(axiosError) && axiosError.response?.status === 404) {
        return null // Project doesn't exist
      }
      this.handleError(error, 'Failed to get project')
      throw error
    }
  }

  /**
   * Create a new project
   */
  async createProject(name: string): Promise<VercelProject> {
    if (!name) {
      throw new Error('Project name is required')
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/v9/projects`,
        {
          name,
          framework: null,
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return {
        id: response.data.id,
        name: response.data.name,
        url: response.data.link?.url || `https://${name}.vercel.app`,
      }
    } catch (error) {
      this.handleError(error, 'Failed to create project')
      throw error
    }
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    if (!projectId) {
      throw new Error('Project ID is required')
    }

    try {
      await axios.delete(`${this.apiUrl}/v9/projects/${projectId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })
    } catch (error) {
      this.handleError(error, 'Failed to delete project')
      throw error
    }
  }

  /**
   * Get deployment logs
   */
  async getDeploymentLogs(deploymentId: string): Promise<string[]> {
    if (!deploymentId) {
      throw new Error('Deployment ID is required')
    }

    try {
      const response = await axios.get(
        `${this.apiUrl}/v2/deployments/${deploymentId}/events`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      )

      // Extract log messages from events
      interface VercelEvent {
        text?: string
        payload?: { text?: string }
      }
      return response.data.map((event: VercelEvent) => event.text || event.payload?.text || '').filter(Boolean)
    } catch (error) {
      this.handleError(error, 'Failed to get deployment logs')
      throw error
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown, message: string): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ error?: { message?: string } }>
      const errorMessage =
        axiosError.response?.data?.error?.message || axiosError.message
      console.error(`${message}:`, errorMessage)

      if (axiosError.response?.status === 401) {
        throw new Error('Invalid or expired Vercel access token')
      } else if (axiosError.response?.status === 403) {
        throw new Error('Insufficient permissions for this Vercel operation')
      } else if (axiosError.response?.status === 404) {
        throw new Error('Vercel resource not found')
      } else if (axiosError.response?.status === 429) {
        throw new Error('Vercel API rate limit exceeded')
      }

      throw new Error(`${message}: ${errorMessage}`)
    }

    console.error(`${message}:`, error)
    throw new Error(message)
  }
}
