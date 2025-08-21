package com.parkingsystem.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import com.parkingsystem.model.Vehicle;
import com.parkingsystem.repository.VehicleRepository;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@RestController
@RequestMapping("/api/camera")
@CrossOrigin(origins = "http://localhost:3000")
public class CameraController {
    
    @Autowired
    private VehicleRepository vehicleRepository;
    
    @Value("${ai.service.url:http://localhost:5000}")
    private String aiServiceUrl;
    
    private final RestTemplate restTemplate = new RestTemplate();

    @PostMapping("/detect")
    public ResponseEntity<?> detectLicensePlate(@RequestParam("file") MultipartFile file) {
        try {
            // Validate file
            if (file.isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("success", false, "error", "No file uploaded"));
            }

            // Call AI Service (Roboflow)
            String detectUrl = aiServiceUrl + "/detect-file";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);
            
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", file.getResource());
            
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);
            
            ResponseEntity<Map> aiResponse = restTemplate.exchange(
                detectUrl, HttpMethod.POST, requestEntity, Map.class);
            
            Map<String, Object> aiResult = aiResponse.getBody();
            
            if (aiResult != null && Boolean.TRUE.equals(aiResult.get("success"))) {
                String licensePlate = (String) aiResult.get("license_plate");
                Double confidence = ((Number) aiResult.get("confidence")).doubleValue();
                
                // Save to database
                Vehicle vehicle = new Vehicle();
                vehicle.setLicensePlate(licensePlate);
                vehicle.setEntryTime(LocalDateTime.now());
                vehicle.setVehicleType(Vehicle.VehicleType.CAR);
                vehicle.setConfidence(confidence);
                vehicle.setAiMethod((String) aiResult.get("method"));
                
                Vehicle savedVehicle = vehicleRepository.save(vehicle);
                
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "license_plate", licensePlate,
                    "confidence", confidence,
                    "vehicle_id", savedVehicle.getId(),
                    "entry_time", savedVehicle.getEntryTime(),
                    "ai_method", aiResult.get("method"),
                    "message", "Vehicle registered successfully"
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "error", aiResult != null ? aiResult.get("error") : "AI detection failed",
                    "ai_response", aiResult
                ));
            }
            
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("success", false, "error", "Detection failed: " + e.getMessage()));
        }
    }
    
    @PostMapping("/entry")
    public ResponseEntity<?> processEntry(@RequestBody Map<String, Object> entryData) {
        try {
            String licensePlate = (String) entryData.get("licensePlate");
            String vehicleTypeStr = (String) entryData.get("vehicleType");
            Integer floor = (Integer) entryData.get("floor");
            Integer slot = (Integer) entryData.get("slot");
            
            Vehicle.VehicleType vehicleType = mapVehicleType(vehicleTypeStr);
            
            Vehicle vehicle = new Vehicle();
            vehicle.setLicensePlate(licensePlate);
            vehicle.setEntryTime(LocalDateTime.now());
            vehicle.setVehicleType(vehicleType);
            vehicle.setFloor(floor);
            vehicle.setSlot(slot);
            
            Vehicle savedVehicle = vehicleRepository.save(vehicle);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Vehicle entry processed successfully",
                "vehicleId", savedVehicle.getId(),
                "licensePlate", licensePlate,
                "floor", floor,
                "slot", slot,
                "entryTime", savedVehicle.getEntryTime()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("success", false, "error", "Entry processing failed: " + e.getMessage()));
        }
    }
    
    @PostMapping("/exit")
    public ResponseEntity<?> processExit(@RequestBody Map<String, Object> exitData) {
        try {
            String licensePlate = (String) exitData.get("licensePlate");
            
            Optional<Vehicle> vehicleOpt = vehicleRepository.findTopByLicensePlateAndExitTimeIsNullOrderByEntryTimeDesc(licensePlate);
            
            if (vehicleOpt.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "error", "No entry record found for license plate: " + licensePlate
                ));
            }
            
            Vehicle vehicle = vehicleOpt.get();
            LocalDateTime exitTime = LocalDateTime.now();
            vehicle.setExitTime(exitTime);
            
            // Calculate parking duration and fee
            long minutes = ChronoUnit.MINUTES.between(vehicle.getEntryTime(), exitTime);
            vehicle.setParkingDuration((int) minutes);
            
            // Calculate fee based on vehicle type
            double hourlyRate = getHourlyRate(vehicle.getVehicleType());
            long billableHours = Math.max(1, ChronoUnit.HOURS.between(vehicle.getEntryTime(), exitTime) + 
                (ChronoUnit.MINUTES.between(vehicle.getEntryTime(), exitTime) % 60 > 0 ? 1 : 0));
            double parkingFee = billableHours * hourlyRate;
            vehicle.setParkingFee(parkingFee);
            
            Vehicle savedVehicle = vehicleRepository.save(vehicle);
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Vehicle exit processed successfully",
                "vehicleId", savedVehicle.getId(),
                "licensePlate", licensePlate,
                "entryTime", savedVehicle.getEntryTime(),
                "exitTime", savedVehicle.getExitTime(),
                "parkingDuration", savedVehicle.getParkingDuration(),
                "parkingFee", savedVehicle.getParkingFee()
            ));
            
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("success", false, "error", "Exit processing failed: " + e.getMessage()));
        }
    }
    
    @GetMapping("/ai-health")
    public ResponseEntity<?> checkAiHealth() {
        try {
            String healthUrl = aiServiceUrl + "/health";
            ResponseEntity<Map> response = restTemplate.getForEntity(healthUrl, Map.class);
            return ResponseEntity.ok(response.getBody());
        } catch (Exception e) {
            return ResponseEntity.status(503)
                .body(Map.of("status", "error", "message", "AI Service unavailable: " + e.getMessage()));
        }
    }
    
    private Vehicle.VehicleType mapVehicleType(String vehicleType) {
        if (vehicleType == null) return Vehicle.VehicleType.CAR;
        
        switch (vehicleType.toLowerCase()) {
            case "car": return Vehicle.VehicleType.CAR;
            case "motorcycle": return Vehicle.VehicleType.MOTORCYCLE;
            case "bicycle": return Vehicle.VehicleType.BICYCLE;
            case "truck": return Vehicle.VehicleType.TRUCK;
            default: return Vehicle.VehicleType.CAR;
        }
    }
    
    private double getHourlyRate(Vehicle.VehicleType vehicleType) {
        switch (vehicleType) {
            case CAR: return 10000.0;
            case MOTORCYCLE: return 5000.0;
            case BICYCLE: return 2000.0;
            case TRUCK: return 15000.0;
            default: return 10000.0;
        }
    }
}