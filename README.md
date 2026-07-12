# 🩺 DermaLlama Deployment Guide

An AI-powered dermatology assistant combining a custom fine-tuned **ResNet50** vision classifier (Python Flask) with a **Retrieval-Augmented Generation (RAG)** medical consultation engine (Node.js & Gemini AI).

---

## 📂 Project Structure

```plaintext
├── backend/          # Node.js Express API Server & RAG Engine
├── ml-service/       # Python Flask ML Inference Server
└── frontend/         # React.js UI Client
```

---

## ⚡ Quick Start (Root Commands)

The project includes root scripts to manage all services concurrently for convenience:

* **Install all dependencies** (Root, Backend, and Frontend):
  ```bash
  npm run install:all
  ```
* **Start both Backend and Frontend in Development Mode**:
  ```bash
  npm run dev
  ```
* **Start ML service, Backend, and Frontend in Production Mode**:
  ```bash
  npm run start:prod
  ```

---

## 🔧 Individual Services Setup

### 1. Machine Learning Microservice (Flask)

#### 📝 Environment Variables (`ml-service/.env`)
Create a `.env` file inside the `ml-service/` directory:

```env
PORT=5001
TF_ENABLE_ONEDNN_OPTS=0
```

#### 📦 Installation & Execution
Run the following commands in your terminal:

```bash
cd ml-service
pip install -r requirements.txt
python app.py
```

* **Inference Endpoint:** `POST http://localhost:5001/predict`
* **Target Image Dimensions:** Standardized to $150 \times 150$ pixels automatically within the inference script.

---

### 2. Backend Application (Node.js)

#### 📝 Environment Variables (`backend/.env`)
Create a `.env` file inside the `backend/` directory:

```env
PORT=5002
MONGODB_URI=mongodb://localhost:27017/dermallama
GEMINI_API_KEY=your_gemini_api_key_here
ML_SERVICE_URL=http://localhost:5001
NODE_ENV=development
```

> [!NOTE]  
> For cloud deployment on Render, update `ML_SERVICE_URL` to point to your live hosted Flask service URL.

#### 📦 Installation & Execution
Run the following commands in your terminal:

```bash
cd backend
npm install
npm run dev
```

---

### 3. Frontend Setup (React)

#### 📝 Environment Variables (`frontend/.env`)
Create a `.env` file inside the `frontend/` directory:

```env
VITE_API_BASE_URL=http://localhost:5002
```

> [!NOTE]  
> For cloud deployment on Vercel, update this variable to match your live hosted Node.js backend URL.

#### 📦 Installation & Execution
Run the following commands in your terminal:

```bash
cd frontend
npm install
npm run dev
```

---

## ☁️ Production Cloud Deployment Blueprint

| Layer | Platform | Core Setup Configuration Required |
| :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | Set the `VITE_API_BASE_URL` environment variable to the live Node.js Render web URL. |
| **Backend** | [Render](https://render.com) | Add the `ML_SERVICE_URL` environment variable pointing to the live Python Flask web service domain. |
| **ML Service** | [Render](https://render.com) | Ensure the compiled `skin_disease_model.h5` model file is properly committed via **Git LFS** to prevent upload errors. |
| **Database** | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | Whitelist `0.0.0.0/0` (or target server IPs) and update the backend database connection string. |
