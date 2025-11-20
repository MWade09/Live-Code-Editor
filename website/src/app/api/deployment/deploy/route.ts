import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NetlifyClient } from '@/lib/deployment/netlify-client'
import { VercelClient } from '@/lib/deployment/vercel-client'
import {
  parseProjectContent,
  prepareFilesForDeployment,
  sanitizeProjectName,
  validateDeploymentFiles,
} from '@/lib/deployment/deployment-helpers'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { projectId, platform, envVars } = await req.json()

    // Validate input
    if (!projectId || !platform) {
      return NextResponse.json(
        { error: 'Project ID and platform are required' },
        { status: 400 }
      )
    }

    if (!['netlify', 'vercel'].includes(platform)) {
      return NextResponse.json({ error: 'Invalid platform' }, { status: 400 })
    }

    // Get project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Get deployment token
    const { data: tokenData, error: tokenError } = await supabase
      .from('deployment_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('platform', platform)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json(
        {
          error: `No ${platform} token found. Please connect your ${platform} account first.`,
        },
        { status: 400 }
      )
    }

    // Parse and prepare project files
    const rawFiles = parseProjectContent(project.content)
    const files = prepareFilesForDeployment(rawFiles)

    // Validate files
    const validation = validateDeploymentFiles(files)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.errors.join(', ') },
        { status: 400 }
      )
    }

    // Create deployment record
    const { data: deployment, error: deployError } = await supabase
      .from('deployments')
      .insert({
        project_id: projectId,
        user_id: user.id,
        platform,
        status: 'pending',
        environment_vars: envVars || {},
      })
      .select()
      .single()

    if (deployError) {
      console.error('Failed to create deployment:', deployError)
      return NextResponse.json(
        { error: 'Failed to create deployment' },
        { status: 500 }
      )
    }

    // Deploy based on platform
    try {
      if (platform === 'netlify') {
        const client = new NetlifyClient(tokenData.access_token)

        // Get or create site
        let siteId = project.netlify_site_id
        if (!siteId) {
          const siteName = sanitizeProjectName(project.title)
          const site = await client.createSite(siteName)
          siteId = site.site_id

          // Save site ID
          await supabase
            .from('projects')
            .update({ netlify_site_id: siteId })
            .eq('id', projectId)
        }

        // Deploy files
        const deployResult = await client.deployFiles({
          siteId,
          files,
          envVars,
        })

        // Update deployment record
        await supabase
          .from('deployments')
          .update({
            status: 'building',
            site_id: deployResult.site_id,
            deployment_id: deployResult.id,
            deploy_url: deployResult.deploy_url,
          })
          .eq('id', deployment.id)

        return NextResponse.json({
          deploymentId: deployment.id,
          status: 'building',
          url: deployResult.deploy_url,
          platform: 'netlify',
        })
      } else if (platform === 'vercel') {
        const client = new VercelClient(tokenData.access_token)

        const projectName = sanitizeProjectName(project.title)
        const deployResult = await client.deployProject({
          name: projectName,
          files,
          projectId: project.vercel_project_id,
        })

        // Save project ID if new
        if (deployResult.project_id && !project.vercel_project_id) {
          await supabase
            .from('projects')
            .update({ vercel_project_id: deployResult.project_id })
            .eq('id', projectId)
        }

        // Update deployment record
        await supabase
          .from('deployments')
          .update({
            status: 'building',
            deployment_id: deployResult.id,
            deploy_url: deployResult.url,
          })
          .eq('id', deployment.id)

        return NextResponse.json({
          deploymentId: deployment.id,
          status: 'building',
          url: deployResult.url,
          platform: 'vercel',
        })
      }
    } catch (deploymentError) {
      console.error('Deployment error:', deploymentError)

      // Update deployment as failed
      await supabase
        .from('deployments')
        .update({
          status: 'failed',
          error_message:
            deploymentError instanceof Error
              ? deploymentError.message
              : 'Deployment failed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', deployment.id)

      return NextResponse.json(
        {
          error:
            deploymentError instanceof Error
              ? deploymentError.message
              : 'Deployment failed',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ error: 'Unknown error' }, { status: 500 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
