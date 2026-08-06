# 🔎 DrishtiAI – AI-Powered Facial Composite Sketch System

DrishtiAI is an AI-assisted facial composite sketch application designed to help create and enhance suspect facial composites from witness descriptions.

The system combines **voice input, NLP-based feature extraction, automatic facial component mapping, interactive sketch composition, and AI-powered photo enhancement** into a single web application.

---

## ✨ Features

### 🎙️ Voice-Based Witness Input

* Record a witness description using the browser microphone.
* Convert speech into text using speech recognition.
* Manually edit the transcript if required.

### 🧠 NLP Feature Extraction

The system extracts facial characteristics from natural-language descriptions, including:

* Gender
* Age
* Hair color
* Hair length
* Beard
* Moustache
* Glasses
* Eye color
* Face shape
* Skin tone
* Clothing

Example:

> "Male, 30 years old, short black hair, brown eyes and beard."

The NLP parser converts this description into structured facial features.

### 🧩 Automatic Facial Component Mapping

Extracted features are automatically mapped to available facial components.

The system can automatically select:

* Face
* Hair
* Eyes
* Nose
* Lips

and place them on the composite canvas.

### 🎨 Interactive Composite Canvas

Users can also manually build the composite by dragging facial components onto the canvas.

Features include:

* Drag and drop
* Anatomical snap zones
* Component positioning
* Component resizing
* Layer management
* Opacity control
* Blend modes

### ⚙️ Facial Attribute Controls

The facial attributes panel allows users to modify:

* Gender
* Age group
* Ethnicity
* Skin tone
* Hair color
* Hair style
* Facial hair
* Eye color
* Scars
* Birthmarks
* Tattoos

Voice-extracted features can automatically update the corresponding controls.

### 🤖 AI Facial Enhancement

The generated sketch can be sent to the backend for AI-based enhancement into a more realistic photograph.

The system creates prompts based on the selected facial attributes.

### 🔍 AI Analysis

The application can analyze the generated composite and provide:

* Suspect description
* Enhancement suggestions

### 💾 Save & Download

Users can save:

* Composite sketch
* Enhanced image

as PNG files.

---

## 🏗️ System Workflow

```text
                ┌──────────────────────┐
                │   Witness Description │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ Voice Recognition /  │
                │ Manual Text Input    │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │    NLP Parser        │
                │ extractFeatures()    │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ Structured Features  │
                └──────────┬───────────┘
                           │
                 ┌─────────┴─────────┐
                 ▼                   ▼
       ┌──────────────────┐   ┌──────────────────┐
       │ Component Mapper │   │ Facial Attributes│
       └────────┬─────────┘   └────────┬─────────┘
                │                      │
                └──────────┬───────────┘
                           ▼
                ┌──────────────────────┐
                │   Composite Canvas   │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ AI Enhancement       │
                │ Sketch → Photograph  │
                └──────────┬───────────┘
                           │
                           ▼
                ┌──────────────────────┐
                │ Save / Download      │
                └──────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend

* React.js
* Vite
* JavaScript
* HTML5
* CSS
* React Router
* Web Speech API / `react-speech-recognition`

### Backend

* Node.js
* Express.js
* REST API

### Database

* MongoDB

### AI / NLP

* NLP-based feature extraction
* Rule-based component mapping
* AI image enhancement
* AI-based facial composite analysis

### Development Tools

* Visual Studio Code
* Git
* GitHub
* npm

---

## 📂 Project Structure

```text
DrishtiAI/
│
├── Drishtiai-ui/
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   └── ActionButton.jsx
│   │   │   │
│   │   │   ├── sketch/
│   │   │   │   ├── CanvasArea.jsx
│   │   │   │   ├── FacialComponentsPanel.jsx
│   │   │   │   └── VoiceInputPanel.jsx
│   │   │   │
│   │   │   └── services/
│   │   │       ├── nlpParser.js
│   │   │       ├── componentMapper.js
│   │   │       └── ruleEngine.js
│   │   │
│   │   ├── pages/
│   │   │   └── SketchPage.jsx
│   │   │
│   │   └── ...
│   │
│   ├── public/
│   │   └── assets/
│   │       ├── face_structure/
│   │       ├── hair/
│   │       ├── eye/
│   │       ├── nose/
│   │       └── lips/
│   │
│   └── package.json
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── ...
│
└── README.md
```

> The exact backend folder structure may vary depending on the current project version.

---

## 🧠 NLP Example

### Input

```text
Male, 30 years old, short black hair, brown eyes and beard.
```

### Extracted Features

```json
{
  "gender": "Male",
  "age": "30",
  "hairColor": "Black",
  "hairLength": "Short",
  "beard": true,
  "moustache": false,
  "glasses": false,
  "eyeColor": "Brown",
  "faceShape": "",
  "skinTone": "",
  "clothing": ""
}
```

### Converted UI Attributes

```json
{
  "gender": "male",
  "age": "adult",
  "hairColor": "black",
  "hairStyle": "short",
  "facialHair": "fullBeard",
  "eyeColor": "brown"
}
```

These attributes are then used to update the **Facial Attributes** controls and generate the composite.

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/gatha2005/DrishtiAI.git
cd DrishtiAI
```

---

### 2. Install Frontend Dependencies

```bash
cd Drishtiai-ui
npm install
```

---

### 3. Start the Frontend

```bash
npm run dev
```

The Vite development server will provide a local URL, usually:

```text
http://localhost:5173
```

---

### 4. Start the Backend

Open another terminal and navigate to the backend directory:

```bash
cd backend
npm install
npm start
```

Make sure the backend API is running before using AI enhancement features.

---

## 🔐 Environment Variables

Create a `.env` file for sensitive configuration.

Example:

```env
PORT=3001
MONGODB_URI=your_mongodb_connection_string
AI_API_KEY=your_api_key
```

**Do not commit `.env` files or API keys to GitHub.**

Add the following to `.gitignore`:

```gitignore
.env
.env.local
node_modules/
dist/
```

---

## 🎯 How to Use

### Step 1 – Open Sketch Tool

Navigate to the **Facial Composite Sketch** page.

### Step 2 – Enter Witness Description

Either:

* Type the description manually, or
* Click **START RECORDING** and speak.

Example:

```text
Male, 30 years old, short black hair, brown eyes and beard.
```

### Step 3 – Apply NLP

Click:

```text
APPLY NLP
```

The system extracts the facial characteristics.

### Step 4 – Automatic Composite

The system automatically maps the detected features to facial components and places them on the canvas.

### Step 5 – Adjust Facial Attributes

Use the **FACIAL ATTRIBUTES** panel to modify the generated characteristics.

### Step 6 – Enhance

Click:

```text
✨ ENHANCE TO PHOTO
```

to send the composite to the backend AI enhancement service.

### Step 7 – Save

The resulting sketch or enhanced image can be downloaded for further use.

---

## 📌 Current Supported Attributes

| Attribute   | Supported |
| ----------- | --------- |
| Gender      | ✅         |
| Age         | ✅         |
| Hair Color  | ✅         |
| Hair Length | ✅         |
| Beard       | ✅         |
| Moustache   | ✅         |
| Eye Color   | ✅         |
| Face Shape  | ✅         |
| Skin Tone   | ✅         |
| Scars       | ✅         |
| Birthmarks  | ✅         |
| Tattoos     | ✅         |

---

## 🔮 Future Enhancements

* [ ] More advanced NLP understanding
* [ ] Improved facial component matching
* [ ] More face, eye, nose, lip and hair variations
* [ ] Facial feature positioning based on anatomical landmarks
* [ ] Better age-specific facial components
* [ ] Multiple witness descriptions
* [ ] Case management system
* [ ] User authentication and role-based permissions
* [ ] Export case reports
* [ ] Improved AI image enhancement
* [ ] Cloud deployment
* [ ] Mobile responsive interface

---

## ⚠️ Disclaimer

DrishtiAI is an **educational and prototype project** demonstrating AI, NLP, voice recognition, and facial composite generation concepts.

It should **not be treated as a definitive forensic identification system**. AI-generated or reconstructed images may contain inaccuracies and should not be used as sole evidence for real-world identification or investigative decisions.

---

## 👩‍💻 Team

**DrishtiAI – Facial Composite Sketch System**

Developed as a Computer Engineering project.

### Contributors

* Gatha Upare
* Vaishnavi Rai
* Devashree Rahate

---

## 📄 License

This project is intended for educational and academic purposes.

Add an appropriate open-source license if you decide to publish the project for public reuse.


