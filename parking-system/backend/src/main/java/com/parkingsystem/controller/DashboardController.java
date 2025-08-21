package com.parkingsystem.controller;

import com.parkingsystem.model.Vehicle;
import com.parkingsystem.repository.VehicleRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "http://localhost:3000")
public class DashboardController {

    @Autowired
    private VehicleRepository vehicleRepository;

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        try {
            List<Vehicle> allVehicles = vehicleRepository.findAll();
            List<Vehicle> currentlyParked = vehicleRepository.findByExitTimeIsNull();
            
            long totalVehicles = allVehicles.size();
            long currentlyParkedCount = currentlyParked.size();
            
            // Count by vehicle type
            long cars = currentlyParked.stream().mapToLong(v -> v.getVehicleType() == Vehicle.VehicleType.CAR ? 1 : 0).sum();
            long motorcycles = currentlyParked.stream().mapToLong(v -> v.getVehicleType() == Vehicle.VehicleType.MOTORCYCLE ? 1 : 0).sum();
            long bicycles = currentlyParked.stream().mapToLong(v -> v.getVehicleType() == Vehicle.VehicleType.BICYCLE ? 1 : 0).sum();
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalVehicles", totalVehicles);
            stats.put("currentlyParked", currentlyParkedCount);
            stats.put("availableSpots", 920 - currentlyParkedCount); // Total 920 spots
            stats.put("occupancyRate", totalVehicles > 0 ? (currentlyParkedCount * 100.0 / 920) : 0);
            stats.put("vehicleTypes", Map.of(
                "cars", cars,
                "motorcycles", motorcycles,
                "bicycles", bicycles
            ));
            
            return ResponseEntity.ok(stats);
            
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to get statistics: " + e.getMessage()));
        }
    }

    @GetMapping("/current-parking")
    public ResponseEntity<List<Vehicle>> getCurrentParking() {
        try {
            List<Vehicle> currentlyParked = vehicleRepository.findByExitTimeIsNull();
            return ResponseEntity.ok(currentlyParked);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }
}
