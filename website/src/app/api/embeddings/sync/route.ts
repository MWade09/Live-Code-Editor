import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface EmbeddingRecord {
    project_id: string;
    file_path: string;
    chunk_index: number;
    content: string;
    embedding: number[];
    content_hash: string;
}

/**
 * POST /api/embeddings/sync
 * Sync embeddings from client to Supabase
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { projectId, embeddings } = body;

        if (!projectId) {
            return NextResponse.json(
                { error: 'projectId is required' },
                { status: 400 }
            );
        }

        if (!Array.isArray(embeddings) || embeddings.length === 0) {
            return NextResponse.json(
                { error: 'embeddings array is required and must not be empty' },
                { status: 400 }
            );
        }

        // Validate embedding records
        const validEmbeddings: EmbeddingRecord[] = embeddings
            .filter((e: EmbeddingRecord) => 
                e.file_path && 
                typeof e.chunk_index === 'number' && 
                e.content && 
                Array.isArray(e.embedding)
            )
            .map((e: EmbeddingRecord) => ({
                project_id: projectId,
                file_path: e.file_path,
                chunk_index: e.chunk_index,
                content: e.content,
                embedding: e.embedding,
                content_hash: e.content_hash || '',
                updated_at: new Date().toISOString()
            }));

        if (validEmbeddings.length === 0) {
            return NextResponse.json(
                { error: 'No valid embeddings to sync' },
                { status: 400 }
            );
        }

        // Delete existing embeddings for this project first
        // This ensures clean sync without conflicts
        const { error: deleteError } = await supabase
            .from('project_embeddings')
            .delete()
            .eq('project_id', projectId);

        if (deleteError) {
            console.error('[Embeddings Sync] Delete error:', deleteError);
            // Continue anyway - might be first sync
        }

        // Insert new embeddings in batches (Supabase has limits)
        const BATCH_SIZE = 100;
        let insertedCount = 0;
        const errors: string[] = [];

        for (let i = 0; i < validEmbeddings.length; i += BATCH_SIZE) {
            const batch = validEmbeddings.slice(i, i + BATCH_SIZE);
            
            const { error: insertError } = await supabase
                .from('project_embeddings')
                .insert(batch);

            if (insertError) {
                console.error('[Embeddings Sync] Insert error:', insertError);
                errors.push(`Batch ${Math.floor(i / BATCH_SIZE)}: ${insertError.message}`);
            } else {
                insertedCount += batch.length;
            }
        }

        // Update project metadata
        await supabase
            .from('projects')
            .update({
                embeddings_updated_at: new Date().toISOString(),
                embeddings_count: insertedCount
            })
            .eq('id', projectId);

        return NextResponse.json({
            success: true,
            projectId,
            syncedCount: insertedCount,
            totalReceived: embeddings.length,
            errors: errors.length > 0 ? errors : undefined
        });

    } catch (error) {
        console.error('[Embeddings Sync] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/embeddings/sync?projectId=xxx
 * Clear all embeddings for a project
 */
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        if (!projectId) {
            return NextResponse.json(
                { error: 'projectId is required' },
                { status: 400 }
            );
        }

        const { error } = await supabase
            .from('project_embeddings')
            .delete()
            .eq('project_id', projectId);

        if (error) {
            console.error('[Embeddings Sync] Delete error:', error);
            return NextResponse.json(
                { error: 'Failed to delete embeddings', details: error.message },
                { status: 500 }
            );
        }

        // Update project metadata
        await supabase
            .from('projects')
            .update({
                embeddings_updated_at: null,
                embeddings_count: 0
            })
            .eq('id', projectId);

        return NextResponse.json({
            success: true,
            projectId,
            message: 'All embeddings deleted'
        });

    } catch (error) {
        console.error('[Embeddings Sync] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
