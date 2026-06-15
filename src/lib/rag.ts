import { GoogleGenAI } from "@google/genai";
import type { WikiChunk } from "./wikivoyage";

const ai = new GoogleGenAI({});

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// Embeds the query and all chunks in one batched call
// returns the top-K chunks by cosine similarity to the query. 
// Falls back to an empty array on error.
export async function retrieveTopChunks(chunks: WikiChunk[], query: string, topK = 8): Promise<WikiChunk[]> {
  if (chunks.length === 0) return [];//failed fetch

  // query first so index 0 is always the query vector
  const texts = [query, ...chunks.map(c => `${c.section}: ${c.text}`)];

  try {
    const result = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: texts,
    });

    const vecs = result.embeddings!.map(e => e.values!);
    const queryVec = vecs[0];

    return chunks
      .map((chunk, i) => ({ chunk, score: cosine(queryVec, vecs[i + 1]) }))//compute and list cosine similarity
      .sort((a, b) => b.score - a.score)//sorting by score descending
      .slice(0, topK)//take top 8
      .map(s => s.chunk);
  } catch (err) {
    console.error('[RAG] embedding error:', err);
    return [];
  }
}

export function formatRagContext(chunks: WikiChunk[]): string {
  if (chunks.length === 0) return '';
  return (
    '\n\n## WikiVoyage context - verified facts to ground your itinerary:\n' +
    chunks.map(c => `### ${c.destination} - ${c.section}\n${c.text}`).join('\n\n')// ### Houston - Do [...text...] ### Houston - Eat [...text...]
  );
}
