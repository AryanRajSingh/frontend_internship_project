# 📘 Scalable Web App with Authentication & Dashboard

![React](https://img.shields.io/badge/Frontend-React.js-blue?logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js-green?logo=node.js)
![MySQL](https://img.shields.io/badge/Database-MySQL-blue?logo=mysql)
![JWT](https://img.shields.io/badge/Auth-JWT-orange?logo=jsonwebtokens)
![TailwindCSS](https://img.shields.io/badge/UI-TailwindCSS-06B6D4?logo=tailwind-css)
![Status](https://img.shields.io/badge/Status-Completed-success)

---

## 📌 About the Assignment

This project was developed for the **Frontend Developer Intern assignment** to evaluate skills in **building secure, scalable, and modern web applications**.

The app demonstrates **full-stack development** with:

* Authentication (Register/Login/Logout)
* JWT-based secure APIs
* CRUD operations on tasks
* A responsive dashboard

---

## 🚀 Features

### 🔹 Frontend

* React.js + TailwindCSS
* Responsive, mobile-first design
* Form validation (client + server side)
* Protected routes with JWT

### 🔹 Backend

* Node.js + Express.js
* REST APIs for auth & tasks
* JWT authentication middleware
* MySQL for persistence
* Centralized error handling

### 🔹 Dashboard

* User profile display
* CRUD operations for tasks
* Search & filter options
* Secure logout flow

### 🔒 Security

* Password hashing with bcrypt
* JWT-based token validation
* Input validation with express-validator
* Consistent error handling

---

## 📦 Tech Stack

**Frontend:** React.js, TailwindCSS, Axios, React Router
**Backend:** Node.js, Express.js, MySQL, JWT, bcrypt, express-validator

---

## 📂 Project Structure

```
project-root/
│
├── backend/
│   ├── server.js
│   ├── routes/ (auth, tasks)
│   ├── models/ (User, Task)
│   ├── middleware/ (authMiddleware.js)
│   └── config/ (db.js, env)
│
├── frontend/
│   ├── src/
│   │   ├── components/ (UI)
│   │   ├── pages/ (Login, Register, Dashboard)
│   │   ├── services/ (api.js)
│   │   └── App.js
│   └── public/
│       └── index.html
│
├── index.html   👈 For GitHub Pages hosting
├── README.md
└── package.json
```

👉 **Important for GitHub Pages:**
Place `index.html` at the **root of the repository** (outside `frontend/`) to avoid hosting issues.
If using React Router, add a **404.html** that redirects to `index.html` for smooth routing.

---

## 📑 API Endpoints

* `POST /auth/register` → Register new user
* `POST /auth/login` → Login (JWT token)
* `GET /auth/profile` → Fetch user profile
* `POST /tasks` → Add new task
* `GET /tasks` → Fetch all tasks
* `PUT /tasks/:id` → Update a task
* `DELETE /tasks/:id` → Delete a task

---

## 📈 Scaling for Production

* **Frontend:** Deploy to **Vercel/Netlify/GitHub Pages**
* **Backend:** Containerize with **Docker**, host on **AWS ECS / Render / Heroku**
* **Database:** Use managed **AWS RDS / Cloud SQL**
* **Load Balancing:** With **Nginx / AWS ELB**
* **Caching:** Use **Redis** for session + query cache
* **Monitoring:** Add **Datadog / New Relic**
* **CI/CD:** Automate with **GitHub Actions**

---

## 📊 Evaluation Criteria

✔️ UI/UX responsiveness
✔️ Frontend-backend integration
✔️ Security practices (bcrypt, JWT)
✔️ Code quality & scalability
✔️ Documentation (this README)

---

## ✅ Conclusion

This project is a **complete full-stack application** showcasing:

* Authentication
* Secure APIs
* CRUD functionality
* Scalable structure

It’s designed with **production scalability in mind**, making it a strong foundation for real-world web applications.
