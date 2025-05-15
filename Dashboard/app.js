// Fetch and render vehicle/driver data
const API_URL = 'http://localhost:5000/api/vehicle/list/all';

const tableBody = document.querySelector('#vehiclesTable tbody');
const searchInput = document.getElementById('searchInput');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const closeModal = document.getElementById('closeModal');

// Fetch all vehicles and drivers
async function fetchVehicles() {
  try {
    console.log('Fetching from:', API_URL); // Debug log
    const response = await fetch(API_URL);
    console.log('Response status:', response.status); // Debug log
    
    const data = await response.json();
    console.log('Received data:', data); // Debug log
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    // Check if vehicles array exists and is not empty
    if (data.vehicles && Array.isArray(data.vehicles)) {
      renderVehicles(data.vehicles);
    } else {
      tableBody.innerHTML = '<tr><td colspan="9" class="info">No vehicles found in the system.</td></tr>';
    }
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    tableBody.innerHTML = '<tr><td colspan="9" class="error">Error loading vehicles. Please try again later.</td></tr>';
  }
}

// Render vehicles table
function renderVehicles(vehicles) {
  tableBody.innerHTML = vehicles.map((vehicle, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${vehicle.ownerName}</td>
      <td>${vehicle.driverName}</td>
      <td>${vehicle.vehicleNumber}</td>
      <td>${vehicle.vehicleName}</td>
      <td>${vehicle.capacity}</td>
      <td>
        <span class="status-badge ${vehicle.status.toLowerCase()}">
          ${vehicle.status}
        </span>
      </td>
      <td>
        <button onclick="viewDocuments('${vehicle.id}')" class="btn-view">
          View Documents
        </button>
      </td>
      <td>
        <button onclick="updateStatus('${vehicle.id}', 'Activated')" class="btn-activate" ${vehicle.status === 'Activated' ? 'disabled' : ''}>
          Activate
        </button>
        <button onclick="updateStatus('${vehicle.id}', 'Rejected')" class="btn-reject" ${vehicle.status === 'Rejected' ? 'disabled' : ''}>
          Reject
        </button>
      </td>
    </tr>
  `).join('');
}

// Search functionality
searchInput.addEventListener('input', (e) => {
  const searchTerm = e.target.value.toLowerCase();
  const rows = tableBody.getElementsByTagName('tr');
  
  Array.from(rows).forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchTerm) ? '' : 'none';
  });
});

// View documents in modal
async function viewDocuments(vehicleId) {
  try {
    const response = await fetch(`${API_URL}/${vehicleId}`);
    const vehicle = await response.json();
    
    const documentsList = Object.entries(vehicle.documents)
      .filter(([, value]) => value) // Only show uploaded documents
      .map(([key, value]) => `
        <div class="document-item">
          <span class="document-label">${key.replace(/([A-Z])/g, ' $1').trim()}:</span>
          <a href="http://localhost:5000/${value}" target="_blank" class="document-link">View</a>
        </div>
      `).join('');

    modalBody.innerHTML = `
      <h2>Documents for ${vehicle.vehicleNumber}</h2>
      <div class="documents-grid">
        ${documentsList}
      </div>
    `;
    modal.classList.remove('hidden');
  } catch (error) {
    console.error('Error fetching documents:', error);
    alert('Error loading documents. Please try again.');
  }
}

// Update vehicle status
async function updateStatus(vehicleId, newStatus) {
  try {
    const response = await fetch(`${API_URL}/${vehicleId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: newStatus })
    });

    if (response.ok) {
      fetchVehicles(); // Refresh the table
    } else {
      throw new Error('Failed to update status');
    }
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Error updating vehicle status. Please try again.');
  }
}

// Modal close button
closeModal.addEventListener('click', () => {
  modal.classList.add('hidden');
});

// Close modal when clicking outside
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.classList.add('hidden');
  }
});

// Initial load
fetchVehicles();
