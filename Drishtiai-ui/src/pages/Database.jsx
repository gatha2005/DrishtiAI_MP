import React, { useEffect, useState } from "react";

export default function Database() {
  const role = localStorage.getItem("role");
  const [records, setRecords] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);

  console.log("DATABASE ROLE =", role);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {

      const response = await fetch(
        "http://localhost:3001/api/sketches"
      );

      const data = await response.json();

      console.log("CASES RECEIVED:", data);

      setRecords(data);

    } catch (err) {
      console.error("FETCH ERROR:", err);
    }
  };

  const deleteCase = async (id) => {
    try {

      const token = localStorage.getItem("token");

      await fetch(
        `http://localhost:3001/api/sketches/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setRecords(
        records.filter((r) => r._id !== id)
      );

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={styles.container}>

      <div style={styles.header}>
        <div>
          <p style={styles.breadcrumb}>
            Drishti-AI / DATABASE
          </p>

          <h1 style={styles.heading}>
            Case Database
          </h1>
        </div>

        <button style={styles.exportBtn}>
          EXPORT
        </button>
      </div>

      <div style={styles.subText}>
        {records.length} records · {records.length} submitted composites
      </div>

      <div style={styles.tableContainer}>

        <table style={styles.table}>

          <thead>

            <tr>

              <th style={styles.th}>RECORD ID</th>
              <th style={styles.th}>SUBJECT</th>
              <th style={styles.th}>CASE ID</th>
              <th style={styles.th}>DATE</th>
              <th style={styles.th}>STATUS</th>
              <th style={styles.th}>IMAGES</th>
              <th style={styles.th}>ACTIONS</th>

            </tr>

          </thead>

          <tbody>

            {records.map((rec, index) => (

              <tr key={rec._id}>

                <td style={styles.td}>
                  REC-{String(index + 1).padStart(3, "0")}
                </td>

                <td style={styles.td}>
                  {rec.prompt || "Unknown Subject"}
                </td>

                <td style={styles.td}>
                  CASE-{rec._id.slice(-6)}
                </td>

                <td style={styles.td}>
                  {new Date(rec.createdAt).toLocaleDateString()}
                </td>

                <td style={styles.td}>
                  <span style={styles.status}>
                    SUBMITTED
                  </span>
                </td>

                <td style={styles.td}>

                  <div style={styles.badges}>

                    {rec.originalSketch && (
                      <span style={styles.sketchBadge}>
                        🖼 SKETCH
                      </span>
                    )}

                    {rec.generatedImage && (
                      <span style={styles.faceBadge}>
                        ✦ AI FACE
                      </span>
                    )}

                  </div>

                </td>

                <td style={styles.td}>

                  <button
                    style={styles.viewBtn}
                    onClick={() => setSelectedRecord(rec)}
                  >
                    VIEW
                  </button>

                  {role === "admin" && (
                    <button
                      style={styles.deleteBtn}
                      onClick={() => deleteCase(rec._id)}
                    >
                      ✕
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

          <div style={styles.modal}>

            <h2 style={{ marginBottom: "20px" }}>
              Case Images
            </h2>

            <div style={styles.modalImages}>

              <div>

                <h4>Composite Sketch</h4>

                <img
                  src={
                    selectedRecord.originalSketch.startsWith("data:image")
                      ? selectedRecord.originalSketch
                      : `data:image/png;base64,${selectedRecord.originalSketch}`
                  }
                  alt=""
                  style={styles.modalImg}
                />

              </div>

              <div>

                <h4>Enhanced AI Face</h4>

                <img
                  src={
                    selectedRecord.generatedImage.startsWith("data:image")
                      ? selectedRecord.generatedImage
                      : `data:image/png;base64,${selectedRecord.generatedImage}`
                  }
                  alt=""
                  style={styles.modalImg}
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

const styles = {

  container: {
    padding: "30px",
    background: "#050816",
    minHeight: "100vh",
    color: "white",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
  },

  breadcrumb: {
    color: "#64748b",
    fontSize: "12px",
    letterSpacing: "2px",
  },

  heading: {
    fontSize: "42px",
    margin: 0,
  },

  exportBtn: {
    background: "#1e293b",
    color: "#facc15",
    border: "1px solid #facc15",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  subText: {
    color: "#64748b",
    marginBottom: "20px",
  },

  tableContainer: {
    border: "1px solid #1e293b",
    borderRadius: "12px",
    overflow: "hidden",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
  },

  th: {
    textAlign: "left",
    padding: "18px",
    background: "#071018",
    color: "#64748b",
    fontSize: "12px",
    letterSpacing: "2px",
  },

  td: {
    padding: "18px",
    borderTop: "1px solid #1e293b",
  },

  status: {
    background: "#052e16",
    color: "#00ff99",
    padding: "5px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "bold",
  },

  badges: {
    display: "flex",
    gap: "10px",
  },

  sketchBadge: {
    background: "#0f766e",
    color: "#5eead4",
    padding: "5px 10px",
    borderRadius: "6px",
    fontSize: "11px",
  },

  faceBadge: {
    background: "#581c87",
    color: "#d8b4fe",
    padding: "5px 10px",
    borderRadius: "6px",
    fontSize: "11px",
  },

  viewBtn: {
    background: "transparent",
    color: "#00ff99",
    border: "1px solid #00ff99",
    padding: "6px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    marginRight: "10px",
  },

  deleteBtn: {
    background: "transparent",
    color: "#ff4d6d",
    border: "1px solid #ff4d6d",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.8)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999,
  },

  modal: {
    background: "#0f172a",
    padding: "30px",
    borderRadius: "16px",
    width: "800px",
  },

  modalImages: {
    display: "flex",
    gap: "20px",
    marginBottom: "20px",
  },

  modalImg: {
    width: "320px",
    borderRadius: "10px",
    border: "1px solid #334155",
  },

  closeBtn: {
    background: "#1e293b",
    color: "white",
    border: "none",
    padding: "10px 20px",
    borderRadius: "8px",
    cursor: "pointer",
  },

};