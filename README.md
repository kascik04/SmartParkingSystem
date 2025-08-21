# 🚗 Smart Parking System - Hệ Thống Bãi Xe Thông Minh

## 📋 Tóm Tắt Dự Án | Project Overview

**Smart Parking System** là một hệ thống quản lý bãi xe thông minh sử dụng công nghệ AI để tự động nhận diện biển số xe, quản lý vào/ra và tính toán phí đỗ xe. Dự án được phát triển với kiến trúc microservices hiện đại, tích hợp Deep Learning và Computer Vision.

**Smart Parking System** is an intelligent parking management system that uses AI technology for automatic license plate recognition, entry/exit management, and parking fee calculation. The project is developed with modern microservices architecture, integrating Deep Learning and Computer Vision.

## 🎯 Mục Tiêu Dự Án | Project Objectives

- **Tự động hóa**: Giảm thiểu can thiệp thủ công trong quản lý bãi xe
- **Chính xác**: Sử dụng AI để nhận diện biển số với độ chính xác cao
- **Hiệu quả**: Tối ưu hóa quy trình vào/ra và quản lý chỗ đỗ
- **Thân thiện**: Giao diện người dùng trực quan, dễ sử dụng

## 🛠️ Công Nghệ Sử Dụng | Technology Stack

### Frontend
- **React.js 18.2+** - Modern UI framework
- **TailwindCSS 3.3+** - Utility-first CSS framework
- **Axios** - HTTP client for API communication
- **React Router** - Client-side routing

### Backend
- **Spring Boot 3.5+** - Java enterprise framework
- **Spring Data JPA** - Database abstraction layer
- **Spring Security** - Authentication and authorization
- **MySQL** - Relational database
- **Maven** - Dependency management

### AI Service
- **Python Flask** - Lightweight web framework
- **YOLOv8** - Real-time object detection
- **EasyOCR** - Optical Character Recognition
- **OpenCV** - Computer vision library
- **Roboflow** - Dataset management and model training

### DevOps & Tools
- **Docker** (Ready) - Containerization
- **Git** - Version control
- **RESTful APIs** - Service communication
- **CORS** - Cross-origin resource sharing

## 🏗️ Kiến Trúc Hệ Thống | System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   AI Service    │
│   (React.js)    │◄──►│  (Spring Boot)  │◄──►│   (Python)      │
│   Port: 3000    │    │   Port: 8080    │    │   Port: 5000    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │     MySQL       │
                       │    Database     │
                       └─────────────────┘
```

## ✨ Tính Năng Chính | Key Features

### 🔍 Nhận Diện Biển Số Thông Minh
- **YOLO Object Detection**: Phát hiện vùng biển số trong ảnh
- **OCR Technology**: Trích xuất text từ biển số
- **Vietnamese License Plate Support**: Hỗ trợ định dạng biển số Việt Nam
- **Multiple Format Recognition**: Ô tô, xe máy, xe đạp

### 🚪 Quản Lý Vào/Ra Tự Động
- **Automatic Entry Processing**: Xử lý xe vào tự động
- **Exit Fee Calculation**: Tính toán phí đỗ xe theo thời gian
- **Real-time Slot Management**: Quản lý chỗ đỗ theo thời gian thực
- **Multi-floor Support**: Hỗ trợ 4 tầng với 250 chỗ đỗ/tầng

### 📊 Thống Kê và Báo Cáo
- **Real-time Statistics**: Thống kê theo thời gian thực
- **Parking History**: Lịch sử xe vào/ra
- **Revenue Tracking**: Theo dõi doanh thu
- **Occupancy Analytics**: Phân tích tỷ lệ sử dụng

### 🎨 Giao Diện Người Dùng
- **Responsive Design**: Tương thích mọi thiết bị
- **Vietnamese Interface**: Giao diện tiếng Việt
- **Intuitive Navigation**: Điều hướng trực quan
- **Real-time Updates**: Cập nhật theo thời gian thực

## 🚀 Cài Đặt và Chạy | Installation & Setup

### Yêu Cầu Hệ Thống | System Requirements
- **Node.js** 16+ 
- **Java** 17+
- **Python** 3.8+
- **MySQL** 8.0+
- **Maven** 3.6+

### Cài Đặt | Installation

#### 1. Clone Repository
```bash
git clone https://github.com/kascik04/SmartParkingSystem.git
cd SmartParkingSystem
```

#### 2. Setup Database
```sql
CREATE DATABASE parking_system;
CREATE USER 'parking_user'@'localhost' IDENTIFIED BY 'parking_pass';
GRANT ALL PRIVILEGES ON parking_system.* TO 'parking_user'@'localhost';
```

#### 3. Backend Setup
```bash
cd parking-system/backend
mvn clean install
mvn spring-boot:run
```

#### 4. AI Service Setup
```bash
cd parking-system/ai-service
pip install -r requirements.txt
python app.py
```

#### 5. Frontend Setup
```bash
cd parking-system/frontend
npm install
npm start
```

### Truy Cập Ứng Dụng | Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **AI Service**: http://localhost:5000

## 📝 API Documentation

### Vehicle Management
- `GET /api/vehicles` - Lấy danh sách xe
- `POST /api/vehicles/entry` - Xử lý xe vào
- `POST /api/vehicles/exit/{id}` - Xử lý xe ra
- `POST /api/vehicles/detect-license` - Nhận diện biển số

### AI Service
- `POST /detect-file` - Nhận diện biển số từ file ảnh
- `GET /health` - Kiểm tra trạng thái service

## 🎓 Kỹ Năng Thể Hiện | Skills Demonstrated

### Technical Skills
- **Full-stack Development**: Frontend + Backend + AI integration
- **Microservices Architecture**: Scalable system design
- **AI/ML Integration**: Computer vision and deep learning
- **Database Design**: Relational database modeling
- **API Development**: RESTful web services
- **Version Control**: Git workflow management

### Programming Languages
- **JavaScript/TypeScript**: Modern web development
- **Java**: Enterprise application development  
- **Python**: AI/ML and data processing
- **SQL**: Database queries and optimization

### Frameworks & Libraries
- **React.js**: Component-based UI development
- **Spring Boot**: Enterprise Java development
- **Flask**: Python web framework
- **TailwindCSS**: Modern CSS framework

### AI/ML Technologies
- **Computer Vision**: Object detection and image processing
- **Deep Learning**: YOLO model implementation
- **OCR**: Text extraction from images
- **Model Training**: Custom dataset preparation

## 🏆 Điểm Nổi Bật | Highlights

1. **Innovative Solution**: Giải pháp sáng tạo cho bài toán thực tế
2. **Modern Architecture**: Kiến trúc microservices hiện đại
3. **AI Integration**: Tích hợp AI/ML một cách hiệu quả
4. **Vietnamese Localization**: Tối ưu cho thị trường Việt Nam
5. **Scalable Design**: Thiết kế có thể mở rộng
6. **User-Centric**: Tập trung vào trải nghiệm người dùng

## 📞 Liên Hệ | Contact

**Developer**: [Your Name]
- **GitHub**: [kascik04](https://github.com/kascik04)
- **Email**: [Your Email]
- **LinkedIn**: [Your LinkedIn]

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Dự án này thể hiện khả năng phát triển full-stack, tích hợp AI/ML, và giải quyết bài toán thực tế trong lĩnh vực công nghệ thông minh.*

*This project demonstrates full-stack development capabilities, AI/ML integration, and real-world problem-solving in smart technology domain.*