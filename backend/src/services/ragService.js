const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Embedding = require('../models/Embedding');

class RAGService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.embeddingModel = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
    this.chunks = [];
    this.embeddings = [];
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🔄 Initializing RAG service...');
    
    // Check if embeddings exist in DB
    const existingCount = await Embedding.countDocuments();
    
    if (existingCount > 0) {
      console.log(`📄 Loading ${existingCount} embeddings from database...`);
      await this.loadFromDatabase();
    } else {
      console.log('📄 No embeddings found, creating new ones...');
      await this.loadAndProcessDocument();
    }
    
    console.log('✅ RAG service initialized');
    this.isInitialized = true;
  }

  async loadAndProcessDocument() {
    const docPath = path.join(__dirname, '../../../Oxford-Handbook-of-Medical-Dermatology.txt');
    const content = fs.readFileSync(docPath, 'utf8');
    
    // Split into chunks
    this.chunks = this.splitIntoChunks(content, 500, 100);
    console.log(`📄 Created ${this.chunks.length} chunks`);
    
    // Generate embeddings for all chunks
    await this.generateEmbeddings();
  }

  splitIntoChunks(text, chunkSize = 500, overlap = 100) {
    const chunks = [];
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        
        // Create overlap
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(overlap / 10));
        currentChunk = overlapWords.join(' ') + ' ' + sentence;
      } else {
        currentChunk += sentence + '. ';
      }
    }
    
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }

  async generateEmbeddings() {
    console.log('🔄 Generating embeddings...');
    
    for (let i = 0; i < this.chunks.length; i++) {
      try {
        const result = await this.embeddingModel.embedContent(this.chunks[i]);
        const embedding = result.embedding.values;
        this.embeddings.push(embedding);
        
        // Save to database
        await Embedding.create({
          chunk: this.chunks[i],
          embedding: embedding,
          index: i
        });
        
        if (i % 50 === 0) {
          console.log(`📊 Generated ${i + 1}/${this.chunks.length} embeddings`);
        }
        
        // Small delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error generating embedding for chunk ${i}:`, error.message);
        // Use zero vector as fallback
        const fallbackEmbedding = new Array(768).fill(0);
        this.embeddings.push(fallbackEmbedding);
        
        await Embedding.create({
          chunk: this.chunks[i],
          embedding: fallbackEmbedding,
          index: i
        });
      }
    }
  }

  cosineSimilarity(a, b) {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dotProduct / (magnitudeA * magnitudeB);
  }

  async retrieveContext(question, topK = 3) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Generate embedding for the question
      const result = await this.embeddingModel.embedContent(question);
      const questionEmbedding = result.embedding.values;

      // Calculate similarities
      const similarities = this.embeddings.map((embedding, index) => ({
        index,
        similarity: this.cosineSimilarity(questionEmbedding, embedding),
        chunk: this.chunks[index]
      }));

      // Sort by similarity and get top K
      const topChunks = similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .map(item => item.chunk);

      return topChunks.join('\n\n');
    } catch (error) {
      console.error('Error retrieving context:', error.message);
      // Fallback to keyword search
      return this.keywordSearch(question, topK);
    }
  }

  async loadFromDatabase() {
    const embeddings = await Embedding.find().sort({ index: 1 });
    
    this.chunks = embeddings.map(e => e.chunk);
    this.embeddings = embeddings.map(e => e.embedding);
  }

  keywordSearch(question, topK = 3) {
    const keywords = question.toLowerCase().split(' ').filter(word => word.length > 2);
    
    const scores = this.chunks.map((chunk, index) => {
      const chunkLower = chunk.toLowerCase();
      const score = keywords.reduce((sum, keyword) => {
        const matches = (chunkLower.match(new RegExp(keyword, 'g')) || []).length;
        return sum + matches;
      }, 0);
      return { index, score, chunk };
    });

    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(item => item.chunk)
      .join('\n\n');
  }
}

module.exports = new RAGService();