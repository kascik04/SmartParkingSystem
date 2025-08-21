import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';
const AI_BASE_URL = 'http://localhost:5000';

// Create axios instances
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

const aiClient = axios.create({
  baseURL: AI_BASE_URL,
  timeout: 30000,
});

// Vehicle API
export const vehicleAPI = {
  getAllVehicles: () => apiClient.get('/vehicles'),
  getVehicleById: (id) => apiClient.get(`/vehicles/${id}`),
  deleteVehicle: (id) => apiClient.delete(`/vehicles/${id}`),
  detectLicensePlate: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/camera/detect', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  checkAIHealth: () => apiClient.get('/camera/ai-health'),
};

// Camera API for SmartParking
export const cameraAPI = {
  processEntry: (data) => {
    return apiClient.post('/camera/entry', {
      licensePlate: data.licensePlate,
      laneId: data.laneId || 1,
      vehicleType: data.vehicleType,
      floor: data.floor,
      slot: data.slot,
      imagePath: data.imagePath
    });
  },
  
  processExit: (data) => {
    return apiClient.post('/camera/exit', {
      licensePlate: data.licensePlate,
      laneId: data.laneId || 2
    });
  },
  
  detectLicensePlate: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/camera/detect', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
};

// Dashboard API
export const dashboardAPI = {
  getStatistics: () => apiClient.get('/dashboard/statistics'),
  getCurrentParking: () => apiClient.get('/dashboard/current-parking'),
};

// Direct AI Service API
export const aiAPI = {
  detectLicensePlate: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return aiClient.post('/detect-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  checkHealth: () => aiClient.get('/health'),
  test: () => aiClient.get('/test'),
};

// Test connection function
export const testConnection = async () => {
  try {
    const backendResponse = await apiClient.get('/dashboard/statistics');
    const aiResponse = await aiClient.get('/health');
    
    return {
      success: true,
      backend: { status: 'connected', data: backendResponse.data },
      ai: { status: aiResponse.data.status || 'connected', data: aiResponse.data }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      backend: error.response ? 'error' : 'offline',
      ai: 'unknown'
    };
  }
};

export default apiClient;