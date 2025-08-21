import React from 'react';

const Navigation = ({ currentPage, setCurrentPage, connectionStatus }) => {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-yellow-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Kết nối';
      case 'error': return 'Lỗi kết nối';
      default: return 'Đang kiểm tra...';
    }
  };

  return (
    <nav className="bg-white shadow-lg border-b-2 border-blue-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="text-3xl">🏢</div>
            <div>
              <h1 className="text-xl font-bold text-gray-800">Smart Parking System</h1>
              <p className="text-sm text-gray-600">Hệ thống quản lý bãi đỗ xe thông minh</p>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentPage('parking')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'parking'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🚗 Quản lý xe
            </button>
            <button
              onClick={() => setCurrentPage('statistics')}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'statistics'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📊 Thống kê
            </button>
          </div>

          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`}></div>
            <span className="text-sm font-medium text-gray-700">
              {getStatusText()}
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;