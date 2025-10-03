import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../components/AuthProvider";

export default function Home() {
  const { token } = useAuth();

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-purple-500 to-blue-600 px-4 text-white">

      <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-center drop-shadow-lg">
        Welcome to Web Project
      </h1>
      
      <p className="text-lg md:text-xl mb-8 text-center max-w-xl drop-shadow-md">
        Aryan's Frontend Developer Intern Project for <span className="font-semibold text-yellow-300">Primetrade.ai</span>
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          to="/login"
          className="px-6 py-3 bg-white text-black font-semibold rounded-lg shadow-lg hover:bg-gray-200 transition-colors duration-300 text-center"
        >
          Login
        </Link>
        <Link
          to="/register"
          className="px-6 py-3 bg-black text-white font-semibold rounded-lg shadow-lg hover:bg-gray-800 transition-colors duration-300 text-center"
        >
          Register
        </Link>
      </div>

      <p className="mt-10 text-sm text-gray-200 text-center max-w-md">
        &copy; 2025 Aryan Raj. All rights reserved❤️
      </p>
    </div>
  );
}
