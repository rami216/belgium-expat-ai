"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext"; // Import our custom hook

export default function Navbar() {
  // Just grab the user from global context! No fetch needed here.
  const { user } = useAuth();

  return (
    <nav className="bg-white shadow-md w-full border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* LEFT SIDE: Logo & Links */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold text-blue-600">
              🇧🇪 Expat AI
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link
                href="/"
                className="text-gray-600 hover:text-blue-600 transition font-medium"
              >
                Home
              </Link>
              <Link
                href="/billing"
                className="text-gray-500 hover:text-blue-600 font-bold"
              >
                Pricing
              </Link>
              <Link
                href="/how-it-works"
                className="text-gray-500 hover:text-blue-600 font-bold"
              >
                how-it-works!
              </Link>

              {user && (
                <>
                  <Link
                    href="/chat"
                    className="text-blue-600 hover:text-blue-800 transition font-bold"
                  >
                    💬 Chat
                  </Link>
                  <Link
                    href="/saved"
                    className="text-gray-600 hover:text-blue-600 transition font-medium"
                  >
                    📓 My Notebook
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* RIGHT SIDE: Auth Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700">
                  Hey, {user.full_name.split(" ")[0]}!
                </span>
                {user.avatar_url && (
                  <img
                    src={user.avatar_url}
                    alt="Avatar"
                    className="w-8 h-8 rounded-full border border-gray-300 shadow-sm"
                  />
                )}
                <a
                  href="https://belgium-expat-ai-backend.onrender.com/logout"
                  className="text-sm text-red-600 hover:text-red-800 font-medium ml-2"
                >
                  Logout
                </a>
              </div>
            ) : (
              <a
                href="https://belgium-expat-ai-backend.onrender.com/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition shadow-sm"
              >
                Sign in with Google
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
