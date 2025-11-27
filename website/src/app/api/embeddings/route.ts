import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// OpenRouter API for embeddings
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/embeddings';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// Embedding model configuration
const DEFAULT_EMBEDDING_MODEL = 'openai/text-embedding-3-small';
// Expected dimension for text-embedding-3-small is 1536

/**
 * POST /api/embeddings
 * Generate embeddings for text content
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { text, model = DEFAULT_EMBEDDING_MODEL } = body;

        if (!text || typeof text !== 'string') {
            return NextResponse.json(
                { error: 'Text is required and must be a string' },
                { status: 400 }
            );
        }

        // Truncate if too long (max ~8000 tokens for embedding models)
        const truncatedText = text.slice(0, 30000);

        // Call OpenRouter embeddings API
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://codepen-clone.netlify.app',
                'X-Title': 'Live Code Editor'
            },
            body: JSON.stringify({
                model: model,
                input: truncatedText
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[Embeddings API] OpenRouter error:', errorText);
            return NextResponse.json(
                { error: 'Failed to generate embedding', details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        
        // OpenRouter returns embeddings in data.data[0].embedding format
        const embedding = data.data?.[0]?.embedding;

        if (!embedding) {
            return NextResponse.json(
                { error: 'No embedding returned from API' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            embedding,
            model: model,
            dimension: embedding.length,
            usage: data.usage
        });

    } catch (error) {
        console.error('[Embeddings API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/embeddings?projectId=xxx
 * Get all embeddings for a project (for client-side caching)
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');

        if (!projectId) {
            return NextResponse.json(
                { error: 'projectId is required' },
                { status: 400 }
            );
        }

        // Fetch embeddings from Supabase
        const { data: embeddings, error } = await supabase
            .from('project_embeddings')
            .select('file_path, chunk_index, content, embedding, content_hash, updated_at')
            .eq('project_id', projectId)
            .order('file_path')
            .order('chunk_index');

        if (error) {
            console.error('[Embeddings API] Supabase fetch error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch embeddings', details: error.message },
                { status: 500 }
            );
        }

        return NextResponse.json({
            projectId,
            embeddings: embeddings || [],
            count: embeddings?.length || 0
        });

    } catch (error) {
        console.error('[Embeddings API] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
