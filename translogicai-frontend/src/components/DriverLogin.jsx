import React, { useState } from "react";
import API_BASE from "../config/api";
import { useNavigate } from "react-router-dom";

function DriverLogin() {
  const [isSignup, setIsSignup] = useState(false);
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    password: "",
    licenceNumber: "",
    licenceFile: null,
    address: "",
    city: "",
    state: "",
    pincode: ""
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const resetSignupState = () => {
    setStep(1);
    setOtpSent(false);
    setOtpVerified(false);
    setOtp("");
    setForm({
      fullName: "",
      password: "",
      licenceNumber: "",
      licenceFile: null,
      address: "",
      city: "",
      state: "",
      pincode: ""
    });
  };

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
    if (otp === "1234") {
      setOtpVerified(true);
      setStep(3);
      setError("");
    } else {
      setError("Incorrect OTP. Please try again.");
    }
  };

  const handleFormChange = (e) => {
    const { name, value, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/driver/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password: e.target.querySelector('input[type="password"]').value })
      });
      const data = await res.json();      if (res.ok) {
        // Save driver data including _id for vehicle management
        localStorage.setItem('driverData', JSON.stringify({
          ...data.driver,
          token: data.token // If your backend sends a token
        }));
        setSuccess("Login successful!");
        setTimeout(() => navigate("/driver/home"), 1000);
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      console.error('Login error:', err);
      setError("Network error");
    }
    setLoading(false);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      if (!otpVerified) {
        setError("Please verify your phone number first");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("phone", phone);
      
      // Append all form fields to FormData
      Object.entries(form).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      const res = await fetch(`${API_BASE}/api/driver/signup`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess("Sign up successful! Please login.");
        setIsSignup(false);
        resetSignupState();
      } else {
        setError(data.error || "Sign up failed");
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError("Network error");
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md mt-10">
        <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">
          {isSignup ? "Driver Sign Up" : "Driver Login"}
        </h2>

        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        {success && <div className="text-green-600 text-sm mb-2">{success}</div>}

        {!isSignup ? (
          // Login Form
          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <input
              type="tel"
              className="border rounded px-3 py-2"
              placeholder="Phone Number"
              maxLength={10}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
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
              New driver?{" "}
              <button
                type="button"
                className="text-blue-600 underline"
                onClick={() => {
                  setIsSignup(true);
                  resetSignupState();
                }}
              >
                Sign Up
              </button>
            </div>
          </form>
        ) : (
          // Signup Form (Step-wise)
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            {step === 1 && (
              <>
                <input
                  type="tel"
                  className="border rounded px-3 py-2"
                  placeholder="Phone Number"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
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

            {step === 2 && !otpVerified && (
              <>
                <input
                  type="tel"
                  className="border rounded px-3 py-2"
                  placeholder="Enter OTP"
                  maxLength={4}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
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

            {step === 3 && otpVerified && (
              <>
                <input type="text" placeholder="Full Name" name="fullName" className="border rounded px-3 py-2" value={form.fullName} onChange={handleFormChange} required />
                <input type="password" placeholder="Password" name="password" className="border rounded px-3 py-2" value={form.password} onChange={handleFormChange} required />
                <input type="text" placeholder="Driving Licence Number" name="licenceNumber" className="border rounded px-3 py-2" value={form.licenceNumber} onChange={handleFormChange} required />
                <label className="font-medium">Driving Licence Upload
                  <input type="file" name="licenceFile" accept="application/pdf,image/*" onChange={handleFormChange} required className="border rounded px-3 py-2 w-full mt-1" />
                </label>
                <input type="text" placeholder="Address" name="address" className="border rounded px-3 py-2" value={form.address} onChange={handleFormChange} required />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    name="city"
                    className="border rounded px-3 py-2 w-full"
                    value={form.city}
                    onChange={handleFormChange}
                    required
                  />
                  <input
                    type="text"
                    placeholder="State"
                    name="state"
                    className="border rounded px-3 py-2 w-full"
                    value={form.state}
                    onChange={handleFormChange}
                    required
                  />
                  <input
                    type="text"
                    placeholder="pincode"
                    name="pincode"
                    className="border rounded px-3 py-2 w-full"
                    value={form.pincode}
                    onChange={handleFormChange}
                    required
                  />
                </div>


                <button type="submit" className="bg-blue-700 text-white py-2 rounded font-semibold hover:bg-blue-800 transition" disabled={loading}>
                  {loading ? "Loading..." : "Register"}
                </button>
                <div className="text-sm text-center mt-2">
                  Already have an account?{" "}
                  <button type="button" className="text-blue-600 underline" onClick={() => { setIsSignup(false); resetSignupState(); }}>
                    Login
                  </button>
                </div>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

export default DriverLogin;

