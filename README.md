# 🚗 Smart Parking System 

## 📋 Project Overview

**Smart Parking System** is an intelligent parking management system that uses AI technology for automatic license plate recognition, entry/exit management, and parking fee calculation. The project is developed with modern microservices architecture, integrating Deep Learning and Computer Vision.

## 🎯 Project Objectives

**Automation**: Minimize manual intervention in parking management- 
**Accuracy**: Use AI to recognize license plates with high precision
**Efficiency**: Optimize entrance/exit processes and parking space management
**User-friendly**: Intuitive, easy-to-use user interface

## 🛠️ Technology Stack

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

## 🏗️ System Architecture

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

##  Key Features

### 🔍 License Plate Detection
- **YOLO Object Detection**: Detects license plate areas in images
- **OCR Technology**: Extracts text from license plates
- **Vietnamese License Plate Support**: Supports Vietnamese license plate formats
- **Multiple Format Recognition**: Cars, motorbikes, bicycles

### 🚪 Automated Entry/Exit Management
- **Automatic Entry Processing**
- **Exit Fee Calculation**
- **Real-time Slot Management**
- **Multi-floor Support**

### 📊 Statistics
- **Real-time Statistics**
- **Parking History**
- **Revenue Tracking**
- **Occupancy Analytics**

### 🎨 UX/UI
- **Responsive Design**
- **Vietnamese Interface**
- **Intuitive Navigation**
- **Real-time Updates**

## 🚀 Installation & Setup

### System Requirements
- **Node.js** 16+ 
- **Java** 17+
- **Python** 3.8+
- **MySQL** 8.0+
- **Maven** 3.6+

###  Installation

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

###  Access Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **AI Service**: http://localhost:5000

## 📝 API Documentation

### Vehicle Management
- `GET /api/vehicles` 
- `POST /api/vehicles/entry` 
- `POST /api/vehicles/exit/{id}` 
- `POST /api/vehicles/detect-license` 

### AI Service
- `POST /detect-file` 
- `GET /health` 

## 🎓 Skills Demonstrated

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

## 🏆 Highlights

1. **Innovative Solution**: Giải pháp sáng tạo cho bài toán thực tế
2. **Modern Architecture**: Kiến trúc microservices hiện đại
3. **AI Integration**: Tích hợp AI/ML một cách hiệu quả
4. **Vietnamese Localization**: Tối ưu cho thị trường Việt Nam
5. **Scalable Design**: Thiết kế có thể mở rộng
6. **User-Centric**: Tập trung vào trải nghiệm người dùng

## 📞 Contact

**Developer**: Tran Minh Khang
- **GitHub**: [kascik04](https://github.com/kascik04)
- **Email**: tmkhang.444@gmail.com


---

*This project demonstrates full-stack development capabilities, AI/ML integration, and real-world problem-solving in smart technology domain.*
