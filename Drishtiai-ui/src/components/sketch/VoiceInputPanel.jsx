import { useEffect, useState } from "react";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { extractFeatures } from "../services/nlpParser";
import { mapFeaturesToImages } from "../services/componentMapper";
console.log("VOICE PANEL LOADED");
export default function VoiceInputPanel({
    onFeaturesExtracted
}) {
  console.log("PROP =", onFeaturesExtracted);
  const [text, setText] = useState("");
  const [recording, setRecording] = useState(false);
  const [features, setFeatures] = useState(null);
  const {
    transcript,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  useEffect(() => {
    setText(transcript);
  }, [transcript]);

  if (!browserSupportsSpeechRecognition) {
    return <p>Speech Recognition is not supported in this browser.</p>;
  }

  const toggleRecording = () => {
    if (!recording) {
      resetTranscript();

      SpeechRecognition.startListening({
        continuous: true,
        language: "en-US",
      });

      setRecording(true);
    } else {
      SpeechRecognition.stopListening();
      setRecording(false);
    }
  };

  return (
    <div style={styles.panel}>
      <div style={styles.section}>
        <label style={styles.label}>SUSPECT DESCRIPTION</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Describe suspect features..."
          style={styles.textarea}
        />
      </div>

      <button
        style={{
          ...styles.recordBtn,
          ...(recording ? styles.recordBtnActive : {}),
        }}
        onClick={toggleRecording}
      >
        <div style={{
          ...styles.recordDot,
          background: recording ? "#ff3b4e" : "#3a5570",
          animation: recording ? "blink 1s infinite" : "none",
        }} />
        {recording ? "STOP RECORDING" : "START RECORDING"}
      </button>
      <button
        style={{
          ...styles.recordBtn,
          marginTop: "8px",
        }}
        onClick={() => {
          resetTranscript();
          setText("");
        }}
      >
        CLEAR TRANSCRIPT
      </button>
      <button
          style={{
              ...styles.recordBtn,
              marginTop: "8px",
              borderColor: "#00ffc3",
              color: "#00ffc3",
          }}
          onClick={() => {
            console.log("APPLY NLP clicked");

            console.log("Transcript:", text);

            const result = extractFeatures(text);
            const mappedImages = mapFeaturesToImages(result);

            console.log(
                "Mapped Images:",
                JSON.stringify(mappedImages, null, 2)
            );

            console.log("Result:", JSON.stringify(result, null, 2));

            setFeatures(result);

            console.log("Callback =", onFeaturesExtracted);

            if (onFeaturesExtracted) {
                console.log("Sending features to SketchBuilder...");
                onFeaturesExtracted(result);
            }
          }}
      >
          APPLY NLP
      </button>

      {recording && (
        <div style={styles.recordingIndicator}>
          <div style={styles.waveBar} />
          <div
            style={{
              ...styles.waveBar,
              animationDelay: "0.15s",
              height: "14px",
            }}
          />
          <div
            style={{
              ...styles.waveBar,
              animationDelay: "0.3s",
              height: "20px",
            }}
          />
          <div
            style={{
              ...styles.waveBar,
              animationDelay: "0.45s",
              height: "12px",
            }}
          />
          <div
            style={{
              ...styles.waveBar,
              animationDelay: "0.6s",
              height: "18px",
            }}
          />
          <span style={styles.recordingText}>LISTENING...</span>
        </div>
      )}

      {features && (
        <div
          style={{
            marginTop: "15px",
            border: "1px solid #00ffc3",
            borderRadius: "6px",
            padding: "10px",
            background: "#081017",
            color: "#d4e8f5",
          }}
        >
          <h4 style={{ color: "#00ffc3" }}>Extracted Features</h4>

          <p>Gender : {features.gender}</p>
          <p>Age : {features.age}</p>
          <p>Hair Color : {features.hairColor}</p>
          <p>Hair Length : {features.hairLength}</p>
          <p>Beard : {features.beard ? "Yes" : "No"}</p>
          <p>Moustache : {features.moustache ? "Yes" : "No"}</p>
          <p>Glasses : {features.glasses ? "Yes" : "No"}</p>
          <p>Eye Color : {features.eyeColor}</p>
          <p>Face Shape : {features.faceShape}</p>
          <p>Skin Tone : {features.skinTone}</p>
          <p>Clothing : {features.clothing}</p>
        </div>
      )}
    </div>
  );
}

const styles = {
  panel: {
    padding: "14px",
  },
  section: {
    marginBottom: "12px",
  },
  label: {
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    letterSpacing: "2px",
    color: "#3a5570",
    display: "block",
    marginBottom: "8px",
  },
  textarea: {
    width: "100%",
    height: "90px",
    background: "#080c10",
    border: "1px solid #1e2d3d",
    borderRadius: "4px",
    color: "#d4e8f5",
    fontFamily: "var(--font-body)",
    fontSize: "13px",
    padding: "10px",
    resize: "vertical",
    outline: "none",
    lineHeight: 1.6,
  },
  recordBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
    padding: "10px 14px",
    background: "transparent",
    border: "1px solid #1e2d3d",
    borderRadius: "4px",
    color: "#6b8ca8",
    fontFamily: "var(--font-display)",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "2px",
    cursor: "pointer",
    transition: "all 0.2s",
    marginBottom: "10px",
  },
  recordBtnActive: {
    borderColor: "rgba(255,59,78,0.4)",
    color: "#ff3b4e",
    background: "rgba(255,59,78,0.05)",
  },
  recordDot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  recordingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
    padding: "8px 10px",
    background: "rgba(255,59,78,0.05)",
    border: "1px solid rgba(255,59,78,0.2)",
    borderRadius: "4px",
  },
  waveBar: {
    width: "3px",
    height: "10px",
    background: "#ff3b4e",
    borderRadius: "2px",
    animation: "blink 0.8s ease-in-out infinite",
  },
  recordingText: {
    fontFamily: "var(--font-mono)",
    fontSize: "10px",
    color: "#ff3b4e",
    letterSpacing: "2px",
    marginLeft: "4px",
  },
};
