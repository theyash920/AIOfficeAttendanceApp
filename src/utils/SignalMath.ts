// src/utils/SignalMath.ts
const calculateSimilarity = (a: number[], b: number[]): number => {
  if (a.length === 0 || b.length === 0) return 0;
  const len = Math.min(a.length, b.length);

  let dot = 0;
  let magA = 0;
  let magB = 0;

  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }

  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  if (!Number.isFinite(denom) || denom === 0) return 0;
  return dot / denom;
};

export const SignalMath = {
  compareEmbeddings(stored: number[], live: number[]): boolean {
    // We use "Cosine Similarity" or "Euclidean Distance"
    // For simplicity, let's say a 90% match is required
    const threshold = 0.90; 
    const similarity = calculateSimilarity(stored, live); 
    
    return similarity >= threshold;
  }
};