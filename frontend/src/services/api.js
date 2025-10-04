// frontend/src/services/api.js
import axios from "axios";

// -------------------------
// Axios instance
// -------------------------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://backendcodeforinternship.vercel.app/api",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // send cookies if needed
});

// -------------------------
// Request interceptor: attach token
// -------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// -------------------------
// Response interceptor: handle 401 unauthorized
// -------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login"; // redirect to login
    }
    return Promise.reject(error);
  }
);

// -------------------------
// Auth APIs
// -------------------------

/**
 * Register a new user
 * @param {Object} data - { name, email, password }
 */
export const registerUser = (data) => api.post("/auth/register", data);

/**
 * Login user
 * @param {Object} data - { email, password }
 */
export const loginUser = (data) => api.post("/auth/login", data);

/**
 * Fetch logged-in user profile
 */
export const fetchProfile = () => api.get("/auth/profile");

// -------------------------
// Tasks APIs
// -------------------------

/**
 * Get all tasks for the logged-in user
 */
export const fetchTasks = () => api.get("/tasks");

/**
 * Add a new task
 * @param {Object} task - { title, description }
 */
export const addTask = (task) => {
  if (!task.title) throw new Error("Task title is required");
  return api.post("/tasks", task);
};

/**
 * Update an existing task
 * @param {string} id - task ID
 * @param {Object} task - { title, description }
 */
export const updateTask = (id, task) => {
  if (!id) throw new Error("Task ID is required");
  return api.put(`/tasks/${id}`, task);
};

/**
 * Delete a task
 * @param {string} id - task ID
 */
export const deleteTask = (id) => {
  if (!id) throw new Error("Task ID is required");
  return api.delete(`/tasks/${id}`);
};

// -------------------------
// Auth Token helper
// -------------------------

/**
 * Set or remove auth token for Axios
 * @param {string|null} token
 */
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
};

export default api;
