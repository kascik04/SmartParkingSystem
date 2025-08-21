import React, { useState, useEffect } from 'react';
import { cameraAPI } from '../services/api';

const SmartParking = () => {
  const [loading, setLoading] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState({
    licensePlate: '',
    entryTime: '',
    exitTime: '',
    parkingFee: 0,
    parkingDuration: 0,
    floor: null,
    slot: null,
    vehicleType: 'car'
  });

  const [selectedVehicleType, setSelectedVehicleType] = useState('car');
  const [selectedFloor, setSelectedFloor] = useState(1);

  const [cameraImages, setCameraImages] = useState({
    entryFront: null,
    entryRear: null,
    exitFront: null,
    exitRear: null
  });

  const [floorsData, setFloorsData] = useState([
    { floor: 1, total: 250, occupied: 1, available: 249 },
    { floor: 2, total: 250, occupied: 0, available: 250 },
    { floor: 3, total: 220, occupied: 0, available: 220 },
    { floor: 4, total: 200, occupied: 0, available: 200 }
  ]);

  const [aiServiceStatus, setAiServiceStatus] = useState('checking');

  const vehicleTypes = [
    { id: 'car', name: 'Xe hơi', fee: 10000 },
    { id: 'motorcycle', name: 'Xe máy', fee: 5000 },
    { id: 'bicycle', name: 'Xe đạp', fee: 2000 }
  ];

  useEffect(() => {
    checkAIService();
    const interval = setInterval(checkAIService, 10000);
    return () => clearInterval(interval);
  }, []);

  const checkAIService = async () => {
    try {
      setAiServiceStatus('checking');
      
      const response = await fetch('http://localhost:5000/health', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000
      });

      if (response.ok) {
        setAiServiceStatus('connected');
      } else {
        setAiServiceStatus('disconnected');
      }
    } catch (error) {
      setAiServiceStatus('disconnected');
    }
  };

  const generateBicycleCode = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    return `XD-${randomNum}`;
  };

  const handleImageUpload = (cameraId, event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('File quá lớn. Vui lòng chọn file dưới 10MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setCameraImages(prev => ({
          ...prev,
          [cameraId]: {
            file,
            preview: e.target.result,
            fileName: file.name
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const detectLicensePlateAI = async (imageFile) => {
    try {
      const formData = new FormData();
      formData.append('file', imageFile);

      const response = await fetch('http://localhost:5000/detect-file', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`AI Service error: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.license_plate) {
        return result;
      } else {
        throw new Error(result.error || 'Detection failed');
      }

    } catch (error) {
      console.error('AI detection error:', error);
      throw error;
    }
  };

  const processVehicleEntry = async () => {
    const frontImage = cameraImages.entryFront;
    const rearImage = cameraImages.entryRear;
    
    if (selectedVehicleType === 'bicycle') {
      if (!frontImage) {
        alert('Vui lòng thêm ảnh cho xe đạp');
        return;
      }
    } else {
      if (!frontImage && !rearImage) {
        alert('Vui lòng thêm ảnh để xử lý');
        return;
      }
    }

    setLoading(true);
    try {
      let licensePlate;

      if (selectedVehicleType === 'bicycle') {
        licensePlate = generateBicycleCode();
      } else {
        const imageToProcess = frontImage || rearImage;
        const aiResult = await detectLicensePlateAI(imageToProcess.file);
        
        if (aiResult.success && aiResult.license_plate) {
          licensePlate = aiResult.license_plate;
        } else {
          throw new Error('Không thể nhận diện biển số');
        }
      }

      const now = new Date();
      const targetFloor = floorsData.find(floor => floor.floor === selectedFloor);
      let availableFloor = targetFloor;
      
      if (!availableFloor || availableFloor.available === 0) {
        availableFloor = floorsData.find(floor => floor.available > 0);
      }
      
      const slotNumber = availableFloor ? (availableFloor.occupied + 1) : null;

      setCurrentVehicle({
        licensePlate: licensePlate,
        entryTime: now.toLocaleString('vi-VN'),
        exitTime: '',
        parkingFee: 0,
        parkingDuration: 0,
        floor: availableFloor?.floor || null,
        slot: slotNumber,
        vehicleType: selectedVehicleType
      });

      if (availableFloor) {
        setFloorsData(prev => prev.map(floor => 
          floor.floor === availableFloor.floor 
            ? { ...floor, occupied: floor.occupied + 1, available: floor.available - 1 }
            : floor
        ));
      }

      try {
        await cameraAPI.processEntry({
          licensePlate: licensePlate,
          laneId: 1,
          vehicleType: selectedVehicleType,
          floor: availableFloor?.floor,
          imagePath: `entry_${Date.now()}.jpg`
        });
      } catch (backendError) {
        console.warn('Backend entry processing failed:', backendError);
      }

      const vehicleTypeName = vehicleTypes.find(vt => vt.id === selectedVehicleType)?.name || 'Xe';
      let message = `XE VÀO THÀNH CÔNG\n\n`;
      message += `Loại xe: ${vehicleTypeName}\n`;
      message += `Biển số: ${licensePlate}\n`;
      message += `Tầng: ${availableFloor?.floor || 'N/A'}\n`;
      message += `Slot: ${slotNumber || 'N/A'}\n`;
      message += `Thời gian vào: ${now.toLocaleString('vi-VN')}`;

      alert(message);

    } catch (error) {
      console.error('Entry processing error:', error);
      alert('Lỗi khi xử lý xe vào: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const processVehicleExit = async () => {
    const frontImage = cameraImages.exitFront;
    const rearImage = cameraImages.exitRear;
    
    if (!frontImage && !rearImage) {
      alert('Vui lòng thêm ảnh để xử lý');
      return;
    }

    if (!currentVehicle.licensePlate) {
      alert('Không có thông tin xe để xử lý ra. Vui lòng xử lý xe vào trước.');
      return;
    }

    setLoading(true);
    try {
      let licensePlate = currentVehicle.licensePlate;
      
      if (frontImage || rearImage) {
        try {
          const imageToProcess = frontImage || rearImage;
          const aiResult = await detectLicensePlateAI(imageToProcess.file);
          
          if (aiResult.success && aiResult.license_plate) {
            const detectedPlate = aiResult.license_plate;
            
            if (detectedPlate !== currentVehicle.licensePlate) {
              const confirmUseDetected = window.confirm(
                `Biển số nhận diện được khác với biển số đã lưu:\n\n` +
                `Nhận diện: ${detectedPlate}\n` +
                `Đã lưu: ${currentVehicle.licensePlate}\n\n` +
                `Sử dụng biển số nhận diện được?`
              );
              
              if (confirmUseDetected) {
                licensePlate = detectedPlate;
              }
            }
          }
        } catch (detectError) {
          console.warn('Detection failed during exit, using stored license plate');
        }
      }

      const now = new Date();
      const entryTime = new Date(currentVehicle.entryTime);
      
      const durationMs = now.getTime() - entryTime.getTime();
      const durationMinutes = Math.floor(durationMs / (1000 * 60));
      const durationHours = durationMs / (1000 * 60 * 60);
      
      const vehicleType = vehicleTypes.find(vt => vt.id === currentVehicle.vehicleType);
      const hourlyRate = vehicleType?.fee || 10000;
      
      const billableHours = Math.max(1, Math.ceil(durationHours));
      const parkingFee = billableHours * hourlyRate;

      const updatedVehicle = {
        ...currentVehicle,
        exitTime: now.toLocaleString('vi-VN'),
        parkingFee: parkingFee,
        parkingDuration: durationMinutes,
        licensePlate: licensePlate
      };
      
      setCurrentVehicle(updatedVehicle);

      if (currentVehicle.floor) {
        setFloorsData(prev => prev.map(floor => 
          floor.floor === currentVehicle.floor 
            ? { ...floor, occupied: Math.max(0, floor.occupied - 1), available: floor.available + 1 }
            : floor
        ));
      }

      try {
        await cameraAPI.processExit({
          licensePlate: licensePlate,
          laneId: 2
        });
      } catch (backendError) {
        console.warn('Backend exit processing failed');
      }

      let message = `XE RA THÀNH CÔNG\n\n`;
      message += `Biển số: ${licensePlate}\n`;
      message += `Thời gian vào: ${currentVehicle.entryTime}\n`;
      message += `Thời gian ra: ${now.toLocaleString('vi-VN')}\n`;
      message += `Thời gian đỗ: ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m\n`;
      message += `Phí đỗ xe: ${new Intl.NumberFormat('vi-VN').format(parkingFee)} VND`;

      alert(message);

    } catch (error) {
      console.error('Exit processing error:', error);
      alert('Lỗi khi xử lý xe ra: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setCurrentVehicle({
      licensePlate: '',
      entryTime: '',
      exitTime: '',
      parkingFee: 0,
      parkingDuration: 0,
      floor: null,
      slot: null,
      vehicleType: 'car'
    });
    setCameraImages({
      entryFront: null,
      entryRear: null,
      exitFront: null,
      exitRear: null
    });
    setSelectedVehicleType('car');
    setSelectedFloor(1);
  };

  const CameraBox = ({ cameraId, title, bgColor = "bg-gray-50" }) => {
    const image = cameraImages[cameraId];
    
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
        <div className={`${bgColor} text-gray-700 text-center py-2 text-sm font-semibold`}>
          {title}
        </div>
        <div
          className="h-48 bg-gray-50 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors relative"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => handleImageUpload(cameraId, e);
            input.click();
          }}
        >
          {image ? (
            <>
              <img
                src={image.preview}
                alt={title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all flex items-center justify-center">
                <span className="text-white opacity-0 hover:opacity-100 font-medium text-sm bg-black bg-opacity-70 px-3 py-1 rounded">
                  Thay đổi ảnh
                </span>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">📷</div>
              <p className="text-sm font-medium">Nhấp để chọn ảnh</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-gray-50 to-blue-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white py-6 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Hệ thống quản lý bãi đỗ xe</h1>
              <p className="text-blue-200 text-sm">Smart Parking System</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className={`px-4 py-2 rounded-full text-sm font-medium flex items-center shadow-lg ${
                aiServiceStatus === 'connected' ? 'bg-green-500 text-white' : 
                aiServiceStatus === 'disconnected' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-black'
              }`}>
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  aiServiceStatus === 'connected' ? 'bg-green-200' : 
                  aiServiceStatus === 'disconnected' ? 'bg-red-200' : 'bg-yellow-200'
                }`}></div>
                AI: {aiServiceStatus === 'connected' ? 'Kết nối' : 
                     aiServiceStatus === 'disconnected' ? 'Mất kết nối' : 'Đang kiểm tra...'}
              </div>
              <div className="text-sm font-medium bg-blue-700 bg-opacity-80 px-4 py-2 rounded-full shadow-lg">
                {new Date().toLocaleString('vi-VN')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Top Controls */}
        <div className="mb-6 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="grid grid-cols-12 gap-6 items-center">
            <div className="col-span-5">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Loại xe:
              </label>
              <select
                value={selectedVehicleType}
                onChange={(e) => setSelectedVehicleType(e.target.value)}
                className="w-full px-4 py-3 bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200 rounded-lg focus:ring-4 focus:ring-blue-300 focus:border-blue-500 transition-all duration-200 text-gray-800 font-medium"
              >
                {vehicleTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name} - {new Intl.NumberFormat('vi-VN').format(type.fee)} VND/giờ
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-5">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tầng ưu tiên:
              </label>
              <select
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(parseInt(e.target.value))}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100 border-2 border-purple-200 rounded-lg focus:ring-4 focus:ring-purple-300 focus:border-purple-500 transition-all duration-200 text-gray-800 font-medium"
              >
                {floorsData.map(floor => (
                  <option key={floor.floor} value={floor.floor} disabled={floor.available === 0}>
                    Tầng {floor.floor} - {floor.available > 0 ? `${floor.available} slot còn trống` : 'Hết chỗ'}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-3 opacity-0">
                Action
              </label>
              <button
                onClick={clearAll}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-500 hover:from-gray-700 hover:to-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          
          {/* Entry Lane */}
          <div className="col-span-4">
            <div className="bg-white rounded-xl shadow-xl border border-green-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-500 text-white text-center py-4">
                <h2 className="text-xl font-bold">LÀN XE VÀO</h2>
              </div>
              
              <div className="p-4 space-y-4">
                <CameraBox
                  cameraId="entryFront"
                  title="Camera Trước - Xe Vào"
                  bgColor="bg-green-100"
                />
                
                {selectedVehicleType !== 'bicycle' && (
                  <CameraBox
                    cameraId="entryRear"
                    title="Camera Sau - Xe Vào"
                    bgColor="bg-green-100"
                  />
                )}
                
                <button
                  onClick={processVehicleEntry}
                  disabled={loading}
                  className={`w-full py-4 px-4 rounded-lg font-bold text-lg transition-all duration-300 transform ${
                    loading 
                      ? 'bg-gray-400 cursor-not-allowed text-gray-600 scale-95' 
                      : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </span>
                  ) : (
                    'XE VÀO'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Exit Lane */}
          <div className="col-span-4">
            <div className="bg-white rounded-xl shadow-xl border border-red-200 overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-500 text-white text-center py-4">
                <h2 className="text-xl font-bold">LÀN XE RA</h2>
              </div>
              
              <div className="p-4 space-y-4">
                <CameraBox
                  cameraId="exitFront"
                  title="Camera Trước - Xe Ra"
                  bgColor="bg-red-100"
                />
                
                <CameraBox
                  cameraId="exitRear"
                  title="Camera Sau - Xe Ra"
                  bgColor="bg-red-100"
                />
                
                <button
                  onClick={processVehicleExit}
                  disabled={loading}
                  className={`w-full py-4 px-4 rounded-lg font-bold text-lg transition-all duration-300 transform ${
                    loading 
                      ? 'bg-gray-400 cursor-not-allowed text-gray-600 scale-95' 
                      : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang xử lý...
                    </span>
                  ) : (
                    'XE RA'
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Vehicle Information */}
          <div className="col-span-4">
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-center py-4 rounded-t-xl">
                <h2 className="text-lg font-bold">THÔNG TIN XE</h2>
              </div>
              <div className="p-4 space-y-3">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Loại xe
                  </label>
                  <div className="text-sm text-center font-medium">
                    {currentVehicle.vehicleType ? (
                      vehicleTypes.find(vt => vt.id === currentVehicle.vehicleType)?.name
                    ) : (
                      <span className="text-gray-400">Chưa có xe</span>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border-2 border-blue-200">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Biển số/Mã xe
                  </label>
                  <div className="text-lg font-bold text-center text-blue-800">
                    {currentVehicle.licensePlate || '---'}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Thời gian vào
                  </label>
                  <div className="text-sm text-center">
                    {currentVehicle.entryTime || '--'}
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Thời gian ra
                  </label>
                  <div className="text-sm text-center">
                    {currentVehicle.exitTime || '--'}
                  </div>
                </div>

                <div className="bg-purple-50 rounded-lg p-3 border-2 border-purple-200">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Vị trí đỗ
                  </label>
                  <div className="text-sm text-center font-medium text-purple-800">
                    {currentVehicle.floor && currentVehicle.slot 
                      ? `Tầng ${currentVehicle.floor} - Slot ${currentVehicle.slot}`
                      : <span className="text-gray-400">Chưa có</span>
                    }
                  </div>
                </div>

                <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-3 border-2 border-red-200">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Phí đỗ xe (VND)
                  </label>
                  <div className="text-xl font-bold text-center text-red-600">
                    {currentVehicle.parkingFee > 0 
                      ? new Intl.NumberFormat('vi-VN').format(currentVehicle.parkingFee)
                      : '0'
                    }
                  </div>
                </div>

                {currentVehicle.parkingDuration > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-3 border-2 border-yellow-200">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Thời gian đỗ
                    </label>
                    <div className="text-sm text-center font-medium text-yellow-800">
                      {Math.floor(currentVehicle.parkingDuration / 60)}h {currentVehicle.parkingDuration % 60}m
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Floor Statistics */}
        <div className="mt-6 bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="bg-gradient-to-r from-gray-700 to-gray-600 text-white text-center py-4 rounded-t-xl">
            <h2 className="text-lg font-bold">THỐNG KÊ CÁC TẦNG</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-4 gap-6">
              {floorsData.map((floor) => (
                <div key={floor.floor} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 border-2 border-gray-200 hover:border-blue-300 transition-colors duration-200">
                  <div className="text-center font-bold text-gray-700 mb-4 text-xl">
                    TẦNG {floor.floor}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Tổng:</span>
                      <span className="font-bold text-blue-600 text-lg">{floor.total}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Đã đỗ:</span>
                      <span className="font-bold text-red-600 text-lg">{floor.occupied}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Còn trống:</span>
                      <span className="font-bold text-green-600 text-lg">{floor.available}</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
                      <div 
                        className={`h-4 rounded-full transition-all duration-500 ${
                          floor.occupied === 0 ? 'bg-green-400' :
                          (floor.occupied / floor.total) < 0.5 ? 'bg-gradient-to-r from-green-400 to-yellow-400' :
                          (floor.occupied / floor.total) < 0.8 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                          'bg-gradient-to-r from-orange-400 to-red-400'
                        }`}
                        style={{ width: `${floor.total > 0 ? (floor.occupied / floor.total) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-center text-gray-600 font-medium">
                      {floor.total > 0 ? ((floor.occupied / floor.total) * 100).toFixed(1) : 0}% đã sử dụng
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartParking;