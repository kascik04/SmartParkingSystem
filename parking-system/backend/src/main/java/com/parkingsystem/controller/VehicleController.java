package com.parkingsystem.controller;

import com.parkingsystem.model.Vehicle;
import com.parkingsystem.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/vehicles")
@CrossOrigin(origins = "*")
public class VehicleController {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Value("${ai.service.url:http://localhost:5000}")
    private String aiServiceUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping
    public List<Vehicle> getAllVehicles() {
        return vehicleRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Vehicle> getVehicleById(@PathVariable Long id) {
        Optional<Vehicle> vehicle = vehicleRepository.findById(id);
        return vehicle.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Vehicle createVehicle(@RequestBody Vehicle vehicle) {
        vehicle.setEntryTime(LocalDateTime.now());
        return vehicleRepository.save(vehicle);
    }

    @PostMapping("/detect-license")
    public ResponseEntity<Map<String, Object>> detectLicensePlate(@RequestParam("image") MultipartFile image) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            if (image.isEmpty()) {
                response.put("success", false);
                response.put("message", "No image provided");
                return ResponseEntity.badRequest().body(response);
            }

            // Gọi AI service
            String aiUrl = aiServiceUrl + "/detect-file";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.MULTIPART_FORM_DATA);

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", image.getResource());

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> aiResponse = restTemplate.exchange(
                aiUrl, 
                HttpMethod.POST, 
                requestEntity, 
                Map.class
            );

            if (aiResponse.getStatusCode() == HttpStatus.OK) {
                Map<String, Object> aiResult = aiResponse.getBody();
                
                if (aiResult != null && Boolean.TRUE.equals(aiResult.get("success"))) {
                    response.put("success", true);
                    response.put("license_plate", aiResult.get("license_plate"));
                    response.put("confidence", aiResult.get("confidence"));
                    response.put("message", "License plate detected successfully");
                } else {
                    response.put("success", false);
                    response.put("message", aiResult != null ? 
                        (String) aiResult.get("message") : "Failed to detect license plate");
                }
            } else {
                response.put("success", false);
                response.put("message", "AI service unavailable");
            }

        } catch (Exception e) {
            System.err.println("Error calling AI service: " + e.getMessage());
            response.put("success", false);
            response.put("message", "Error processing image: " + e.getMessage());
        }

        return ResponseEntity.ok(response);
    }

    @PostMapping("/entry")
    public ResponseEntity<Map<String, Object>> vehicleEntry(@RequestBody Map<String, Object> entryData) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            String licensePlate = (String) entryData.get("licensePlate");
            String vehicleType = (String) entryData.get("vehicleType");
            Long slotId = Long.valueOf(entryData.get("slotId").toString());
            
            // Kiểm tra xe đã có trong hệ thống chưa
            Optional<Vehicle> existingVehicle = vehicleRepository.findByLicensePlateAndExitTimeIsNull(licensePlate);
            
            if (existingVehicle.isPresent()) {
                response.put("success", false);
                response.put("message", "Vehicle is already parked");
                return ResponseEntity.badRequest().body(response);
            }
            
            // Tạo vehicle mới
            Vehicle vehicle = new Vehicle();
            vehicle.setLicensePlate(licensePlate);
            vehicle.setVehicleType(Vehicle.VehicleType.valueOf(vehicleType.toUpperCase()));
            vehicle.setSlotId(slotId);
            vehicle.setEntryTime(LocalDateTime.now());
            
            Vehicle savedVehicle = vehicleRepository.save(vehicle);
            
            response.put("success", true);
            response.put("vehicle", savedVehicle);
            response.put("message", "Vehicle entry recorded successfully");
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error recording vehicle entry: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/exit/{id}")
    public ResponseEntity<Map<String, Object>> vehicleExit(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Optional<Vehicle> vehicleOpt = vehicleRepository.findById(id);
            
            if (vehicleOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Vehicle not found");
                return ResponseEntity.notFound().build();
            }
            
            Vehicle vehicle = vehicleOpt.get();
            if (vehicle.getExitTime() != null) {
                response.put("success", false);
                response.put("message", "Vehicle has already exited");
                return ResponseEntity.badRequest().body(response);
            }
            
            vehicle.setExitTime(LocalDateTime.now());
            Vehicle updatedVehicle = vehicleRepository.save(vehicle);
            
            response.put("success", true);
            response.put("vehicle", updatedVehicle);
            response.put("message", "Vehicle exit recorded successfully");
            
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error recording vehicle exit: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Vehicle> updateVehicle(@PathVariable Long id, @RequestBody Vehicle vehicleDetails) {
        Optional<Vehicle> vehicleOpt = vehicleRepository.findById(id);
        
        if (vehicleOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Vehicle vehicle = vehicleOpt.get();
        vehicle.setLicensePlate(vehicleDetails.getLicensePlate());
        vehicle.setVehicleType(vehicleDetails.getVehicleType());
        
        return ResponseEntity.ok(vehicleRepository.save(vehicle));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVehicle(@PathVariable Long id) {
        if (!vehicleRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        
        vehicleRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/current")
    public List<Vehicle> getCurrentParkedVehicles() {
        return vehicleRepository.findByExitTimeIsNull();
    }
}
