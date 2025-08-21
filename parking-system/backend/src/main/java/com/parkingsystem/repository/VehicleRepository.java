package com.parkingsystem.repository;

import com.parkingsystem.model.Vehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleRepository extends JpaRepository<Vehicle, Long> {
    
    // Find vehicles currently parked (no exit time)
    List<Vehicle> findByExitTimeIsNull();
    
    // Find vehicle by license plate that's currently parked
    Optional<Vehicle> findByLicensePlateAndExitTimeIsNull(String licensePlate);
    
    // Find the most recent vehicle entry by license plate (still parked)
    Optional<Vehicle> findTopByLicensePlateAndExitTimeIsNullOrderByEntryTimeDesc(String licensePlate);
    
    // Find all vehicles by license plate (including those that have exited)
    List<Vehicle> findByLicensePlate(String licensePlate);
    
    // Find vehicles by type that are currently parked
    List<Vehicle> findByVehicleTypeAndExitTimeIsNull(Vehicle.VehicleType vehicleType);
    
    // Find all vehicles by type
    List<Vehicle> findByVehicleType(Vehicle.VehicleType vehicleType);
    
    // Find vehicles by floor that are currently parked
    List<Vehicle> findByFloorAndExitTimeIsNull(Integer floor);
    
    // Find vehicles parked between specific times
    List<Vehicle> findByEntryTimeBetween(LocalDateTime startTime, LocalDateTime endTime);
    
    // Count currently parked vehicles
    long countByExitTimeIsNull();
    
    // Count vehicles by type that are currently parked
    long countByVehicleTypeAndExitTimeIsNull(Vehicle.VehicleType vehicleType);
    
    // Custom query to find vehicles with parking duration over specified minutes
    @Query("SELECT v FROM Vehicle v WHERE v.exitTime IS NOT NULL AND " +
           "FUNCTION('TIMESTAMPDIFF', MINUTE, v.entryTime, v.exitTime) > :minutes")
    List<Vehicle> findVehiclesWithParkingDurationOver(@Param("minutes") int minutes);
    
    // Custom query to get parking statistics
    @Query("SELECT COUNT(v) as total, " +
           "SUM(CASE WHEN v.exitTime IS NULL THEN 1 ELSE 0 END) as currentlyParked, " +
           "SUM(CASE WHEN v.vehicleType = 'CAR' AND v.exitTime IS NULL THEN 1 ELSE 0 END) as carsParked, " +
           "SUM(CASE WHEN v.vehicleType = 'MOTORCYCLE' AND v.exitTime IS NULL THEN 1 ELSE 0 END) as motorcyclesParked, " +
           "SUM(CASE WHEN v.vehicleType = 'BICYCLE' AND v.exitTime IS NULL THEN 1 ELSE 0 END) as bicyclesParked " +
           "FROM Vehicle v")
    Object[] getParkingStatistics();
    
    // Find vehicles that entered today
    @Query("SELECT v FROM Vehicle v WHERE DATE(v.entryTime) = CURRENT_DATE")
    List<Vehicle> findVehiclesEnteredToday();
    
    // Find vehicles that exited today
    @Query("SELECT v FROM Vehicle v WHERE DATE(v.exitTime) = CURRENT_DATE")
    List<Vehicle> findVehiclesExitedToday();
    
    // Find vehicles by confidence level (AI detection accuracy)
    List<Vehicle> findByConfidenceGreaterThan(Double confidence);
    
    // Find vehicles by AI method used
    List<Vehicle> findByAiMethod(String aiMethod);
}