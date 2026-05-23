<div align="center">

```
██╗   ██╗███████╗██╗  ██╗██╗ ██████╗██╗     ███████╗
██║   ██║██╔════╝██║  ██║██║██╔════╝██║     ██╔════╝
██║   ██║█████╗  ███████║██║██║     ██║     █████╗  
╚██╗ ██╔╝██╔══╝  ██╔══██║██║██║     ██║     ██╔══╝  
 ╚████╔╝ ███████╗██║  ██║██║╚██████╗███████╗███████╗
  ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═╝ ╚═════╝╚══════╝╚══════╝
                                                     
          R E N T A L   S Y S T E M
```

**A full-stack vehicle rental platform — browse, book, and hit the road.**

[![JavaScript](https://img.shields.io/badge/JavaScript-94.2%25-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://github.com/ujwal282/vehicle-rental)
[![CSS](https://img.shields.io/badge/CSS-5.5%25-1572B6?style=flat-square&logo=css3&logoColor=white)](https://github.com/ujwal282/vehicle-rental)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)
[![Stars](https://img.shields.io/github/stars/ujwal282/vehicle-rental?style=flat-square&color=yellow)](https://github.com/ujwal282/vehicle-rental/stargazers)

</div>

---

## 🚗 Overview

**Vehicle Rental** is a modern, full-stack web application that streamlines the process of renting vehicles. With a clean frontend interface and a robust backend API, users can browse available vehicles, manage bookings, and admins can oversee the entire fleet — all from a single platform.

---

## 🗂️ Project Structure

```
vehicle-rental/
├── 📁 backend/          # Node.js / Express REST API
│   ├── controllers/     # Route handler logic
│   ├── models/          # Database schemas
│   ├── routes/          # API route definitions
│   └── server.js        # App entry point
│
└── 📁 frontend/         # React client application
    ├── src/
    │   ├── components/  # Reusable UI components
    │   ├── pages/       # Route-level page views
    │   └── App.js       # Root component
    └── public/
```

---

## ⚡ Tech Stack

| Layer      | Technology                         |
|------------|------------------------------------|
| Frontend   | React.js, CSS                      |
| Backend    | Node.js, Express.js                |
| Database   | MongoDB                            |
| Auth       | JWT (JSON Web Tokens)              |
| API Style  | REST                               |

---

## 🚀 Getting Started

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)

---

### 1. Clone the Repository

```bash
git clone https://github.com/ujwal282/vehicle-rental.git
cd vehicle-rental
```

---

### 2. Setup the Backend

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Start the backend server:

```bash
npm start
# or for development with hot reload:
npm run dev
```

The API will be running at `http://localhost:5000`

---

### 3. Setup the Frontend

```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:5000
```

Start the development server:

```bash
npm start
```

The app will be running at `http://localhost:3000`

---

## ✨ Features

- 🔐 **User Authentication** — Secure signup / login with JWT
- 🚘 **Vehicle Listings** — Browse all available vehicles
- 📅 **Booking Management** — Reserve vehicles with date selection
- 🛠️ **Admin Panel** — Manage fleet, users, and rental records
- 📱 **Responsive Design** — Works across desktop and mobile
- 🔍 **Search & Filter** — Find vehicles by type, availability, and more

---

## 📡 API Endpoints

| Method | Endpoint               | Description              |
|--------|------------------------|--------------------------|
| POST   | `/api/auth/register`   | Register a new user      |
| POST   | `/api/auth/login`      | Log in & receive token   |
| GET    | `/api/vehicles`        | Get all vehicles         |
| GET    | `/api/vehicles/:id`    | Get a vehicle by ID      |
| POST   | `/api/bookings`        | Create a new booking     |
| GET    | `/api/bookings/user`   | Get current user's bookings |
| DELETE | `/api/bookings/:id`    | Cancel a booking         |

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Made with ❤️ by [ujwal282](https://github.com/ujwal282)

⭐ If you found this useful, give it a star!

</div>
