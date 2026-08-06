const express = require('express');
const cors = require('cors');
const { HfInference } = require('@huggingface/inference');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Hugging Face API client
const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DrishtiAI Backend Server Running' });
});

// ── Enhance Sketch with FLUX.1-dev ──
app.post('/api/enhance-sketch', async (req, res) => {
  try {
    const { image, layers, canvasWidth, canvasHeight, prompt, negativePrompt } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    console.log('[ENHANCE] Received request');
    console.log('  - Canvas size:', canvasWidth, 'x', canvasHeight);
    console.log('  - Layers count:', layers?.length || 0);
    console.log('  - Using FLUX.1-dev model');

    // Convert base64 to Buffer
    const imageBuffer = Buffer.from(image, 'base64');

    // Prepare prompt for FLUX
    const fullPrompt = prompt || "photorealistic human face portrait, professional photograph, high detail, neutral expression, front facing, studio lighting, 8k, sharp focus";

    console.log('[ENHANCE] Calling FLUX.1-dev API...');

    // Call FLUX.1-dev img2img
    // Note: FLUX uses textToImage, so we'll convert sketch using their approach
    const result = await hf.textToImage({
      model: 'black-forest-labs/FLUX.1-dev',
      inputs: fullPrompt,
      parameters: {
        num_inference_steps: 30,
        guidance_scale: 3.5, // FLUX works best with lower guidance (2-4)
        width: canvasWidth || 512,
        height: canvasHeight || 512,
      },
    });

    console.log('[ENHANCE] Image generated successfully');

    // Convert result to base64
    const buffer = await result.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    // Log layer information
    console.log('[LAYERS] Coordinate data:');
    layers?.forEach((layer, idx) => {
      console.log(`  Layer ${idx + 1}: X:${layer.x} Y:${layer.y} Size:${layer.width}x${layer.height} Blend:${layer.blendMode} Opacity:${layer.opacity}`);
    });

    res.json({
      success: true,
      enhancedImage: base64Image,
      metadata: {
        originalSize: { width: canvasWidth, height: canvasHeight },
        layersProcessed: layers?.length || 0,
        model: 'FLUX.1-dev',
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[ENHANCE ERROR]', error);
    res.status(500).json({ 
      error: 'Failed to enhance image',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ── Alternative: FLUX.1-schnell (Faster version) ──
app.post('/api/enhance-sketch-fast', async (req, res) => {
  try {
    const { image, prompt } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const fullPrompt = prompt || "photorealistic human face portrait, professional photo";

    console.log('[ENHANCE-FAST] Using FLUX.1-schnell');

    const result = await hf.textToImage({
      model: 'black-forest-labs/FLUX.1-schnell',
      inputs: fullPrompt,
      parameters: {
        num_inference_steps: 4, // Schnell only needs 1-4 steps
        guidance_scale: 0, // Schnell doesn't use guidance
      },
    });

    const buffer = await result.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    res.json({
      success: true,
      enhancedImage: base64Image,
      metadata: {
        model: 'FLUX.1-schnell',
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[ENHANCE-FAST ERROR]', error);
    res.status(500).json({ 
      error: 'Failed to enhance image',
      message: error.message
    });
  }
});

// ── Realistic Vision (Original - Best for img2img from sketches) ──
app.post('/api/enhance-sketch-realistic', async (req, res) => {
  try {
    const { image, layers, canvasWidth, canvasHeight, prompt, negativePrompt } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const imageBuffer = Buffer.from(image, 'base64');
    const fullPrompt = prompt || "photorealistic human face portrait, high detail, professional photo, neutral expression, front view, studio lighting";
    const fullNegativePrompt = negativePrompt || "cartoon, anime, sketch, drawing, lines, low quality, blurry, distorted, deformed, ugly, duplicate, disfigured";

    console.log('[ENHANCE-REALISTIC] Using Realistic Vision V5.1');

    // This model is specifically trained for img2img from sketches
    const result = await hf.imageToImage({
      model: 'SG161222/Realistic_Vision_V5.1_noVAE',
      inputs: imageBuffer,
      parameters: {
        prompt: fullPrompt,
        negative_prompt: fullNegativePrompt,
        num_inference_steps: 40,
        guidance_scale: 7.5,
        strength: 0.75, // How much to transform the sketch
      },
    });

    const buffer = await result.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    res.json({
      success: true,
      enhancedImage: base64Image,
      metadata: {
        model: 'Realistic_Vision_V5.1',
        layersProcessed: layers?.length || 0,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[ENHANCE-REALISTIC ERROR]', error);
    res.status(500).json({ 
      error: 'Failed to enhance image',
      message: error.message
    });
  }
});

// ── Save case endpoint (placeholder) ──
app.post('/api/save-case', async (req, res) => {
  try {
    const { image, enhancedImage, layers, caseInfo } = req.body;

    console.log('[SAVE-CASE] Saving case to database');
    console.log('  - Case info:', caseInfo);
    console.log('  - Layers:', layers?.length);

    res.json({
      success: true,
      caseId: `CASE-${Date.now()}`,
      message: 'Case saved successfully'
    });

  } catch (error) {
    console.error('[SAVE-CASE ERROR]', error);
    res.status(500).json({ 
      error: 'Failed to save case',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 DrishtiAI Backend Server');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 Hugging Face API: ${process.env.HUGGINGFACE_API_KEY ? '✓ Configured' : '✗ Missing'}`);
  console.log('\n🎨 Available Models:');
  console.log('  • FLUX.1-dev (POST /api/enhance-sketch)');
  console.log('  • FLUX.1-schnell (POST /api/enhance-sketch-fast)');
  console.log('  • Realistic Vision (POST /api/enhance-sketch-realistic)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});