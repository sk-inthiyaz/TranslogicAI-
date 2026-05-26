import React, { useState } from "react";
import API_BASE from "../config/api";
import { useNavigate } from "react-router-dom";

function CustomerLogin() {
  const [isSignup, setIsSignup] = useState(false);
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = () => {
    if (!/^\d{10}$/.test(phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    setError("");
    setOtpSent(true);
    setStep(2);
  };

  const handleVerifyOtp = () => {
    if (otp === "1234") { // Demo OTP
      setOtpVerified(true);
      setStep(3);
      setError("");
    } else {
      setError("Incorrect OTP. Please try again.");
    }
  };

  const handleFormChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async e => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/customer/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password: e.target[1].value })
      });
      const data = await res.json();
      if (res.ok && data.customer) {
        localStorage.setItem("customerData", JSON.stringify(data.customer));
        setSuccess("Login successful!");
        setTimeout(() => navigate("/customer/home"), 1000);
      } else {
        setError(data.error || "Login failed - invalid credentials");
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(`Network error: ${err.message}`);
    }
    setLoading(false);
  };

  const handleSignup = async e => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/api/customer/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          name: form.name,
          email: form.email,
          address: form.address,
          password: form.password
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Sign up successful! Please login.");
        setIsSignup(false);
        setStep(1);
        setOtpSent(false);
        setOtpVerified(false);
        setOtp("");
        setForm({ name: "", email: "", address: "", password: "", confirmPassword: "" });
      } else {
        setError(data.error || "Sign up failed");
      }
    } catch (err) {
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md mt-10">
        <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">
          {isSignup ? "Customer Sign Up" : "Customer Login"}
        </h2>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        {success && <div className="text-green-600 text-sm mb-2">{success}</div>}
        {!isSignup ? (
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="tel"
              className="border rounded px-3 py-2"
              placeholder="Phone Number"
              maxLength={10}
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
              required
            />
            <input
              type="password"
              className="border rounded px-3 py-2"
              placeholder="Password"
              required
            />
            <button
              type="submit"
              className="bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 transition"
              disabled={loading}
            >
              {loading ? "Loading..." : "Login"}
            </button>
            <div className="text-sm text-center mt-2">
              New user?{" "}
              <button
                type="button"
                className="text-blue-600 underline"
                onClick={() => setIsSignup(true)}
              >
                Sign Up
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            {/* Step 1: Phone */}
            {step === 1 && (
              <>
                <input
                  type="tel"
                  className="border rounded px-3 py-2"
                  placeholder="Phone Number"
                  maxLength={10}
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                  required
                  disabled={otpSent}
                />
                <button
                  type="button"
                  className="bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 transition"
                  onClick={handleSendOtp}
                  disabled={otpSent || loading}
                >
                  {loading ? "Loading..." : "Send OTP"}
                </button>
              </>
            )}
            {/* Step 2: OTP */}
            {step === 2 && !otpVerified && (
              <>
                <input
                  type="tel"
                  className="border rounded px-3 py-2"
                  placeholder="Enter OTP"
                  maxLength={4}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                  required
                />
                <button
                  type="button"
                  className="bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 transition"
                  onClick={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Verify OTP"}
                </button>
                <button
                  type="button"
                  className="text-blue-600 underline text-xs mt-1"
                  onClick={() => {
                    setOtpSent(false);
                    setStep(1);
                    setOtp("");
                  }}
                >
                  Change Phone
                </button>
              </>
            )}
            {/* Step 3: Full Form */}
            {step === 3 && otpVerified && (
              <>
                <input
                  type="text"
                  className="border rounded px-3 py-2"
                  placeholder="Name"
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  required
                />
                <input
                  type="email"
                  className="border rounded px-3 py-2"
                  placeholder="Email (optional)"
                  name="email"
                  value={form.email}
                  onChange={handleFormChange}
                />
                <input
                  type="text"
                  className="border rounded px-3 py-2"
                  placeholder="Pickup Address"
                  name="address"
                  value={form.address}
                  onChange={handleFormChange}
                  required
                />
                <input
                  type="password"
                  className="border rounded px-3 py-2"
                  placeholder="Password"
                  name="password"
                  value={form.password}
                  onChange={handleFormChange}
                  required
                />
                <input
                  type="password"
                  className="border rounded px-3 py-2"
                  placeholder="Confirm Password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleFormChange}
                  required
                />
                <button
                  type="submit"
                  className="bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 transition"
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Sign Up"}
                </button>
              </>
            )}
            <div className="text-sm text-center mt-2">
              Already have an account?{" "}
              <button
                type="button"
                className="text-blue-600 underline"
                onClick={() => {
                  setIsSignup(false);
                  setStep(1);
                  setOtpSent(false);
                  setOtpVerified(false);
                  setOtp("");
                }}
              >
                Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default CustomerLogin;

