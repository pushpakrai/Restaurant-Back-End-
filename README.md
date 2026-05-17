<div align="center">
  <h1>⚙️ Cafe Diamond Queen — Backend API</h1>
  <p><strong>Secure, Scalable, AI-Integrated Node.js REST API</strong></p>

  [![Node.js](https://img.shields.io/badge/Node.js-20-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
  [![Express.js](https://img.shields.io/badge/Express.js-Fast-black.svg?style=for-the-badge&logo=express)](https://expressjs.com/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
  [![JWT](https://img.shields.io/badge/JWT-Auth-black.svg?style=for-the-badge&logo=json-web-tokens)](https://jwt.io/)
  [![Google Gemini](https://img.shields.io/badge/Gemini-AI-blue.svg?style=for-the-badge&logo=google)](https://deepmind.google/technologies/gemini/)

  [Live API Health Check](https://restaurant-back-end-ksi0.onrender.com/api/health) | [Frontend Repository](https://github.com/pushpakrai/Resturant-Front-End-)
</div>

---

## 🌟 Overview
The backend system for **Cafe Diamond Queen** is a robust, production-ready Express.js API designed to handle high-tier restaurant operations. It manages secure user authentication, complex order processing, table reservations, and features cutting-edge integration with Google's Gemini AI to offer dynamic culinary experiences.

## ✨ Key Features
- **🧠 Generative AI Integration**: Interfaces with `@google/genai` to power the frontend "AI Concierge" and generate on-the-fly, hyper-customized secret menu items based on user cravings.
- **🔐 Enterprise-Grade Security**: Employs strictly typed input validation (`express-validator`), robust password hashing (`bcryptjs`), and secure token-based authentication (`jsonwebtoken`).
- **🗄️ Scalable Cloud Database**: Utilizes `Mongoose` connected to a MongoDB Atlas cluster to ensure data durability, fast indexing, and reliable high-volume concurrent access.
- **🛡️ RBAC (Role-Based Access Control)**: Middleware-protected routes specifically partitioned for Guests, Authenticated Users, and the Master Admin.
- **💳 Financial Readiness**: Architecture supports expansion into Razorpay/Stripe webhooks for live payment processing.

## 🏗️ Architecture & Structure
The API is built using a classic, maintainable MVC (Model-View-Controller/Route) structure:

```text
src/
├── config/          # Environment setups and tenant configs
├── controllers/     # Core business logic (optional extraction from routes)
├── middleware/      # Express middlewares (Auth, Error Handling, Admin Checks)
├── models/          # Mongoose Schemas (User, Order, Menu, Reservation)
├── routes/          # REST API route definitions
│   ├── auth.js      # Login, Register, Profile fetching
│   ├── custom-ai.js # Gemini AI chat and custom dish generation
│   ├── menu.js      # CRUD operations for restaurant catalog
│   ├── orders.js    # Order processing and history tracking
│   └── tables.js    # Reservation and availability management
├── utils/           # Shared utilities (Loggers, formatters)
├── .env             # Secure local variables (GitIgnored)
├── render.yaml      # Cloud CI/CD Blueprint
└── server.js        # Application Entry Point & Express setup
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas Cluster (or local instance)

### Installation
1. Clone the repository
```bash
git clone https://github.com/pushpakrai/Restaurant-Back-End-.git
cd Restaurant-Back-End-
```

2. Install dependencies
```bash
npm install
```

3. Environment Variables
Create a `.env` file in the root directory. You will need:
```env
PORT=10000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/...
JWT_SECRET=your_super_secret_key
FRONTEND_ORIGINS=http://localhost:5173
GEMINI_API_KEY=your_google_gemini_key
```

4. Run the Development Server
```bash
npm run dev
```

## 🛠️ API Documentation
| Endpoint | Method | Role | Description |
|---|---|---|---|
| `/api/auth/register` | `POST` | Public | Register a new identity |
| `/api/auth/login` | `POST` | Public | Authenticate & retrieve JWT |
| `/api/menu` | `GET` | Public | Fetch standard menu catalog |
| `/api/custom-ai/chat` | `POST` | Public | Interact with Diamond Concierge |
| `/api/custom-ai/generate`| `POST` | Public | Create a custom AI dish |
| `/api/orders` | `POST` | User | Process a new cart order |
| `/api/admin/dashboard`| `GET` | Admin | Fetch system analytics |

## ☁️ Deployment
This backend is fully containerized and configured to deploy seamlessly via **Render** as a Node Web Service using the provided `render.yaml` blueprint.

## 📄 License
This backend architecture is proprietary and securely operated for Cafe Diamond Queen.
