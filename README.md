# RecoverAI

RecoverAI is an AI-powered revenue recovery and customer retention platform designed to help businesses identify customers who are at risk of losing revenue and take suitable recovery actions.

The project focuses on analyzing payment failures, identifying customer risk, tracking recovery activities, and providing useful insights through a simple dashboard.

## Features

* 📊 Dashboard with revenue and customer metrics
* 👥 Customer management and search
* ⚠️ Customer risk detection
* 💰 Revenue recovery tracking
* 🔄 Simulated payment recovery actions
* 📈 Analytics and recovery trends
* 🤖 AI-powered insights
* 🔔 Notifications for important activities
* 📱 Responsive and user-friendly interface

## How It Works

RecoverAI collects customer and payment information and uses it to identify potential revenue loss. Based on the available data, customers can be categorized according to their risk level.

Users can then view customer details and perform recovery actions such as retrying a payment, sending a reminder, or marking a customer as recovered.

The recovery actions in this project are **simulated for demonstration purposes** and do not process real payments.

## Technology Used

**Frontend**

* React
* Vite
* JavaScript / JSX
* CSS
* Lucide React

**Backend**

* Node.js
* Express.js
* CORS

**Database**

* SQLite
* better-sqlite3

## Project Structure

```text
RecoverAI/
├── frontend/
│   └── src/
├── backend/
│   ├── server.js
│   ├── database.js
│   └── recoverai.db
└── README.md
```

## Running the Project

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
node server.js
```

Make sure the backend is running before using features that require database or API access.

## Project Goal

The goal of RecoverAI is to demonstrate how AI, customer data, and automated recovery workflows can be combined to help businesses reduce revenue loss and improve customer retention.

Built as a college/project demonstration using modern web technologies.
