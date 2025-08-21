import React, { useState, useEffect } from 'react';
import './App.css';
import Navigation from './component/Navigation';
import SmartParking from './component/SmartParking';
import Statistics from './component/Statistics';
import { testConnection } from './services/api';

function App() {
  const [currentPage, setCurrentPage] = useState('parking');
  const [connectionStatus, setConnectionStatus] = useState('testing');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    try {
      setLoading(true);
      const result = await testConnection();
      setConnectionStatus(result.success ? 'connected' : 'error');
    } catch (error) {
      console.error('Connection check failed:', error);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'parking':
        return <SmartParking />;
      case 'statistics':
        return <Statistics />;
      default:
        return <SmartParking />;
    }
  };

  // Show loading screen while checking connections
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang khởi tạo hệ thống...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App min-h-screen bg-gray-50">
      <Navigation 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage}
        connectionStatus={connectionStatus}
      />
      <main className="w-full">
        {renderPage()}
      </main>
    </div>
  );
}

export default App;
