const mongoose = require('mongoose');

const sketchSchema = new mongoose.Schema({
   caseId: String,
  alertEmail: String,
  
  originalSketchPath: String,
  generatedImagePath: String,

  faceDescriptor: {
  type: [Number],
  default: []
},

  prompt: String,
  negativePrompt: String,
  layersCount: Number,

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Sketch', sketchSchema);