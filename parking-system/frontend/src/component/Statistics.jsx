import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';

const Statistics = () => {
  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
    loadCurrentParking();
  }, []);

  const loadStatistics = async () => {
    try {
      const response = await dashboardAPI.getStatistics();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading statistics:', error);
      // Set mock data if API fails
      setStats({
        totalVehicles: 0,
        currentlyParked: 0,
        availableSpots: 920,
        occupancyRate: 0,
        vehicleTypes: { cars: 0, motorcycles: 0, bicycles: 0 }
      });
    }
  };

  const loadCurrentParking = async () => {
    try {
      const response = await dashboardAPI.getCurrentParking();
      setVehicles(response.data || []);
    } catch (error) {
      console.error('Error loading current parking:', error);
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-600">Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">📊 Thống kê hệ thống</h1>
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Tổng xe đã vào</h3>
            <p className="text-3xl font-bold text-blue-600">{stats?.totalVehicles || 0}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Xe đang đậu</h3>
            <p className="text-3xl font-bold text-green-600">{stats?.currentlyParked || 0}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Chỗ trống</h3>
            <p className="text-3xl font-bold text-purple-600">{stats?.availableSpots || 920}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Tỷ lệ lấp đầy</h3>
            <p className="text-3xl font-bold text-red-600">{stats?.occupancyRate?.toFixed(1) || 0}%</p>
          </div>
        </div>

        {/* Vehicle Types */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Phân loại xe đang đậu</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-4xl mb-2">🚗</div>
                <p className="text-2xl font-bold text-blue-600">{stats?.vehicleTypes?.cars || 0}</p>
                <p className="text-gray-600">Xe hơi</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">🏍️</div>
                <p className="text-2xl font-bold text-green-600">{stats?.vehicleTypes?.motorcycles || 0}</p>
                <p className="text-gray-600">Xe máy</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">🚲</div>
                <p className="text-2xl font-bold text-purple-600">{stats?.vehicleTypes?.bicycles || 0}</p>
                <p className="text-gray-600">Xe đạp</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Vehicles */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">Xe đang đậu ({vehicles.length})</h2>
          </div>
          <div className="p-6">
            {vehicles.length > 0 ? (
              <div className="space-y-4">
                {vehicles.map((vehicle, index) => (
                  <div key={vehicle.id || index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-lg">{vehicle.licensePlate}</p>
                      <p className="text-sm text-gray-600">
                        Vào: {new Date(vehicle.entryTime).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{vehicle.vehicleType}</p>
                      {vehicle.floor && (
                        <p className="text-sm text-blue-600">Tầng {vehicle.floor} - Slot {vehicle.slot}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">🚫</div>
                <p>Không có xe nào đang đậu</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;