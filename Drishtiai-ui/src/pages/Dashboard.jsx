import * as faceapi from "face-api.js";
import React, { useState, useEffect, useRef } from "react";
console.log("THIS DASHBOARD FILE IS RUNNING");
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";
import Database from "./Database";
console.log("DATABASE COMPONENT RENDERED");


// ─── DATA ───────────────────────────────────────────────
const RECENT_ALERTS = [
  { id: "ALT-2847", time: "14:33:21", camera: "CAM-07 · Gate B", type: "Motion Detected", severity: "HIGH" },
  { id: "ALT-2846", time: "14:29:05", camera: "CAM-12 · Lobby", type: "Face Recognized", severity: "MED" },
  { id: "ALT-2845", time: "14:11:48", camera: "CAM-03 · Parking", type: "Vehicle Loitering", severity: "HIGH" },
  { id: "ALT-2844", time: "13:55:12", camera: "CAM-19 · Roof", type: "Connection Lost", severity: "LOW" },
  { id: "ALT-2843", time: "13:42:30", camera: "CAM-02 · Corridor", type: "Motion Detected", severity: "MED" },
];

const ALL_CAMERAS = [
  { id: "CAM-01", location: "Main Entrance",  status: "online",  zone: "Entry",    fps: 30, res: "1080p" },
  { id: "CAM-02", location: "Corridor A",     status: "online",  zone: "Interior", fps: 25, res: "1080p" },
  { id: "CAM-03", location: "Parking Lot",    status: "online",  zone: "Exterior", fps: 30, res: "4K"    },
  { id: "CAM-04", location: "Server Room",    status: "online",  zone: "Secure",   fps: 15, res: "1080p" },
  { id: "CAM-05", location: "Roof Access",    status: "offline", zone: "Exterior", fps: 0,  res: "1080p" },
  { id: "CAM-06", location: "Reception",      status: "online",  zone: "Entry",    fps: 30, res: "720p"  },
  { id: "CAM-07", location: "Gate B",         status: "online",  zone: "Entry",    fps: 30, res: "4K"    },
  { id: "CAM-08", location: "Stairwell B",    status: "online",  zone: "Interior", fps: 25, res: "1080p" },
  { id: "CAM-09", location: "Loading Bay",    status: "online",  zone: "Exterior", fps: 30, res: "1080p" },
  { id: "CAM-10", location: "Canteen",        status: "offline", zone: "Interior", fps: 0,  res: "720p"  },
  { id: "CAM-11", location: "Fire Exit A",    status: "online",  zone: "Exit",     fps: 25, res: "1080p" },
  { id: "CAM-12", location: "Lobby",          status: "online",  zone: "Entry",    fps: 30, res: "4K"    },
];



const REPORTS = [
  { id: "RPT-081", title: "Weekly Incident Summary",   date: "2025-03-01", author: "ADMIN",   type: "Incident"  },
  { id: "RPT-080", title: "Camera Uptime Report",      date: "2025-02-28", author: "SYSTEM",  type: "System"    },
  { id: "RPT-079", title: "Suspect Composite — Gate B", date: "2025-02-27", author: "CHEN_J",  type: "Composite" },
  { id: "RPT-078", title: "Alert Escalation Log",      date: "2025-02-26", author: "ADMIN",   type: "Incident"  },
  { id: "RPT-077", title: "Monthly Statistics",        date: "2025-02-25", author: "SYSTEM",  type: "Analytics" },
];

const SEV_COLORS = {
  HIGH: { color: "#ff3b4e", bg: "rgba(255,59,78,0.12)",   border: "rgba(255,59,78,0.3)"   },
  MED:  { color: "#f5a623", bg: "rgba(245,166,35,0.10)",  border: "rgba(245,166,35,0.25)" },
  LOW:  { color: "#6b8ca8", bg: "rgba(107,140,168,0.10)", border: "rgba(107,140,168,0.2)" },
};

// ─── SUB-PAGES ───────────────────────────────────────────

function CamerasPage({ user }) {

  console.log("CamerasPage Loaded");

  const videoRef = useRef(null);

  const canvasRef = useRef(null);

  const lastMatchRef = useRef(0);   // ADD THIS


  const [databaseFaces, setDatabaseFaces] = useState([]);

  const [modelsLoaded, setModelsLoaded] = useState(false);



  // ==============================
  // LOAD MODELS + START CAMERA
  // ==============================

  useEffect(() => {

    let interval;

    const initializeSystem = async () => {

      try {

        const MODEL_URL = "/models";

        // LOAD MODELS
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);

        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);

        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);

        console.log("✅ Face Models Loaded");

        setModelsLoaded(true);



        // START CAMERA
        const stream =
          await navigator.mediaDevices.getUserMedia({
            video: {
              width: 1280,
              height: 720,
              facingMode: "user"
}
          });

        if (videoRef.current) {

          videoRef.current.srcObject = stream;

        }

        console.log("✅ Camera Started");



        // FETCH DATABASE
        const res =
          await fetch(
            "http://localhost:3001/api/sketches"
          );

        const data = await res.json();

        console.log("DATABASE RECORDS:", data);



        // GENERATE DESCRIPTORS
        for (const rec of data) {

          try {
              if (!rec.generatedImagePath) continue;

              const img = new Image();
              img.crossOrigin = "anonymous";
              img.src =
                `http://localhost:3001${rec.generatedImagePath}`;
           
            await new Promise((resolve, reject) => {

              img.onload = resolve;

              img.onerror = reject;

            });

            // FACE DETECTION
            const detection =
              await faceapi
                .detectSingleFace(
                  img,
                  new faceapi.TinyFaceDetectorOptions()
                )
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detection) {

              rec.faceDescriptor =
                Array.from(detection.descriptor);

              console.log(
                "✅ Descriptor Generated:",
                rec._id,
                 "Length:",
                detection.descriptor.length
              );

            }

          } catch (err) {

            console.log(
              "❌ Bad Record:",
              rec._id
            );

          }

        }

        setDatabaseFaces(data);
         console.log(
        "Loaded descriptors:",
        data.map(x => ({
          id: x._id,
          len: x.faceDescriptor?.length
        }))
      );


        // LIVE DETECTION LOOP
        interval = setInterval(() => {

          detectLiveFace(data);

        }, 3000);

      } catch (err) {

        console.error(err);

      }

    };

    initializeSystem();



    // CLEANUP
    return () => {

      clearInterval(interval);

    };

  }, []);




  // ==============================
  // LIVE FACE DETECTION
  // ==============================

  const detectLiveFace = async (faces) => {
  try {

    if (!videoRef.current) return;

    const detections =
      await faceapi
        .detectAllFaces(
          videoRef.current,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: 512,
            scoreThreshold: 0.3,
          })
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

    if (!detections.length) {
      console.log("No Face Found");
      return;
    }

    const detection = detections[0];

    console.log("✅ LIVE FACE DETECTED");

    let bestMatch = null;
    let bestDistance = 999;

    faces.forEach((rec) => {

      if (
        !rec.faceDescriptor ||
        !Array.isArray(rec.faceDescriptor) ||
        rec.faceDescriptor.length !== detection.descriptor.length
      ) {
        console.log(
          "Skipping record:",
          rec.caseId || rec._id
        );
        return;
      }

      try {

        const dbDescriptor =
          new Float32Array(rec.faceDescriptor);

        const distance =
          faceapi.euclideanDistance(
            detection.descriptor,
            dbDescriptor
          );

        if (distance < bestDistance) {
          bestDistance = distance;
          bestMatch = rec;
        }

      } catch (err) {

        console.log(
          "Descriptor comparison failed",
          rec._id
        );

      }

    });

    if (
      bestMatch &&
      bestDistance < 0.6
    ) {

      const now = Date.now();

      if (now - lastMatchRef.current < 15000) {
        return;
      }

      lastMatchRef.current = now;

      try {

        const response = await fetch(
          "http://localhost:3001/api/send-alert",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              caseId: bestMatch.caseId,
              alertEmail: bestMatch.alertEmail,

              originalSketchPath:
                bestMatch.originalSketchPath,

              generatedImagePath:
                bestMatch.generatedImagePath,
            }),
          }
        );

        const result = await response.json();

        console.log("📧 Email Response:", result);

      } catch (emailError) {

        console.error(
          "❌ Email Send Failed:",
          emailError
        );

      }

      alert(
        `🚨 MATCH FOUND

    Case ID: ${
          bestMatch.caseId || bestMatch._id
        }`
      );

      console.log("🚨 MATCH FOUND");
      console.log(bestMatch);

    } else {

      console.log("✅ No Match");

    }
   } catch (err) {

    console.error(err);

  }

};

  // ==============================
  // MANUAL CAPTURE BUTTON
  // ==============================

  const captureFrame = async () => {

    try {

      if (!videoRef.current) return;

      const canvas =
        document.createElement("canvas");

      canvas.width =
        videoRef.current.videoWidth;

      canvas.height =
        videoRef.current.videoHeight;

      const ctx =
        canvas.getContext("2d");

      ctx.drawImage(
        videoRef.current,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const image =
        canvas.toDataURL("image/jpeg");

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = image;

      img.onload = async () => {

        const detection =
          await faceapi
            .detectSingleFace(
              img,
              new faceapi.TinyFaceDetectorOptions()
            )
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {

          alert("❌ No Face Detected");

          return;

        }

        let bestMatch = null;

        let bestDistance = 999;

        databaseFaces.forEach((rec) => {

        if (
          !rec.faceDescriptor ||
          !Array.isArray(rec.faceDescriptor) ||
          rec.faceDescriptor.length !== detection.descriptor.length
        ) {
          return;
        }

        const distance =
          faceapi.euclideanDistance(
            detection.descriptor,
            new Float32Array(rec.faceDescriptor)
          );

          if (distance < bestDistance) {

            bestDistance = distance;

            bestMatch = rec;

          }

        });



        if (
          bestMatch &&
          bestDistance < 0.6
        ) {
          alert(
            `🚨 Criminal Match Found\nID: ${bestMatch._id}`
          );
        } else {
          alert("✅ No Match Found");
        }

      };

    } catch (err) {

      console.error(err);

    }

  };




  // ==============================
  // UI
  // ==============================

  return (

    <div style={styles.page}>

      <div style={styles.subHeader}>

        <div>

          <div style={styles.pageTitle}>
            Camera Management
          </div>

          <div style={styles.pageSubtitle}>
            Live Face Detection System
          </div>

        </div>

      </div>



      <div
        style={{
          background: "#081018",
          border: "1px solid #13202c",
          borderRadius: "12px",
          padding: "20px",
          marginBottom: "25px",
        }}
      >

        <h3
          style={{
            color: "#00e5a0",
            marginBottom: "15px",
          }}
        >
          LIVE CAMERA FEED
        </h3>



        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            maxWidth: "500px",
            borderRadius: "10px",
            border: "2px solid #00e5a0",
            background: "#000",
          }}
        />



        <canvas
          ref={canvasRef}
          style={{ display: "none" }}
        />



        <div style={{ marginTop: "15px" }}>

          <button
            onClick={captureFrame}
            style={{
              padding: "12px 24px",
              background: "#00e5a0",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Detect Face
          </button>

        </div>

      </div>

    </div>

  );

}

function AlertsPage({ user }) {
  const [filter, setFilter] = useState("ALL");
  const filters = ["ALL", "HIGH", "MED", "LOW"];
  const filtered = filter === "ALL" ? RECENT_ALERTS : RECENT_ALERTS.filter(a => a.severity === filter);

  return (
    <div>
      <div style={styles.subHeader}>
        <div>
          <div style={styles.pageTitle}>Alert Management</div>
          <div style={styles.pageSubtitle}>{RECENT_ALERTS.length} active alerts</div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          {filters.map(f => (
            <button
              key={f}
              style={{
                ...styles.filterBtn,
                ...(filter === f ? styles.filterBtnActive : {}),
              }}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {filtered.map((alert, i) => {
          const sev = SEV_COLORS[alert.severity];
          return (
            <div key={alert.id} style={{ ...styles.alertCard, borderLeftColor: sev.color, animationDelay: `${i * 0.07}s` }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                  <span style={styles.monoText}>{alert.id}</span>
                  <span style={{ ...styles.statusBadge, color: sev.color, background: sev.bg, border: `1px solid ${sev.border}` }}>
                    {alert.severity}
                  </span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: "600", color: "#d4e8f5" }}>
                    {alert.type}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "24px" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#6b8ca8" }}>📍 {alert.camera}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#3a5570" }}>🕐 {alert.time}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button style={styles.tblBtn}>DETAILS</button>
                {user.role === "admin" && (
                  <button style={{ ...styles.tblBtn, color: "#00e5a0", borderColor: "rgba(0,229,160,0.3)" }}>RESOLVE</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DatabasePage() {
  const role = localStorage.getItem("role");
  console.log("ROLE =", role);

  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    fetch("http://localhost:3001/api/sketches")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setRecords(data);
      })
      .catch((err) => console.error(err));
  }, []);
  const deleteCase = async (id) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:3001/api/sketches/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Delete failed");
      }

      setRecords(prev =>
        prev.filter(record => record._id !== id)
      );

      alert("Case deleted successfully");

    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div>

      {/* HEADER */}
      <div style={styles.subHeader}>
        <div>
          <div style={styles.pageTitle}>Case Database</div>

          <div style={styles.pageSubtitle}>
            {records.length} records · submitted composites
          </div>
        </div>

        <button style={styles.actionBtn}>
          ⊞ EXPORT
        </button>
      </div>

      {/* TABLE */}
      <div style={styles.tableWrap}>

        <table style={styles.table}>

          {/* TABLE HEAD */}
          <thead>
            <tr>
              {[
                "Record ID",
                "Subject",
                "Case ID",
                "Date",
                "Status",
                "Images",
                "Actions"
              ].map(h => (
                <th key={h} style={styles.th}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          {/* TABLE BODY */}
          <tbody>

            {records.map((rec, i) => (

              <tr
                key={rec._id}
                style={{
                  ...styles.tr,
                  animationDelay: `${i * 0.05}s`
                }}
              >

                {/* RECORD ID */}
                <td style={styles.td}>
                  <span style={styles.monoText}>
                    REC-{String(i + 1).padStart(3, "0")}
                  </span>
                </td>

                {/* SUBJECT */}
                <td style={styles.td}>
                  Unknown Male, ~30yr
                </td>

                {/* CASE ID */}
                <td style={styles.td}>
                  <span style={styles.monoText}>
                    CASE-{rec._id.slice(-6)}
                  </span>
                </td>

                {/* DATE */}
                <td style={styles.td}>
                  <span style={styles.monoText}>
                    {new Date(rec.createdAt).toLocaleDateString()}
                  </span>
                </td>

                {/* STATUS */}
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.statusBadge,
                      color: "#00ffc3",
                      background: "rgba(0,255,195,0.1)",
                      border: "1px solid rgba(0,255,195,0.3)"
                    }}
                  >
                    SUBMITTED
                  </span>
                </td>

                {/* IMAGES */}
                <td style={styles.td}>

                  <div style={{
                    display: "flex",
                    gap: "8px"
                  }}>

                    {rec.originalSketchPath && (
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        background: "rgba(0,255,200,0.1)",
                        color: "#00ffc3",
                        fontSize: "10px",
                        border: "1px solid rgba(0,255,200,0.3)"
                      }}>
                        🖼 SKETCH
                      </span>
                    )}

                    {rec.generatedImagePath && (
                      <span style={{
                        padding: "4px 8px",
                        borderRadius: "6px",
                        background: "rgba(200,0,255,0.1)",
                        color: "#d26cff",
                        fontSize: "10px",
                        border: "1px solid rgba(200,0,255,0.3)"
                      }}>
                        ✦ AI FACE
                      </span>
                    )}

                  </div>

                </td>

                {/* ACTIONS */}
                <td style={styles.td}>

                  <button
                    style={{
                      padding: "6px 12px",
                      background: "transparent",
                      border: "1px solid #00ffc3",
                      color: "#00ffc3",
                      cursor: "pointer",
                      borderRadius: "4px",
                      marginRight: "10px"
                    }}
                    onClick={() => setSelectedRecord(rec)}
                  >
                    VIEW
                  </button>

                  {role === "admin" && (
                    <button
                      style={{
                      padding: "6px 12px",
                      background: "transparent",
                      border: "1px solid red",
                      color: "red",
                      cursor: "pointer",
                      borderRadius: "4px"
                      }}
                      onClick={() => deleteCase(rec._id)}
                    >
                      DELETE
                    </button>
                  )}

                </td>

              </tr>

            ))}

          </tbody>

                </table>

      </div>

      {/* MODAL */}
      {selectedRecord && (

        <div style={styles.modalOverlay}>

          <div style={styles.modalBox}>

            <h2 style={{ color: "#00ffc3" }}>
              Case Details
            </h2>

            <div style={styles.modalImages}>

              {/* SKETCH */}
              <div>

                <h4 style={{ color: "#00ffc3" }}>
                  Composite Sketch
                </h4>

               <img
                src={`http://localhost:3001${selectedRecord.originalSketchPath}`}
                alt="Sketch"
                style={styles.modalImage}
              />

              </div>

              {/* AI FACE */}
              <div>

                <h4 style={{ color: "#d26cff" }}>
                  Enhanced AI Face
                </h4>

                <img
                  src={`http://localhost:3001${selectedRecord.generatedImagePath}`}
                  alt="AI Face"
                  style={styles.modalImage}
                />

              </div>

            </div>

            <button
              style={styles.closeBtn}
              onClick={() => setSelectedRecord(null)}
            >
              CLOSE
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

function ReportsPage() {
  const typeColors = {
    Incident:  "#ff3b4e",
    System:    "#6b8ca8",
    Composite: "#00e5a0",
    Analytics: "#2196f3",
  };
  return (
    <div>
      <div style={styles.subHeader}>
        <div>
          <div style={styles.pageTitle}>Reports</div>
          <div style={styles.pageSubtitle}>{REPORTS.length} reports available</div>
        </div>
        <button style={styles.actionBtn}>+ NEW REPORT</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {REPORTS.map((rpt, i) => (
          <div key={rpt.id} style={{ ...styles.alertCard, borderLeftColor: typeColors[rpt.type] || "#3a5570", animationDelay: `${i * 0.07}s` }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                <span style={styles.monoText}>{rpt.id}</span>
                <span style={{ ...styles.statusBadge, color: typeColors[rpt.type], background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.08)` }}>
                  {rpt.type.toUpperCase()}
                </span>
              </div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "15px", fontWeight: "600", color: "#d4e8f5", marginBottom: "6px" }}>
                {rpt.title}
              </div>
              <div style={{ display: "flex", gap: "20px" }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#3a5570" }}>by {rpt.author}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "#3a5570" }}>{rpt.date}</span>
              </div>
            </div>
            <button style={styles.tblBtn}>DOWNLOAD</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── OVERVIEW (original dashboard content) ───────────────
function OverviewPage({ user }) {
  return (
    <div>
      <div style={styles.statsGrid}>
        <StatCard label="Active Cameras" value={24} icon="◉" accent="green" live={true} trend="up" trendValue="+2 since 06:00" subtitle="2 offline" delay={0} />
        <StatCard label="Active Alerts"  value={7}  icon="⚠" accent="red"   live={true} trend="up" trendValue="+3 in last hour" subtitle="3 HIGH severity" delay={100} />
        <StatCard label="Database Records" value={148392} unit="rec" icon="⊟" accent="amber" trend="up" trendValue="+1,204 today" subtitle="Last sync 2m ago" delay={200} />
        <StatCard label="Footage Stored" value={2847} unit="GB" icon="⊞" accent="blue" trend="up" trendValue="+12 GB today" subtitle="81% capacity" delay={300} />
      </div>

      <div style={styles.mainGrid}>
        {/* Camera feeds */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div style={styles.panelTitle}><span style={styles.panelDot} /> LIVE FEEDS</div>
            <button style={styles.panelAction}>VIEW ALL →</button>
          </div>
          <div style={styles.cameraGrid}>
            {ALL_CAMERAS.slice(0, 6).map((cam, i) => (
              <div key={cam.id} style={{ ...styles.camCell, animationDelay: `${i * 0.1}s` }}>
                <div style={styles.camScreen}>
                  <div style={styles.camScanline} />
                  {cam.status === "offline" ? (
                    <div style={styles.camOffline}>NO SIGNAL</div>
                  ) : (
                    <>
                      <div style={styles.camCrosshair}>
                        <span style={styles.crosshairH} /><span style={styles.crosshairV} />
                      </div>
                      <div style={styles.camTimestamp}>{new Date().toLocaleTimeString("en-US", { hour12: false })}</div>
                      <div style={styles.camRecording}><div style={styles.recDot} />REC</div>
                    </>
                  )}
                </div>
                <div style={styles.camLabel}>
                  <span style={styles.camId}>{cam.id}</span>
                  <span style={{ ...styles.camStatus, color: cam.status === "online" ? "#00e5a0" : "#ff3b4e" }}>
                    {cam.status.toUpperCase()}
                  </span>
                </div>
                <div style={styles.camLocation}>{cam.location}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <div style={styles.panelTitle}><span style={{ ...styles.panelDot, background: "#ff3b4e" }} /> RECENT ALERTS</div>
            <span style={styles.alertCount}>{RECENT_ALERTS.length} ACTIVE</span>
          </div>
          <div style={styles.alertList}>
            {RECENT_ALERTS.map((alert, i) => {
              const sev = SEV_COLORS[alert.severity];
              return (
                <div key={alert.id} style={{ ...styles.alertRow, borderLeftColor: sev.color, animationDelay: `${i * 0.08}s` }}>
                  <div style={styles.alertMain}>
                    <div style={styles.alertTop}>
                      <span style={styles.alertId}>{alert.id}</span>
                      <span style={{ ...styles.alertSeverity, color: sev.color, background: sev.bg, border: `1px solid ${sev.border}` }}>{alert.severity}</span>
                    </div>
                    <div style={styles.alertType}>{alert.type}</div>
                    <div style={styles.alertMeta}>
                      <span style={styles.alertCamera}>{alert.camera}</span>
                      <span style={styles.alertTime}>{alert.time}</span>
                    </div>
                  </div>
                  {user.role === "admin" && <button style={styles.resolveBtn}>RESOLVE</button>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ──────────────────────────────────────
export default function Dashboard({ user, onLogout }) {
  const [activePage, setActivePage] = useState("dashboard");
  const navigate = useNavigate();

  const PAGE_TITLES = {
    dashboard: "Command Dashboard",
    cameras:   "Camera Management",
    alerts:    "Alert Management",
    database:  "Case Database",
    reports:   "Reports",
  };

  const renderPage = () => {
    console.log("Current activePage:", activePage);
    switch (activePage) {
      case "cameras":  return <CamerasPage user={user} />;
      case "alerts":   return <AlertsPage user={user} />;
      case "database": return <DatabasePage />;
      case "reports":  return <ReportsPage />;
      default:         return <OverviewPage user={user} />;
    }
  };
  
  
  
  const detectFace = async (base64Image) => {
    try {
      const res = await fetch(
        "http://localhost:3001/api/detect-face",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: base64Image,
          }),
        }
      );

      const data = await res.json();

      if (data.match) {
        alert("🚨 Criminal Detected!");
      } else {
        alert("✅ No Match Found");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={styles.root}>
      <Navbar
        user={user}
        onLogout={onLogout}
        activePage={activePage}
        onNavigate={setActivePage}   // ← this now actually switches pages
      />

      <div style={styles.body}>
        {/* Page header */}
        <div style={styles.pageHeader}>
          <div>
            <div style={styles.breadcrumb}>
              <span style={styles.breadcrumbItem}>SENTINEL</span>
              <span style={styles.breadcrumbSep}>/</span>
              <span style={styles.breadcrumbCurrent}>{activePage.toUpperCase()}</span>
            </div>
            <h1 style={styles.pageTitleMain}>{PAGE_TITLES[activePage]}</h1>
          </div>
          <div style={styles.pageHeaderRight}>
            <div style={styles.systemStatus}>
              <div style={styles.statusIndicator} />
              <span style={styles.statusText}>All Systems Nominal</span>
            </div>
            <button style={styles.sketchBtn} onClick={() => navigate("/sketch")}>
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                <circle cx="7.5" cy="7.5" r="3" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="7.5" cy="7.5" r="6.5" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"/>
                <line x1="7.5" y1="1" x2="7.5" y2="4" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="7.5" y1="11" x2="7.5" y2="14" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="1" y1="7.5" x2="4" y2="7.5" stroke="currentColor" strokeWidth="1.5"/>
                <line x1="11" y1="7.5" x2="14" y2="7.5" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              OPEN SKETCH TOOL
            </button>
          </div>
        </div>

        {/* Render active page */}
        <div key={activePage} style={{ animation: "fadeUp 0.3s ease-out" }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────
const styles = {
  root: { minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg-void)" },
  body: { flex: 1, padding: "28px 32px", maxWidth: "1600px", margin: "0 auto", width: "100%" },

  pageHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "28px", paddingBottom: "20px", borderBottom: "1px solid #1e2d3d" },
  breadcrumb: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" },
  breadcrumbItem: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#3a5570", letterSpacing: "2px" },
  breadcrumbSep: { color: "#1e2d3d" },
  breadcrumbCurrent: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#f5a623", letterSpacing: "2px" },
  pageTitleMain: { fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: "700", letterSpacing: "2px", color: "#d4e8f5", lineHeight: 1 },
  pageHeaderRight: { display: "flex", alignItems: "center", gap: "12px" },
  systemStatus: { display: "flex", alignItems: "center", gap: "8px", padding: "8px 14px", background: "rgba(0,229,160,0.05)", border: "1px solid rgba(0,229,160,0.2)", borderRadius: "4px" },
  statusIndicator: { width: "7px", height: "7px", borderRadius: "50%", background: "#00e5a0", animation: "pulse-green 2s infinite" },
  statusText: { fontFamily: "var(--font-mono)", fontSize: "11px", color: "#00e5a0", letterSpacing: "1px" },
  sketchBtn: { display: "flex", alignItems: "center", gap: "8px", padding: "9px 18px", background: "linear-gradient(135deg, rgba(0,229,160,0.15), rgba(0,229,160,0.08))", border: "1px solid rgba(0,229,160,0.5)", borderRadius: "4px", color: "#00e5a0", fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: "700", letterSpacing: "2px", cursor: "pointer", boxShadow: "0 0 16px rgba(0,229,160,0.1)" },
  actionBtn: { padding: "8px 16px", background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.3)", borderRadius: "4px", color: "#f5a623", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "600", letterSpacing: "2px", cursor: "pointer" },

  // Sub-page shared
  subHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" },
  pageTitle: { fontFamily: "var(--font-display)", fontSize: "22px", fontWeight: "700", color: "#d4e8f5", letterSpacing: "1px", marginBottom: "4px" },
  pageSubtitle: { fontFamily: "var(--font-mono)", fontSize: "11px", color: "#3a5570", letterSpacing: "1px" },

  // Table
  tableWrap: { background: "#0c1118", border: "1px solid #1e2d3d", borderRadius: "6px", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "2px", color: "#3a5570", textAlign: "left", borderBottom: "1px solid #1e2d3d", background: "#080c10", textTransform: "uppercase" },
  tr: { borderBottom: "1px solid #1e2d3d", animation: "fadeUp 0.3s ease-out both", transition: "background 0.15s" },
  td: { padding: "12px 16px", fontFamily: "var(--font-body)", fontSize: "13px", color: "#6b8ca8" },
  monoText: { fontFamily: "var(--font-mono)", fontSize: "11px", color: "#7ec8e3", letterSpacing: "1px" },
  statusBadge: { fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "1px", padding: "3px 8px", borderRadius: "3px" },
  zoneBadge: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#6b8ca8", background: "rgba(107,140,168,0.1)", border: "1px solid rgba(107,140,168,0.2)", padding: "2px 7px", borderRadius: "3px", letterSpacing: "1px" },
  tblBtn: { padding: "4px 10px", background: "transparent", border: "1px solid #1e2d3d", borderRadius: "3px", color: "#6b8ca8", fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "1px", cursor: "pointer" },

  // Alert card
  alertCard: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 16px 16px 18px", background: "#0c1118", borderRadius: "6px", borderLeft: "3px solid", animation: "fadeUp 0.3s ease-out both", gap: "16px" },

  // Filter buttons
  filterBtn: { padding: "6px 14px", background: "transparent", border: "1px solid #1e2d3d", borderRadius: "4px", color: "#3a5570", fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "1px", cursor: "pointer" },
  filterBtnActive: { borderColor: "rgba(245,166,35,0.4)", color: "#f5a623", background: "rgba(245,166,35,0.08)" },

  // Overview
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "24px" },
  mainGrid: { display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px" },
  panel: { background: "#0c1118", border: "1px solid #1e2d3d", borderRadius: "6px", padding: "20px", animation: "fadeUp 0.5s ease-out 0.3s both" },
  panelHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "14px", borderBottom: "1px solid #1e2d3d" },
  panelTitle: { display: "flex", alignItems: "center", gap: "8px", fontFamily: "var(--font-display)", fontSize: "12px", fontWeight: "700", letterSpacing: "3px", color: "#6b8ca8", textTransform: "uppercase" },
  panelDot: { width: "8px", height: "8px", borderRadius: "50%", background: "#00e5a0", animation: "pulse-green 2s infinite" },
  panelAction: { background: "transparent", border: "none", color: "#3a5570", fontFamily: "var(--font-mono)", fontSize: "10px", letterSpacing: "1px", cursor: "pointer" },
  alertCount: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#ff3b4e", letterSpacing: "1px", padding: "4px 8px", background: "rgba(255,59,78,0.1)", borderRadius: "2px", border: "1px solid rgba(255,59,78,0.25)" },
  cameraGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" },
  camCell: { animation: "fadeUp 0.4s ease-out both" },
  camScreen: { position: "relative", paddingBottom: "75%", background: "#050810", borderRadius: "4px", border: "1px solid #1e2d3d", overflow: "hidden", marginBottom: "6px" },
  camScanline: { position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,200,100,0.02) 3px, rgba(0,200,100,0.02) 4px)" },
  camOffline: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-mono)", fontSize: "10px", color: "#ff3b4e", letterSpacing: "2px" },
  camCrosshair: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "24px", height: "24px", opacity: 0.3 },
  crosshairH: { position: "absolute", top: "50%", left: 0, right: 0, height: "1px", background: "#00e5a0" },
  crosshairV: { position: "absolute", left: "50%", top: 0, bottom: 0, width: "1px", background: "#00e5a0" },
  camTimestamp: { position: "absolute", bottom: "5px", left: "6px", fontFamily: "var(--font-mono)", fontSize: "9px", color: "rgba(0,229,160,0.7)" },
  camRecording: { position: "absolute", top: "5px", right: "6px", fontFamily: "var(--font-mono)", fontSize: "9px", color: "#ff3b4e", display: "flex", alignItems: "center", gap: "4px" },
  recDot: { width: "5px", height: "5px", borderRadius: "50%", background: "#ff3b4e", animation: "blink 1.5s infinite" },
  camLabel: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" },
  camId: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#6b8ca8", letterSpacing: "1px" },
  camStatus: { fontFamily: "var(--font-mono)", fontSize: "9px" },
  camLocation: { fontFamily: "var(--font-body)", fontSize: "11px", color: "#3a5570" },
  alertList: { display: "flex", flexDirection: "column", gap: "8px", maxHeight: "400px", overflowY: "auto" },
  alertRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 12px 12px 14px", background: "#080c10", borderRadius: "4px", borderLeft: "3px solid", animation: "fadeUp 0.4s ease-out both", gap: "10px" },
  alertMain: { flex: 1, minWidth: 0 },
  alertTop: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" },
  alertId: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#3a5570", letterSpacing: "1px" },
  alertSeverity: { fontFamily: "var(--font-mono)", fontSize: "9px", letterSpacing: "1px", padding: "2px 6px", borderRadius: "2px" },
  alertType: { fontFamily: "var(--font-display)", fontSize: "13px", fontWeight: "600", color: "#d4e8f5", marginBottom: "4px" },
  alertMeta: { display: "flex", justifyContent: "space-between" },
  alertCamera: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#3a5570" },
  alertTime: { fontFamily: "var(--font-mono)", fontSize: "10px", color: "#3a5570" },
  resolveBtn: { 
    flexShrink: 0,
    padding: "5px 10px",
    background: "transparent",
    border: "1px solid #1e2d3d",
    borderRadius: "3px",
    color: "#3a5570",
    fontFamily: "var(--font-mono)",
    fontSize: "9px",
    cursor: "pointer"
  },

  // MODAL STYLES
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.85)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999
  },

  modalBox: {
    background: "#071018",
    padding: "30px",
    borderRadius: "16px",
    width: "850px",
    border: "1px solid rgba(0,255,200,0.2)",
    boxShadow: "0 0 30px rgba(0,255,200,0.15)"
  },

  modalImages: {
    display: "flex",
    gap: "20px",
    marginTop: "20px",
    justifyContent: "center"
  },

  modalImage: {
    width: "350px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.1)"
  },

  closeBtn: {
    marginTop: "20px",
    padding: "10px 20px",
    background: "transparent",
    border: "1px solid #00ffc3",
    color: "#00ffc3",
    cursor: "pointer",
    borderRadius: "6px",
    fontFamily: "var(--font-display)",
    letterSpacing: "2px"
  },
};