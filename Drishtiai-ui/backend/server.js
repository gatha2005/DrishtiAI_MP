const sendAlertEmail =
  require("./services/emailService");

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const express = require('express');
const cors = require('cors');
//const fetch = require('node-fetch');

require("dotenv").config();
console.log("EMAIL_USER =", process.env.EMAIL_USER);
console.log(
  "EMAIL_PASS exists =",
  !!process.env.EMAIL_PASS
);
const connectDB = require('./config/db.js'); // 👈 ADD THIS
const Sketch = require('./models/Sketch.js');
const auth = require("./middleware/auth");
const role = require("./middleware/role");
const authRoutes = require("./routes/authRoutes");
console.log('Sketch:', Sketch);

const app = express();
const PORT = process.env.PORT || 3001;

async function saveBase64Image(base64Data, folder, fileName) {

  const uploadDir = path.join(
    __dirname,
    "uploads",
    folder
  );

  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const outputPath = path.join(
    uploadDir,
    fileName
  );

  const buffer = Buffer.from(
    base64Data,
    "base64"
  );

  await sharp(buffer)
    .resize(512, 512)
    .png()
    .toFile(outputPath);

  return outputPath;
}

connectDB(); // 👈 ADD THIS

// Your Colab SENTINEL API URL
const COLAB_URL = process.env.COLAB_URL;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use("/api/auth", authRoutes);

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'DrishtiAI Backend Server Running',
    colabConnected: !!COLAB_URL,
    colabUrl: COLAB_URL || 'Not configured'
  });
});

// Test Colab connection
app.get('/api/test-colab', async (req, res) => {
  if (!COLAB_URL) {
    return res.status(400).json({ error: 'COLAB_URL not configured in .env' });
  }

  try {
    const response = await fetch(`${COLAB_URL}/health`);
    const data = await response.json();
    res.json({ 
      success: true, 
      colab: data,
      message: 'Colab API is connected and working!' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Cannot connect to Colab. Make sure the notebook is running and COLAB_URL is correct.'
    });
  }
});

// ── Enhance Sketch with SENTINEL API ──
app.post('/api/enhance-sketch', async (req, res) => {
  console.log("REQ BODY:", req.body);
  console.log("Received image:", req.body.originalSketch);
  try {
    const { originalSketch, layers, canvasWidth, canvasHeight, prompt, negativePrompt } = req.body;
    const image = originalSketch;
    console.log("REQ BODY:", req.body);
    console.log("Received image:", image);


    // ✅ ADD THIS HERE
    if (!originalSketch) {
      return res.status(400).json({ error: 'No sketch provided' });
    }

    if (!COLAB_URL) {
      return res.status(400).json({ 
        error: 'COLAB_URL not configured',
        message: 'Please add your Colab URL to the .env file'
      });
    }

    console.log('[ENHANCE] Received request');
    console.log('  - Canvas size:', canvasWidth, 'x', canvasHeight);
    console.log('  - Layers count:', layers?.length || 0);
    console.log('  - Using SENTINEL Colab API');

    // Prepare prompt
    const fullPrompt = prompt || "photorealistic human face portrait, professional photograph, high detail, neutral expression, front facing, studio lighting, 8k, sharp focus, realistic skin texture";
    const fullNegativePrompt = negativePrompt || "cartoon, anime, sketch, drawing, lines, low quality, blurry, distorted, deformed, ugly, duplicate, disfigured";

    console.log('[ENHANCE] Calling SENTINEL API...');

    // Call your Colab SENTINEL API
    const response = await fetch(`${COLAB_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: fullPrompt,
        negative: fullNegativePrompt,
        steps: 25,           // 20-30 is good balance
        guidance: 7.5,       // 7-10 for realistic faces
        seed: Math.floor(Math.random() * 999999)
      })
    });

    if (!response.ok) {
      throw new Error(`Colab API returned ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Generation failed');
    }

    console.log('[ENHANCE] Image generated successfully');

    // Extract base64 from data URL
    const base64Image = result.imageUrl.split(',')[1];

    // Log layer information
    console.log('[LAYERS] Coordinate data:');
    layers?.forEach((layer, idx) => {
      console.log(`  Layer ${idx + 1}: X:${layer.x} Y:${layer.y} Size:${layer.width}x${layer.height} Blend:${layer.blendMode} Opacity:${layer.opacity}`);
    });
    
    const sketchFileName =
  `sketch-${Date.now()}.png`;

const generatedFileName =
  `generated-${Date.now()}.png`;

const sketchPath = await saveBase64Image(
  image.replace(/^data:image\/\w+;base64,/, ''),
  "original",
  sketchFileName
);

const generatedPath = await saveBase64Image(
  base64Image,
  "generated",
  generatedFileName
);

console.log("Saved sketch:", sketchPath);
console.log("Saved generated:", generatedPath);

    // ✅ SAVE TO MONGODB WITH DEBUG
    try {
         await Sketch.create({
          caseId: `CASE-${Date.now()}`,

          alertEmail: "yourmail@gmail.com", // receiver email make changes later

          originalSketchPath: `/uploads/original/${sketchFileName}`,
          generatedImagePath: `/uploads/generated/${generatedFileName}`,

          prompt: fullPrompt,
          negativePrompt: fullNegativePrompt,
          layersCount: layers?.length || 0
        });

      console.log('✅ Data saved to MongoDB');

    } catch (dbError) {
      console.error('❌ DB Save Failed:', dbError);
    }

    res.json({
      success: true,
      enhancedImage: base64Image,
      metadata: {
        originalSize: { width: canvasWidth, height: canvasHeight },
        layersProcessed: layers?.length || 0,
        model: result.model || 'Stable Diffusion 1.5 (Colab T4)',
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[ENHANCE ERROR]', error);
    res.status(500).json({ 
      error: 'Failed to enhance image',
      message: error.message,
      hint: 'Make sure your Colab notebook is running and the URL is correct in .env',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ── Fast generation (lower quality, faster) ──
app.post('/api/enhance-sketch-fast', async (req, res) => {
  try {
    const { originalSketch, prompt } = req.body;

    const image = originalSketch;

    // ✅ check image properly
    if (!image) {
      return res.status(400).json({ error: 'No sketch provided' });
    }

    if (!COLAB_URL) {
      return res.status(400).json({ error: 'COLAB_URL not configured' });
    }

    const fullPrompt =
      prompt || "photorealistic human face portrait, professional photo";

    console.log('[ENHANCE-FAST] Using SENTINEL API (fast mode)');

    const response = await fetch(`${COLAB_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: fullPrompt,
        negative: "cartoon, anime, sketch, blurry",
        steps: 15,
        guidance: 7.0,
        seed: Math.floor(Math.random() * 999999)
      })
    });

    const result = await response.json();

    const base64Image = result.imageUrl.split(',')[1];

    res.json({
      success: true,
      enhancedImage: base64Image,
      metadata: {
        model: 'SD 1.5 Fast',
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

// ── High quality generation (slower, better) ──
app.post('/api/enhance-sketch-hq', async (req, res) => {
  try {
    const {
      originalSketch,
      layers,
      prompt,
      negativePrompt
    } = req.body;

    const image = originalSketch;

    // ✅ Validate image
    if (!image) {
      return res.status(400).json({
        error: 'No sketch provided'
      });
    }

    if (!COLAB_URL) {
      return res.status(400).json({
        error: 'COLAB_URL not configured'
      });
    }

    const fullPrompt =
      prompt ||
      "highly detailed photorealistic portrait, professional studio photography, 8k resolution, perfect skin texture, natural lighting, sharp focus";

    const fullNegativePrompt =
      negativePrompt ||
      "cartoon, anime, sketch, drawing, painting, illustration, low quality, blurry, distorted, deformed, ugly, bad anatomy";

    console.log('[ENHANCE-HQ] Using SENTINEL API (high quality mode)');

    const response = await fetch(`${COLAB_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: fullPrompt,
        negative: fullNegativePrompt,
        steps: 35,
        guidance: 8.5,
        seed: Math.floor(Math.random() * 999999)
      })
    });

    const result = await response.json();

    const base64Image = result.imageUrl.split(',')[1];

    res.json({
      success: true,
      enhancedImage: base64Image,
      metadata: {
        model: 'SD 1.5 High Quality',
        layersProcessed: layers?.length || 0,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[ENHANCE-HQ ERROR]', error);

    res.status(500).json({
      error: 'Failed to enhance image',
      message: error.message
    });
  }
});

// ── Save case endpoint ──
app.post('/api/save-case', async (req, res) => {
  try {
    const { originalSketch, enhancedImage, layers, caseInfo } = req.body;
    const image = originalSketch;

    if (!image) {
      return res.status(400).json({
        error: 'No sketch provided'
      });
    }

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

console.log('✅ /api/sketches route loaded');
// ── Get all saved sketches ──
app.get('/api/sketches', async (req, res) => {
  try {
    const sketches = await Sketch.find().sort({ createdAt: -1 });
    res.json(sketches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE SKETCH
app.delete(
  '/api/sketches/:id',
  auth,
  role("admin"),

  async (req, res) => {

    try {

      await Sketch.findByIdAndDelete(
        req.params.id
      );

      res.json({
        success: true
      });

    } catch (err) {

      res.status(500).json({
        error: err.message
      });

    }
  }
);

// ── Detect face from camera ──
app.post('/api/detect-face', async (req, res) => {
  try {
    const { originalSketch } = req.body;
    const image = originalSketch;

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const sketches = await Sketch.find();

    // 🔥 TEMP MATCH (simple)
    let matchFound = false;
    let matchedCase = null;

    for (let sketch of sketches) {
      // SIMPLE MATCH (replace later with AI)
      if (sketch.generatedImage === image) {
        matchFound = true;
        matchedCase = sketch;
        break;
      }
    }

    if (matchFound) {
      console.log("🚨 MATCH FOUND!");

      // EMAIL (optional now)
      // await sendEmail()

      return res.json({
        match: true,
        caseId: matchedCase._id
      });
    }

    res.json({ match: false });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
 
// ── Send Alert Email ──


app.post('/api/send-alert', async (req, res) => {
  try {

    const {
      caseId,
      alertEmail,
      originalSketchPath,
      generatedImagePath
    } = req.body;

    const sketchPath = path.join(
      __dirname,
      originalSketchPath
    );

    const generatedPath = path.join(
      __dirname,
      generatedImagePath
    );

    await sendAlertEmail(
      alertEmail,
      caseId,
      sketchPath,
      generatedPath
    );

    res.json({
      success: true,
      message: 'Email sent successfully'
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }
});

app.get('/test-email', async (req, res) => {

  try {

    await sendAlertEmail(
      process.env.EMAIL_USER,
      "CASE-TEST"
    );

    res.send("Email Sent");

  } catch (err) {

    console.error(err);

    res.status(500).send(err.message);

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
  console.log(`🤖 Colab SENTINEL: ${COLAB_URL ? '✓ Configured' : '✗ Not configured - add COLAB_URL to .env'}`);
  console.log('\n🎨 Available Endpoints:');
  console.log('  • POST /api/enhance-sketch (Standard quality)');
  console.log('  • POST /api/enhance-sketch-fast (Fast mode)');
  console.log('  • POST /api/enhance-sketch-hq (High quality)');
  console.log('  • GET  /api/test-colab (Test connection)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (COLAB_URL) {
    console.log(`Testing Colab connection to: ${COLAB_URL}`);
    fetch(`${COLAB_URL}/health`)
      .then(r => r.json())
      .then(d => console.log('✓ Colab API is online! GPU:', d.gpu ? 'Yes' : 'No'))
      .catch(e => console.log('✗ Cannot reach Colab API - make sure the notebook is running'));
  }
});