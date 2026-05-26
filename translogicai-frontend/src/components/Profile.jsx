import React, { useState, useEffect } from "react";
import API_BASE from "../config/api";

function Profile() {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', vehicles: 0, photo: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [driverId, setDriverId] = useState('');

  useEffect(() => {
    // Get driverId from localStorage (assuming login stores driverData)
    const driverData = JSON.parse(localStorage.getItem('driverData'));
    if (driverData?._id) {
      setDriverId(driverData._id);
      fetch(`${API_BASE}/api/driver/profile?driverId=${driverData._id}`)
        .then(res => res.json())
        .then(data => {
          setProfile({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            vehicles: data.vehicles || 0,
            photo: data.photo || ''
          });
          setPreview(data.photo ? `${API_BASE}${data.photo}` : '');
        });
    }
  }, []);

  const handlePhotoChange = e => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
      setPreview(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handlePhotoUpload = async e => {
    e.preventDefault();
    if (!photoFile || !driverId) return;
    const formData = new FormData();
    formData.append('photo', photoFile);
    formData.append('driverId', driverId);
    const res = await fetch(`${API_BASE}/api/driver/profile/photo`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (res.ok && data.photo) {
      setProfile(p => ({ ...p, photo: data.photo }));
      setPreview(`${API_BASE}${data.photo}`);
      setPhotoFile(null);
      // Update profile photo in localStorage for Navbar
      const driverData = JSON.parse(localStorage.getItem('driverData'));
      if (driverData) {
        const updated = { ...driverData, photo: data.photo };
        localStorage.setItem('driverData', JSON.stringify(updated));
      }
    } else {
      alert('Photo upload failed');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold text-blue-700 mb-6">My Profile</h2>
      <div className="flex flex-col items-center mb-6">
        <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mb-2 border-4 border-blue-200">
          {preview ? (
            <img src={preview} alt="Profile" className="object-cover w-full h-full" />
          ) : (
            <span className="text-5xl text-gray-400 flex items-center justify-center h-full w-full">👤</span>
          )}
        </div>
        <form onSubmit={handlePhotoUpload} className="flex flex-col items-center gap-2">
          <input type="file" accept="image/*" onChange={handlePhotoChange} />
          <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700 text-sm">Upload Photo</button>
        </form>
      </div>
      <div className="bg-white shadow rounded p-6">
        <div className="mb-4">
          <span className="font-semibold text-gray-700">Name:</span>
          <span className="ml-2 text-gray-900">{profile.name}</span>
        </div>
        <div className="mb-4">
          <span className="font-semibold text-gray-700">Email:</span>
          <span className="ml-2 text-gray-900">{profile.email}</span>
        </div>
        <div className="mb-4">
          <span className="font-semibold text-gray-700">Phone:</span>
          <span className="ml-2 text-gray-900">{profile.phone}</span>
        </div>
        <div className="mb-2">
          <span className="font-semibold text-gray-700">No. of Vehicles:</span>
          <span className="ml-2 text-gray-900">{profile.vehicles}</span>
        </div>
      </div>
    </div>
  );
}

export default Profile;
