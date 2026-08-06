import { useState } from "react";
import FacialComponentsPanel from "../components/sketch/FacialComponentsPanel";
import CanvasArea from "../components/sketch/CanvasArea";
import VoiceInputPanel from "../components/sketch/VoiceInputPanel";
import ActionButtons from "../components/sketch/ActionButtons";
import Navbar from "../components/Navbar";
import VoiceInput from "../components/VoiceInput";
import { mapFeaturesToImages } from "../components/services/componentMapper";

export default function SketchBuilder() {
  console.log("THIS SketchBuilder IS RUNNING");
  const [voiceFeatures, setVoiceFeatures] = useState(null);
  const [autoComponents, setAutoComponents] = useState(null);
  console.log("SketchBuilder autoComponents =", autoComponents);
  console.log(voiceFeatures);
  const handleDragStart = (e, src) => {
    e.dataTransfer.setData("text/plain", src);
  };
  <Navbar></Navbar>

  return (
    <div className="container">
      <h1 className="title">DrishtiAI – Sketch Builder</h1>

      <div className="grid">
        <FacialComponentsPanel onDragStart={handleDragStart} />
        <CanvasArea autoComponents={autoComponents} />
        <VoiceInputPanel
            onFeaturesExtracted={(features) => {

                setVoiceFeatures(features);

                const mapped = mapFeaturesToImages(features);

                console.log("AUTO COMPONENTS", mapped);

                setAutoComponents(mapped);

            }}
        />
      </div>

      <ActionButtons />
    </div>
  );
}