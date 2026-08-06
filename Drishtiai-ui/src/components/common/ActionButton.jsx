import { useState, useEffect } from "react";


const API_URL = "http://localhost:3001/api";


export default function ActionButtons({
    canvasData,
    voiceFeatures,
}) {
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [modal, setModal] = useState(null);
  const [enhancedImage, setEnhancedImage] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Facial attributes
  // Default values
  const defaultAttributes = {
    gender: "neutral",
    age: "adult",
    skinTone: "medium",
    ethnicity: "diverse",
    hairColor: "dark",
    hairStyle: "short",
    facialHair: "none",
    scars: "none",
    birthmarks: "none",
    tattoos: "none",
    eyeColor: "brown",
  };
  useEffect(() => {
    if (!voiceFeatures) return;

    setAttributes(prev => ({
      ...prev,

      gender: voiceFeatures.gender?.toLowerCase() || prev.gender,

      age: voiceFeatures.age || prev.age,

      hairColor: voiceFeatures.hairColor?.toLowerCase() || prev.hairColor,

      hairStyle: voiceFeatures.hairLength?.toLowerCase() || prev.hairStyle,

      eyeColor: voiceFeatures.eyeColor?.toLowerCase() || prev.eyeColor,

      skinTone: voiceFeatures.skinTone?.toLowerCase() || prev.skinTone,

      facialHair:
        voiceFeatures.beard
          ? "fullBeard"
          : voiceFeatures.moustache
          ? "mustache"
          : "none",
    }));
  }, [voiceFeatures]);

  // Use values coming from SketchPage if available
  const [attributes, setAttributes] = useState(defaultAttributes);

  const handleSave = async () => {
    try {
      if (!canvasData?.canvasRef?.current) {
        alert("Canvas not ready. Please add components first.");
        return;
      }
      const canvas = canvasData.canvasRef.current;
      const link = document.createElement("a");
      link.download = `suspect_composite_${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save image. Please try again.");
    }
  };

  const handleGenerateAI = async () => {
    if (!canvasData?.items || canvasData.items.length === 0) {
      alert("Please add facial components to the canvas first.");
      return;
    }

    setLoading(true);
    setModal(null);

    try {
      const canvas = canvasData.canvasRef.current;
      const base64Image = canvas.toDataURL("image/png").split(",")[1];

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: "image/png", data: base64Image } },
              { type: "text", text: `Analyze this facial composite sketch and provide:\n1. SUSPECT DESCRIPTION\n2. ENHANCEMENT SUGGESTIONS\n\nFormat as JSON:\n{\n  "description": "...",\n  "suggestions": ["...", "...", "..."]\n}` },
            ],
          }],
        }),
      });

      const data = await response.json();
      const text = data.content?.map(c => c.text || "").join("") || "";
      let parsed = { description: "", suggestions: [] };
      try {
        const clean = text.replace(/```json|```/g, "").trim();
        parsed = JSON.parse(clean);
      } catch {
        parsed = { description: text, suggestions: ["Could not parse suggestions."] };
      }
      setModal(parsed);
    } catch (err) {
      console.error("AI error:", err);
      setModal({ description: "Error connecting to AI service.", suggestions: [] });
    } finally {
      setLoading(false);
    }
  };

  const buildPrompt = () => {
    const parts = [];
    
    // Base - FRONT FACING FACE ONLY
    parts.push("front facing headshot portrait photograph");
    parts.push("face only, head and shoulders");
    parts.push("passport photo style");
    parts.push("no hands, no fingers, no body");
    
    // Gender
    if (attributes.gender !== "neutral") {
      parts.push(attributes.gender === "male" ? "male person" : "female person");
    } else {
      parts.push("person");
    }
    
    // Age
    const ageMap = {
      child: "child, young, 8-12 years old",
      teen: "teenager, adolescent, 13-17 years old",
      young: "young adult, 18-25 years old",
      adult: "adult, 26-45 years old",
      middle: "middle-aged, 46-60 years old",
      senior: "senior, elderly, 60+ years old"
    };
    parts.push(ageMap[attributes.age] || "adult");
    
    // Ethnicity
    const ethnicityMap = {
      diverse: "diverse features",
      asian: "Asian features, East Asian appearance",
      caucasian: "Caucasian features, European appearance",
      african: "African features, African descent",
      hispanic: "Hispanic features, Latin American appearance",
      middleEastern: "Middle Eastern features",
      indian: "Indian subcontinent features"
    };
    parts.push(ethnicityMap[attributes.ethnicity] || "");
    
    // Skin tone
    const skinMap = {
      veryFair: "very fair skin tone, pale complexion",
      fair: "fair skin tone, light complexion",
      medium: "medium skin tone",
      olive: "olive skin tone",
      tan: "tan skin tone",
      brown: "brown skin tone",
      dark: "dark skin tone, deep complexion"
    };
    parts.push(skinMap[attributes.skinTone] || "");
    
    // Hair
    const hairColorMap = {
      black: "black hair",
      dark: "dark brown hair",
      brown: "brown hair",
      light: "light brown hair",
      blonde: "blonde hair",
      red: "red hair, ginger",
      gray: "gray hair",
      white: "white hair",
      bald: "bald, no hair"
    };
    parts.push(hairColorMap[attributes.hairColor] || "");
    
    const hairStyleMap = {
      bald: "completely bald",
      short: "short hair",
      medium: "medium length hair",
      long: "long hair",
      curly: "curly hair",
      wavy: "wavy hair",
      straight: "straight hair"
    };
    if (attributes.hairColor !== "bald") {
      parts.push(hairStyleMap[attributes.hairStyle] || "");
    }
    
    // Facial hair
    const facialHairMap = {
      none: "",
      stubble: "light stubble, 5 o'clock shadow",
      goatee: "goatee beard",
      fullBeard: "full beard",
      mustache: "mustache",
      beardMustache: "beard and mustache"
    };
    if (facialHairMap[attributes.facialHair]) {
      parts.push(facialHairMap[attributes.facialHair]);
    }
    
    // Eye color
    const eyeColorMap = {
      brown: "brown eyes",
      blue: "blue eyes",
      green: "green eyes",
      hazel: "hazel eyes",
      gray: "gray eyes",
      amber: "amber eyes"
    };
    parts.push(eyeColorMap[attributes.eyeColor] || "");
    
    // Distinctive features
    const scarsMap = {
      none: "",
      facial: "facial scar, scar on face",
      forehead: "scar on forehead",
      cheek: "scar on cheek",
      chin: "scar on chin"
    };
    if (scarsMap[attributes.scars]) {
      parts.push(scarsMap[attributes.scars]);
    }
    
    const birthmarksMap = {
      none: "",
      facial: "birthmark on face",
      forehead: "birthmark on forehead",
      cheek: "birthmark on cheek"
    };
    if (birthmarksMap[attributes.birthmarks]) {
      parts.push(birthmarksMap[attributes.birthmarks]);
    }
    
    const tattoosMap = {
      none: "",
      neck: "neck tattoo",
      face: "face tattoo",
      behind_ear: "tattoo behind ear"
    };
    if (tattoosMap[attributes.tattoos]) {
      parts.push(tattoosMap[attributes.tattoos]);
    }
    
    // Quality modifiers - EMPHASIS ON FRONT FACING
    parts.push("direct front view, looking at camera");
    parts.push("centered composition, symmetrical face");
    parts.push("professional mugshot style, passport photo");
    parts.push("neutral expression, serious face");
    parts.push("plain background, studio lighting");
    parts.push("highly detailed, photorealistic, 8k resolution, sharp focus, detailed skin texture");
    
    return parts.filter(Boolean).join(", ");
  };

  const buildNegativePrompt = () => {
    return "hands, fingers, arms, body, torso, shoulders visible, hand on face, touching face, gestures, side view, profile, three-quarter view, tilted head, looking away, cartoon, anime, sketch, drawing, painting, illustration, low quality, blurry, distorted, deformed, ugly, bad anatomy, duplicate, disfigured, extra limbs, watermark, text, cropped face";
  };

  const handleEnhanceSketch = async () => {
    if (!canvasData?.items || canvasData.items.length === 0) {
      alert("Please add facial components to the canvas first.");
      return;
    }

    setEnhancing(true);
    setEnhancedImage(null);

    try {
      const canvas = canvasData.canvasRef.current;
      const base64Image = canvas.toDataURL("image/png").split(",")[1];
      console.log("Sending image:", base64Image);
      console.log("Image length:", base64Image?.length);

      const layerData = canvasData.items.map(item => ({
        src: item.src,
        x: Math.round(item.x),
        y: Math.round(item.y),
        width: Math.round(item.size),
        height: Math.round(item.size),
        opacity: item.opacity,
        blendMode: item.blendMode,
        zIndex: item.zIndex,
      }));

      const customPrompt = buildPrompt();
      const negativePrompt = buildNegativePrompt();

      console.log('[FRONTEND] Custom prompt:', customPrompt);
      console.log('[FRONTEND] Calling backend API:', `${API_URL}/enhance-sketch`);

      const response = await fetch(`${API_URL}/enhance-sketch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalSketch: base64Image,
          layers: layerData,
          canvasWidth: canvasData.canvasWidth,
          canvasHeight: canvasData.canvasHeight,
          prompt: customPrompt,
          negativePrompt: negativePrompt,
        }),
      });

      console.log('[FRONTEND] Response status:', response.status);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Enhancement failed");
      }

      const result = await response.json();
      console.log('[FRONTEND] Enhancement successful!');
      
      setEnhancedImage(result.enhancedImage);
      
      setModal({
        description: `Sketch enhanced with attributes: ${JSON.stringify(attributes, null, 2)}`,
        suggestions: ["Download the enhanced image to use in your investigation."],
        enhanced: true,
      });

    } catch (err) {
      console.error("[FRONTEND] Enhancement error:", err);
      alert(`Failed to enhance sketch: ${err.message}\n\nMake sure the backend server is running.`);
    } finally {
      setEnhancing(false);
    }
  };

  const handleDownloadEnhanced = () => {
    if (!enhancedImage) return;
    const link = document.createElement("a");
    link.download = `enhanced_suspect_${Date.now()}.png`;
    link.href = `data:image/png;base64,${enhancedImage}`;
    link.click();
  };

  return (
    <>
      {/* Attribute Controls */}
      <div style={styles.attributesPanel}>
        <div style={styles.panelHeader} onClick={() => setShowAdvanced(!showAdvanced)}>
          <span style={styles.panelTitle}>⚙️ FACIAL ATTRIBUTES</span>
          <span style={styles.toggleIcon}>{showAdvanced ? "▼" : "▶"}</span>
        </div>
        
        {showAdvanced && (
          <div style={styles.attributesGrid}>
            
            {/* Gender */}
            <div style={styles.attrGroup}>
              <label style={styles.attrLabel}>GENDER</label>
              <select value={attributes.gender} onChange={(e) => setAttributes({...attributes, gender: e.target.value})} style={styles.attrSelect}>
                <option value="neutral">Neutral</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            {/* Age */}
            <div style={styles.attrGroup}>
              <label style={styles.attrLabel}>AGE GROUP</label>
              <select value={attributes.age} onChange={(e) => setAttributes({...attributes, age: e.target.value})} style={styles.attrSelect}>
                <option value="child">Child (8-12)</option>
                <option value="teen">Teen (13-17)</option>
                <option value="young">Young Adult (18-25)</option>
                <option value="adult">Adult (26-45)</option>
                <option value="middle">Middle-aged (46-60)</option>
                <option value="senior">Senior (60+)</option>
              </select>
            </div>

            {/* Ethnicity */}
            <div style={styles.attrGroup}>
              <label style={styles.attrLabel}>ETHNICITY</label>
              <select value={attributes.ethnicity} onChange={(e) => setAttributes({...attributes, ethnicity: e.target.value})} style={styles.attrSelect}>
                <option value="diverse">Diverse</option>
                <option value="asian">Asian</option>
                <option value="caucasian">Caucasian</option>
                <option value="african">African</option>
                <option value="hispanic">Hispanic</option>
                <option value="middleEastern">Middle Eastern</option>
                <option value="indian">Indian</option>
              </select>
            </div>

            {/* Skin Tone */}
            <div style={styles.attrGroup}>
              <label style={styles.attrLabel}>SKIN TONE</label>
              <select value={attributes.skinTone} onChange={(e) => setAttributes({...attributes, skinTone: e.target.value})} style={styles.attrSelect}>
                <option value="veryFair">Very Fair</option>
                <option value="fair">Fair</option>
                <option value="medium">Medium</option>
                <option value="olive">Olive</option>
                <option value="tan">Tan</option>
                <option value="brown">Brown</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            {/* Hair Color */}
            <div style={styles.attrGroup}>
              <label style={styles.attrLabel}>HAIR COLOR</label>
              <select value={attributes.hairColor} onChange={(e) => setAttributes({...attributes, hairColor: e.target.value})} style={styles.attrSelect}>
                <option value="black">Black</option>
                <option value="dark">Dark Brown</option>
                <option value="brown">Brown</option>
                <option value="light">Light Brown</option>
                <option value="blonde">Blonde</option>
                <option value="red">Red/Ginger</option>
                <option value="gray">Gray</option>
                <option value="white">White</option>
                <option value="bald">Bald</option>
              </select>
            </div>

            {/* Hair Style */}
            {attributes.hairColor !== "bald" && (
              <div style={styles.attrGroup}>
                <label style={styles.attrLabel}>HAIR STYLE</label>
                <select value={attributes.hairStyle} onChange={(e) => setAttributes({...attributes, hairStyle: e.target.value})} style={styles.attrSelect}>
                  <option value="short">Short</option>
                  <option value="medium">Medium</option>
                  <option value="long">Long</option>
                  <option value="curly">Curly</option>
                  <option value="wavy">Wavy</option>
                  <option value="straight">Straight</option>
                </select>
              </div>
            )}

            {/* Facial Hair */}
            <div style={styles.attrGroup}>
              <label style={styles.attrLabel}>FACIAL HAIR</label>
              <select value={attributes.facialHair} onChange={(e) => setAttributes({...attributes, facialHair: e.target.value})} style={styles.attrSelect}>
                <option value="none">None</option>
                <option value="stubble">Stubble</option>
                <option value="goatee">Goatee</option>
                <option value="fullBeard">Full Beard</option>
                <option value="mustache">Mustache</option>
                <option value="beardMustache">Beard + Mustache</option>
              </select>
            </div>

            {/* Eye Color */}
            <div style={styles.attrGroup}>
              <label style={styles.attrLabel}>EYE COLOR</label>
              <select value={attributes.eyeColor} onChange={(e) => setAttributes({...attributes, eyeColor: e.target.value})} style={styles.attrSelect}>
                <option value="brown">Brown</option>
                <option value="blue">Blue</option>
                <option value="green">Green</option>
                <option value="hazel">Hazel</option>
                <option value="gray">Gray</option>
                <option value="amber">Amber</option>
              </select>
            </div>

            {/* Scars */}
            <div style={styles.attrGroup}>
              <label style={styles.attrLabel}>SCARS</label>
              <select value={attributes.scars} onChange={(e) => setAttributes({...attributes, scars: e.target.value})} style={styles.attrSelect}>
                <option value="none">None</option>
                <option value="facial">Facial Scar</option>
                <option value="forehead">Forehead Scar</option>
                <option value="cheek">Cheek Scar</option>
                <option value="chin">Chin Scar</option>
              </select>
            </div>

            {/* Birthmarks */}
            <div style={styles.attrGroup}>
              <label style={styles.attrLabel}>BIRTHMARKS</label>
              <select value={attributes.birthmarks} onChange={(e) => setAttributes({...attributes, birthmarks: e.target.value})} style={styles.attrSelect}>
                <option value="none">None</option>
                <option value="facial">Facial Birthmark</option>
                <option value="forehead">Forehead Birthmark</option>
                <option value="cheek">Cheek Birthmark</option>
              </select>
            </div>

            {/* Tattoos */}
            <div style={styles.attrGroup}>
              <label style={styles.attrLabel}>TATTOOS</label>
              <select value={attributes.tattoos} onChange={(e) => setAttributes({...attributes, tattoos: e.target.value})} style={styles.attrSelect}>
                <option value="none">None</option>
                <option value="neck">Neck Tattoo</option>
                <option value="face">Face Tattoo</option>
                <option value="behind_ear">Behind Ear</option>
              </select>
            </div>

          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={styles.row}>
        <button style={{ ...styles.btn, ...styles.btnBlue }} onClick={handleGenerateAI} disabled={loading}>
          {loading ? <span style={styles.loadingInner}><span style={styles.spinner} /> ANALYZING...</span> : "◈ AI ANALYSIS"}
        </button>

        <button style={{ ...styles.btn, ...styles.btnPurple }} onClick={handleEnhanceSketch} disabled={enhancing}>
          {enhancing ? <span style={styles.loadingInner}><span style={styles.spinner} /> ENHANCING...</span> : "✨ ENHANCE TO PHOTO"}
        </button>

        <button style={{ ...styles.btn, ...styles.btnAmber }} onClick={handleSave}>
          ↓ SAVE SKETCH
        </button>

        <button style={{ ...styles.btn, ...styles.btnGreen }}>
          ✓ SUBMIT TO CASE
        </button>
      </div>

      {/* Coordinates Display */}
      {canvasData?.items && canvasData.items.length > 0 && (
        <details style={styles.coordsPanel}>
          <summary style={styles.coordsSummary}>
            📊 LAYER COORDINATES ({canvasData.items.length} layers)
          </summary>
          <div style={styles.coordsContent}>
            {canvasData.items.map((item, idx) => (
              <div key={item.id} style={styles.coordsRow}>
                <span style={styles.coordsLabel}>Layer {idx + 1}:</span>
                <span style={styles.coordsValue}>
                  X:{Math.round(item.x)} Y:{Math.round(item.y)} Size:{Math.round(item.size)} 
                  Opacity:{Math.round(item.opacity * 100)}% Blend:{item.blendMode} Z:{item.zIndex}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Modal */}
      {modal && (
        <div style={styles.overlay} onClick={() => setModal(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalTitle}>
                <span style={styles.modalDot} />
                {modal.enhanced ? "ENHANCED IMAGE" : "AI FORENSIC ANALYSIS"}
              </div>
              <button style={styles.closeBtn} onClick={() => setModal(null)}>✕</button>
            </div>

            {modal.enhanced && enhancedImage && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>ENHANCED PHOTO</div>
                <div style={styles.imagePreview}>
                  <img src={`data:image/png;base64,${enhancedImage}`} alt="Enhanced" style={{ maxWidth: "100%", borderRadius: "4px" }} />
                </div>
              </div>
            )}

            <div style={styles.section}>
              <div style={styles.sectionLabel}>{modal.enhanced ? "DETAILS" : "SUSPECT DESCRIPTION"}</div>
              <div style={styles.descriptionBox}>{modal.description}</div>
            </div>

            {modal.suggestions?.length > 0 && (
              <div style={styles.section}>
                <div style={styles.sectionLabel}>{modal.enhanced ? "RECOMMENDATIONS" : "ENHANCEMENT SUGGESTIONS"}</div>
                <div style={styles.suggestionList}>
                  {modal.suggestions.map((s, i) => (
                    <div key={i} style={styles.suggestionItem}>
                      <span style={styles.suggestionNum}>{i + 1}</span>
                      <span style={styles.suggestionText}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={styles.modalFooter}>
              {modal.enhanced && enhancedImage ? (
                <>
                  <button style={{ ...styles.btn, ...styles.btnAmber, flex: 1 }} onClick={handleDownloadEnhanced}>
                    ↓ DOWNLOAD ENHANCED
                  </button>
                  <button style={{ ...styles.btn, ...styles.btnGreen, flex: 1 }}>✓ SAVE TO CASE</button>
                </>
              ) : (
                <>
                  <button style={{ ...styles.btn, ...styles.btnAmber, flex: 1 }} onClick={handleSave}>↓ SAVE SKETCH</button>
                  <button style={{ ...styles.btn, ...styles.btnBlue, flex: 1 }} onClick={handleGenerateAI} disabled={loading}>↺ RE-ANALYZE</button>
                </>
              )}
              <button style={{ ...styles.btn, flex: 1 }} onClick={() => setModal(null)}>CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const styles = {
  attributesPanel: { marginBottom: "12px", background: "#080c10", border: "1px solid #1e2d3d", borderRadius: "4px", overflow: "hidden" },
  panelHeader: { padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", userSelect: "none", background: "#0c1118" },
  panelTitle: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#6b8ca8", letterSpacing: "2px", fontWeight: "700" },
  toggleIcon: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#3a5570" },
  attributesGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px", padding: "14px" },
  attrGroup: { display: "flex", flexDirection: "column", gap: "4px" },
  attrLabel: { fontFamily: "var(--font-mono)", fontSize: "8px", color: "#3a5570", letterSpacing: "1.5px", textTransform: "uppercase" },
  attrSelect: { padding: "6px 8px", background: "#0c1118", border: "1px solid #1e2d3d", borderRadius: "3px", color: "#d4e8f5", fontFamily: "var(--font-mono)", fontSize: "10px", cursor: "pointer", outline: "none" },
  row: { display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "12px" },
  btn: { flex: 1, padding: "10px 14px", border: "1px solid #1e2d3d", borderRadius: "4px", background: "transparent", color: "#6b8ca8", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "1px", cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap" },
  btnBlue: { background: "rgba(33,150,243,0.1)", borderColor: "rgba(33,150,243,0.35)", color: "#2196f3" },
  btnPurple: { background: "rgba(156,39,176,0.1)", borderColor: "rgba(156,39,176,0.35)", color: "#9c27b0" },
  btnAmber: { background: "rgba(245,166,35,0.1)", borderColor: "rgba(245,166,35,0.35)", color: "#f5a623" },
  btnGreen: { background: "rgba(0,229,160,0.1)", borderColor: "rgba(0,229,160,0.35)", color: "#00e5a0" },
  loadingInner: { display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" },
  spinner: { display: "inline-block", width: "12px", height: "12px", border: "2px solid rgba(33,150,243,0.3)", borderTopColor: "#2196f3", borderRadius: "50%", animation: "spin 0.6s linear infinite" },
  coordsPanel: { marginTop: "12px", padding: "10px", background: "#080c10", border: "1px solid #1e2d3d", borderRadius: "4px" },
  coordsSummary: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#6b8ca8", letterSpacing: "1px", cursor: "pointer", userSelect: "none" },
  coordsContent: { marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" },
  coordsRow: { display: "flex", gap: "8px", padding: "6px 8px", background: "#0c1118", borderRadius: "3px", border: "1px solid #1e2d3d" },
  coordsLabel: { fontFamily: "var(--font-mono)", fontSize: "9px", color: "#3a5570", minWidth: "60px" },
  coordsValue: { fontFamily: "var(--font-mono)", fontSize: "9px", color: "#2196f3", flex: 1 },
  overlay: { position: "fixed", inset: 0, background: "rgba(4,6,8,0.85)", backdropFilter: "blur(4px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px", animation: "fadeUp 0.3s ease-out" },
  modal: { width: "100%", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto", background: "#0c1118", border: "1px solid #2e4a66", borderRadius: "8px", boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px #1e2d3d" },
  modalHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #1e2d3d", background: "#080c10" },
  modalTitle: { display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-display)", fontSize: "14px", fontWeight: "700", letterSpacing: "3px", color: "#d4e8f5" },
  modalDot: { width: "8px", height: "8px", borderRadius: "50%", background: "#2196f3", animation: "pulse-amber 2s infinite" },
  closeBtn: { background: "transparent", border: "none", color: "#3a5570", fontSize: "16px", cursor: "pointer", fontFamily: "var(--font-mono)", transition: "color 0.2s", padding: "4px 8px" },
  section: { padding: "16px 20px", borderBottom: "1px solid #1e2d3d" },
  sectionLabel: { fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "3px", color: "#3a5570", marginBottom: "10px" },
  imagePreview: { background: "#080c10", border: "1px solid #1e2d3d", borderRadius: "4px", padding: "12px", display: "flex", justifyContent: "center" },
  descriptionBox: { fontFamily: "var(--font-body)", fontSize: "13px", color: "#d4e8f5", lineHeight: 1.8, background: "#080c10", border: "1px solid #1e2d3d", borderRadius: "4px", padding: "14px" },
  suggestionList: { display: "flex", flexDirection: "column", gap: "8px" },
  suggestionItem: { display: "flex", alignItems: "flex-start", gap: "12px", padding: "10px 14px", background: "#080c10", border: "1px solid #1e2d3d", borderRadius: "4px", borderLeft: "3px solid rgba(245,166,35,0.4)" },
  suggestionNum: { fontFamily: "var(--font-mono)", fontSize: "11px", color: "#f5a623", fontWeight: "700", flexShrink: 0, lineHeight: 1.6 },
  suggestionText: { fontFamily: "var(--font-body)", fontSize: "13px", color: "#6b8ca8", lineHeight: 1.6 },
  modalFooter: { display: "flex", gap: "10px", padding: "16px 20px", background: "#080c10" },
};