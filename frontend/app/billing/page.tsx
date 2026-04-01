"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function BillingPage() {
  const { user, loadingAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // 💳 STRIPE: Handle Upgrading to Pro
  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        "https://belgium-expat-ai-backend.onrender.com/api/create-checkout-session",
        {
          method: "POST",
          credentials: "include",
        },
      );
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error("Checkout failed");
    } finally {
      setIsLoading(false);
    }
  };

  // 💳 STRIPE: Handle Managing Billing
  const handleManageBilling = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        "https://belgium-expat-ai-backend.onrender.com/api/create-portal-session",
        {
          method: "POST",
          credentials: "include",
        },
      );
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (error) {
      console.error("Portal failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (loadingAuth) {
    return (
      <div className="text-center mt-20 text-gray-500 animate-pulse">
        Loading billing details...
      </div>
    );
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* HEADER SECTION */}
        <div className="text-center">
          <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">
            Pricing & Plans
          </h2>
          <p className="mt-2 text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Skip the Bureaucracy. Get Real Answers.
          </p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Moving to Belgium is hard enough. Don't rely on generic AI that
            hallucinates laws. Unlock our verified, real-world database designed
            exclusively for expats.
          </p>
        </div>

        {/* PRICING CARD */}
        <div className="mt-12 max-w-lg mx-auto bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden lg:max-w-none lg:flex">
          {/* LEFT SIDE: Value Proposition */}
          <div className="flex-1 px-6 py-8 lg:p-12 bg-gray-50">
            <h3 className="text-2xl font-extrabold text-gray-900 sm:text-3xl">
              Pro Consultant Plan
            </h3>
            <p className="mt-6 text-base text-gray-500">
              Our AI doesn't just guess. It actively retrieves answers from a
              curated database of real-life expat problems, legal frameworks,
              and survival guides.
            </p>
            <div className="mt-8">
              <div className="flex items-center">
                <h4 className="flex-shrink-0 pr-4 bg-gray-50 text-sm tracking-wider font-semibold uppercase text-blue-600">
                  What's included
                </h4>
                <div className="flex-1 border-t-2 border-gray-200"></div>
              </div>
              <ul className="mt-8 space-y-5 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-5">
                {[
                  "Up to 5,000 Messages / Month",
                  "Verified Commune & Visa Rules",
                  "Health Insurance & Banking Guides",
                  "Tax & Money Saving Strategies",
                  "Save Snippets to Notebook",
                  "Priority Real-Time Responses",
                ].map((feature) => (
                  <li key={feature} className="flex items-start lg:col-span-1">
                    <div className="flex-shrink-0">
                      {/* Checkmark Icon */}
                      <svg
                        className="h-5 w-5 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <p className="ml-3 text-sm text-gray-700 font-medium">
                      {feature}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RIGHT SIDE: Payment CTA */}
          <div className="py-8 px-6 text-center bg-white lg:flex-shrink-0 lg:flex lg:flex-col lg:justify-center lg:p-12">
            <p className="text-lg leading-6 font-medium text-gray-900">
              Pay monthly, cancel anytime.
            </p>
            <div className="mt-4 flex items-center justify-center text-5xl font-extrabold text-gray-900">
              <span>$2</span>
              <span className="ml-3 text-xl font-medium text-gray-500">
                /mo
              </span>
            </div>
            <div className="mt-6">
              {!user ? (
                <a
                  href="https://belgium-expat-ai-backend.onrender.com/login"
                  className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl text-blue-700 bg-blue-100 hover:bg-blue-200 transition-colors"
                >
                  Log in to Subscribe
                </a>
              ) : user.subscription_status === "pro" ? (
                <div className="flex flex-col space-y-3">
                  <span className="w-full flex items-center justify-center px-8 py-4 border-2 border-green-500 text-lg font-bold rounded-xl text-green-600 bg-green-50">
                    ✅ You are a Pro Member!
                  </span>
                  <button
                    onClick={handleManageBilling}
                    disabled={isLoading}
                    className="text-sm text-gray-500 underline hover:text-gray-800"
                  >
                    {isLoading ? "Loading..." : "Manage Subscription"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleUpgrade}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg transform transition hover:-translate-y-0.5"
                >
                  {isLoading ? "Connecting to Stripe..." : "Upgrade to Pro"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
