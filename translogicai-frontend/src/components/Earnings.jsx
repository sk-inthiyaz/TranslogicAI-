import React, { useState, useEffect } from "react";
import API_BASE from "../config/api";

function Earnings() {
  const [earnings, setEarnings] = useState([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  useEffect(() => {
    fetch(`${API_BASE}/api/logistics/loads`)
      .then(res => res.json())
      .then(data => {
        const delivered = data.filter(l => l.status === "Delivered");
        setEarnings(delivered);
        setTotal(delivered.reduce((sum, l) => sum + (l.price || 0), 0));
      });
  }, []);

  const filtered = earnings.filter(l =>
    (filter === "All" || l.cargoType === filter) &&
    (l.origin?.toLowerCase().includes(search.toLowerCase()) ||
      l.destination?.toLowerCase().includes(search.toLowerCase()) ||
      l._id?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-bold text-blue-700 mb-4">Earnings</h2>
      <div className="bg-green-100 rounded p-4 mb-6 text-center">
        <div className="text-lg font-semibold">Total Earnings</div>
        <div className="text-3xl">₹{total}</div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 mb-4 items-center">
        <select value={filter} onChange={e => setFilter(e.target.value)} className="border rounded px-3 py-2">
          <option value="All">All Cargo Types</option>
          {/* Optionally map unique cargo types here */}
        </select>
        <input
          type="text"
          placeholder="Search by origin, destination, ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border rounded px-3 py-2 flex-1"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white shadow rounded">
          <thead>
            <tr className="bg-blue-100 text-blue-700">
              <th className="py-2 px-4">Load ID</th>
              <th className="py-2 px-4">Origin</th>
              <th className="py-2 px-4">Destination</th>
              <th className="py-2 px-4">Cargo</th>
              <th className="py-2 px-4">Weight</th>
              <th className="py-2 px-4">Delivered On</th>
              <th className="py-2 px-4">Earning</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(l => (
              <tr key={l._id} className="border-t">
                <td className="py-2 px-4 text-center">{l._id}</td>
                <td className="py-2 px-4 text-center">{l.origin}</td>
                <td className="py-2 px-4 text-center">{l.destination}</td>
                <td className="py-2 px-4 text-center">{l.cargoType}</td>
                <td className="py-2 px-4 text-center">{l.weight} {l.unit || "kg"}</td>
                <td className="py-2 px-4 text-center">{l.deliveryDate}</td>
                <td className="py-2 px-4 text-center">₹{l.price}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="py-4 text-center text-gray-400">No earnings found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Earnings;
