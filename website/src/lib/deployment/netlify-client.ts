/**
 * Netlify API Client
 * Handles deployment to Netlify platform
 */

import axios, { AxiosError } from 'axios'

export interface NetlifyDeployOptions {
  siteId?: string
  files: { [path: string]: string } // file path -> content
  envVars?: { [key: string]: string }
}

export interface NetlifyDeployResponse {
  id: string
  site_id: string
  deploy_url: string
  admin_url: string
  state: 'uploading' | 'processing' | 'ready' | 'error'
}

export interface NetlifySite {
  site_id: string
  name: string
  url: string
  admin_url: string
}

export class NetlifyClient {
  private accessToken: string
  private apiUrl = 'https://api.netlify.com/api/v1'

  constructor(accessToken: string) {
    if (!accessToken) {
      throw new Error('Netlify access token is required')
    }
    this.accessToken = accessToken
  }

  /**
   * Create a new Netlify site
   */
  async createSite(siteName: string): Promise<NetlifySite> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/sites`,
        {
          name: siteName,
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return {
        site_id: response.data.id,
        name: response.data.name,
        url: response.data.ssl_url || response.data.url,
        admin_url: response.data.admin_url,
      }
    } catch (error) {
      this.handleError(error, 'Failed to create Netlify site')
      throw error
    }
  }

  /**
   * Check if a site name is available
   */
  async checkSiteNameAvailability(siteName: string): Promise<{ available: boolean; suggestion?: string }> {
    try {
      // Try to create a site with this name (without actually creating it by checking if it exists)
      const response = await axios.get(
        `${this.apiUrl}/sites`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      )

      // Check if any site has this name
      const sites = response.data || []
      const nameExists = sites.some((site: { name: string }) => site.name === siteName)

      if (nameExists) {
        // Generate a suggestion with random suffix
        const suffix = Math.random().toString(36).substring(2, 8)
        return {
          available: false,
          suggestion: `${siteName}-${suffix}`,
        }
      }

      return { available: true }
    } catch (error) {
      console.error('Error checking site name availability:', error)
      // If we can't check, assume it might be taken and suggest alternative
      const suffix = Math.random().toString(36).substring(2, 8)
      return {
        available: false,
        suggestion: `${siteName}-${suffix}`,
      }
    }
  }

  /**
   * Deploy files to Netlify
   */
  async deployFiles(options: NetlifyDeployOptions): Promise<NetlifyDeployResponse> {
    const { siteId, files } = options

    if (!siteId) {
      throw new Error('Site ID is required for deployment')
    }

    if (!files || Object.keys(files).length === 0) {
      throw new Error('At least one file is required for deployment')
    }

    try {
      // Ensure index.html exists
      if (!files['index.html']) {
        throw new Error('index.html is required for deployment')
      }

      // Step 1: Create a new deploy
      const createDeployResponse = await axios.post(
        `${this.apiUrl}/sites/${siteId}/deploys`,
        {},
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const deployId = createDeployResponse.data.id

      // Step 2: Upload files
      const fileUploads = Object.entries(files).map(async ([path, content]) => {
        // Netlify expects files to be uploaded to a specific path
        const uploadPath = `/${path.startsWith('/') ? path.slice(1) : path}`
        
        try {
          await axios.put(
            `${this.apiUrl}/deploys/${deployId}/files${uploadPath}`,
            content,
            {
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
                'Content-Type': 'application/octet-stream',
              },
            }
          )
        } catch (uploadError) {
          console.error(`Failed to upload file ${path}:`, uploadError)
          throw uploadError
        }
      })

      // Wait for all files to upload
      await Promise.all(fileUploads)

      // Step 3: Get the deploy status
      const deployStatusResponse = await axios.get(
        `${this.apiUrl}/sites/${siteId}/deploys/${deployId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      )

      return {
        id: deployStatusResponse.data.id,
        site_id: deployStatusResponse.data.site_id,
        deploy_url: deployStatusResponse.data.deploy_ssl_url || deployStatusResponse.data.ssl_url,
        admin_url: deployStatusResponse.data.admin_url,
        state: deployStatusResponse.data.state,
      }
    } catch (error) {
      this.handleError(error, 'Failed to deploy to Netlify')
      throw error
    }
  }

  /**
   * Get deployment status
   */
  async getDeploymentStatus(siteId: string, deployId: string): Promise<NetlifyDeployResponse> {
    if (!siteId || !deployId) {
      throw new Error('Site ID and Deploy ID are required')
    }

    try {
      const response = await axios.get(
        `${this.apiUrl}/sites/${siteId}/deploys/${deployId}`,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      )

      return {
        id: response.data.id,
        site_id: response.data.site_id,
        deploy_url: response.data.deploy_ssl_url || response.data.ssl_url,
        admin_url: response.data.admin_url,
        state: response.data.state,
      }
    } catch (error) {
      this.handleError(error, 'Failed to get deployment status')
      throw error
    }
  }

  /**
   * Get build log for a deployment
   */
  async getBuildLog(deployId: string): Promise<string> {
    if (!deployId) {
      throw new Error('Deploy ID is required')
    }

    try {
      const response = await axios.get(`${this.apiUrl}/deploys/${deployId}/log`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      return response.data || 'No build log available'
    } catch (error) {
      this.handleError(error, 'Failed to get build log')
      throw error
    }
  }

  /**
   * Get site by ID
   */
  async getSite(siteId: string): Promise<NetlifySite> {
    if (!siteId) {
      throw new Error('Site ID is required')
    }

    try {
      const response = await axios.get(`${this.apiUrl}/sites/${siteId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })

      return {
        site_id: response.data.id,
        name: response.data.name,
        url: response.data.ssl_url || response.data.url,
        admin_url: response.data.admin_url,
      }
    } catch (error) {
      this.handleError(error, 'Failed to get site information')
      throw error
    }
  }

  /**
   * Delete a site
   */
  async deleteSite(siteId: string): Promise<void> {
    if (!siteId) {
      throw new Error('Site ID is required')
    }

    try {
      await axios.delete(`${this.apiUrl}/sites/${siteId}`, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      })
    } catch (error) {
      this.handleError(error, 'Failed to delete site')
      throw error
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: unknown, message: string): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string; errors?: unknown }>
      const errorMessage = axiosError.response?.data?.message || axiosError.message
      const errorDetails = axiosError.response?.data
      
      console.error(`${message}:`, {
        status: axiosError.response?.status,
        statusText: axiosError.response?.statusText,
        message: errorMessage,
        details: errorDetails,
        url: axiosError.config?.url,
      })
      
      if (axiosError.response?.status === 401) {
        throw new Error('Invalid or expired Netlify access token')
      } else if (axiosError.response?.status === 403) {
        throw new Error('Insufficient permissions for this Netlify operation')
      } else if (axiosError.response?.status === 404) {
        throw new Error('Netlify resource not found')
      } else if (axiosError.response?.status === 429) {
        throw new Error('Netlify API rate limit exceeded')
      }
      
      throw new Error(`${message}: ${errorMessage}`)
    }
    
    console.error(`${message}:`, error)
    throw new Error(message)
  }
}
