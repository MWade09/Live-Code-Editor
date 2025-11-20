import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { NetlifyClient } from '@/lib/deployment/netlify-client'
import { VercelClient } from '@/lib/deployment/vercel-client'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get deployment
    const { data: deployment, error: deployError } = await supabase
      .from('deployments')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (deployError || !deployment) {
      return NextResponse.json(
        { error: 'Deployment not found' },
        { status: 404 }
      )
    }

    // If deployment is already completed, return current status
    if (deployment.status === 'success' || deployment.status === 'failed') {
      return NextResponse.json({
        id: deployment.id,
        status: deployment.status,
        url: deployment.deploy_url,
        error: deployment.error_message,
        completedAt: deployment.completed_at,
      })
    }

    // Get deployment token
    const { data: tokenData, error: tokenError } = await supabase
      .from('deployment_tokens')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('platform', deployment.platform)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Deployment token not found' },
        { status: 400 }
      )
    }

    try {
      // Check status on platform
      if (deployment.platform === 'netlify') {
        const client = new NetlifyClient(tokenData.access_token)
        const status = await client.getDeploymentStatus(
          deployment.site_id!,
          deployment.deployment_id!
        )

        let newStatus: 'pending' | 'building' | 'success' | 'failed' = 'building'

        if (status.state === 'ready') {
          newStatus = 'success'
        } else if (status.state === 'error') {
          newStatus = 'failed'
        } else if (status.state === 'processing') {
          newStatus = 'building'
        }

        // Update deployment if status changed
        if (newStatus !== deployment.status) {
          await supabase
            .from('deployments')
            .update({
              status: newStatus,
              deploy_url: status.deploy_url,
              completed_at:
                newStatus === 'success' || newStatus === 'failed'
                  ? new Date().toISOString()
                  : null,
            })
            .eq('id', id)
        }

        return NextResponse.json({
          id: deployment.id,
          status: newStatus,
          url: status.deploy_url,
          platform: 'netlify',
        })
      } else if (deployment.platform === 'vercel') {
        const client = new VercelClient(tokenData.access_token)
        const status = await client.getDeploymentStatus(deployment.deployment_id!)

        let newStatus: 'pending' | 'building' | 'success' | 'failed' = 'building'

        if (status.readyState === 'READY') {
          newStatus = 'success'
        } else if (
          status.readyState === 'ERROR' ||
          status.readyState === 'CANCELED'
        ) {
          newStatus = 'failed'
        } else if (status.readyState === 'BUILDING') {
          newStatus = 'building'
        } else if (status.readyState === 'QUEUED') {
          newStatus = 'pending'
        }

        // Update deployment if status changed
        if (newStatus !== deployment.status) {
          await supabase
            .from('deployments')
            .update({
              status: newStatus,
              deploy_url: status.url,
              completed_at:
                newStatus === 'success' || newStatus === 'failed'
                  ? new Date().toISOString()
                  : null,
            })
            .eq('id', id)
        }

        return NextResponse.json({
          id: deployment.id,
          status: newStatus,
          url: status.url,
          platform: 'vercel',
        })
      }

      return NextResponse.json({ error: 'Unknown platform' }, { status: 400 })
    } catch (statusError) {
      console.error('Status check error:', statusError)

      // Update deployment as failed
      await supabase
        .from('deployments')
        .update({
          status: 'failed',
          error_message:
            statusError instanceof Error
              ? statusError.message
              : 'Failed to check status',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id)

      return NextResponse.json(
        {
          error:
            statusError instanceof Error
              ? statusError.message
              : 'Failed to check status',
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
