import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// OpenRouter API for embeddings
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/embeddings';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const DEFAULT_EMBEDDING_MODEL = 'openai/text-embedding-3-small';

/**
 * POST /api/embeddings/search
 * Search for relevant file chunks using semantic similarity
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { 
            projectId, 
            query, 
            topK = 5, 
            threshold = 0.5,
            includeContent = true 
        } = body;

        if (!projectId) {
            return NextResponse.json(
                { error: 'projectId is required' },
                { status: 400 }
            );
        }

        if (!query || typeof query !== 'string') {
            return NextResponse.json(
                { error: 'query is required and must be a string' },
                { status: 400 }
            );
        }

        // Generate embedding for the search query
        const queryEmbedding = await generateEmbedding(query);

        if (!queryEmbedding) {
            return NextResponse.json(
                { error: 'Failed to generate query embedding' },
                { status: 500 }
            );
        }

        // Call Supabase function for similarity search
        const { data: results, error } = await supabase.rpc('search_embeddings', {
            p_project_id: projectId,
            p_query_embedding: queryEmbedding,
            p_match_count: topK,
            p_match_threshold: threshold
        });

        if (error) {
            console.error('[Semantic Search] Supabase error:', error);
            
            // Fallback to manual similarity search if function doesn't exist
            const fallbackResults = await fallbackSearch(projectId, queryEmbedding, topK, threshold);
            
            return NextResponse.json({
                projectId,
                query,
                results: fallbackResults,
                method: 'fallback'
            });
        }

        // Optionally strip content for lighter response
        const formattedResults = results?.map((r: { 
            id: string; 
            file_path: string; 
            chunk_index: number; 
            content: string; 
            similarity: number; 
        }) => ({
            id: r.id,
            filePath: r.file_path,
            chunkIndex: r.chunk_index,
            content: includeContent ? r.content : undefined,
            similarity: r.similarity
        })) || [];

        return NextResponse.json({
            projectId,
            query,
            results: formattedResults,
            count: formattedResults.length
        });

    } catch (error) {
        console.error('[Semantic Search] Error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

/**
 * Generate embedding for text using OpenRouter
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://codepen-clone.netlify.app',
                'X-Title': 'Live Code Editor'
            },
            body: JSON.stringify({
                model: DEFAULT_EMBEDDING_MODEL,
                input: text.slice(0, 30000) // Truncate if needed
            })
        });

        if (!response.ok) {
            console.error('[Semantic Search] Embedding API error:', response.status);
            return null;
        }

        const data = await response.json();
        return data.data?.[0]?.embedding || null;

    } catch (error) {
        console.error('[Semantic Search] Embedding generation error:', error);
        return null;
    }
}

/**
 * Fallback search using manual cosine similarity
 * Used when pgvector function is not available
 */
async function fallbackSearch(
    projectId: string, 
    queryEmbedding: number[], 
    topK: number,
    threshold: number
): Promise<Array<{ filePath: string; chunkIndex: number; content: string; similarity: number }>> {
    try {
        // Fetch all embeddings for the project
        const { data: embeddings, error } = await supabase
            .from('project_embeddings')
            .select('id, file_path, chunk_index, content, embedding')
            .eq('project_id', projectId)
            .not('embedding', 'is', null);

        if (error || !embeddings) {
            console.error('[Fallback Search] Fetch error:', error);
            return [];
        }

        // Calculate cosine similarity for each embedding
        const results = embeddings
            .map((e: { id: string; file_path: string; chunk_index: number; content: string; embedding: number[] }) => ({
                id: e.id,
                filePath: e.file_path,
                chunkIndex: e.chunk_index,
                content: e.content,
                similarity: cosineSimilarity(queryEmbedding, e.embedding)
            }))
            .filter(r => r.similarity >= threshold)
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, topK);

        return results;

    } catch (error) {
        console.error('[Fallback Search] Error:', error);
        return [];
    }
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
    if (!a || !b || a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
