package com.parkingsystem.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "vehicle")
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "license_plate", nullable = false)
    private String licensePlate;
    
    @Column(name = "entry_time", nullable = false)
    private LocalDateTime entryTime;
    
    @Column(name = "exit_time")
    private LocalDateTime exitTime;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "vehicle_type")
    private VehicleType vehicleType;
    
    @Column(name = "confidence")
    private Double confidence; // AI detection confidence
    
    @Column(name = "ai_method")
    private String aiMethod; // AI detection method used
    
    @Column(name = "floor")
    private Integer floor; // Parking floor
    
    @Column(name = "slot")
    private Integer slot; // Parking slot
    
    @Column(name = "parking_fee")
    private Double parkingFee; // Parking fee
    
    @Column(name = "parking_duration")
    private Integer parkingDuration; // Duration in minutes
    
    private Long slotId;

    // Constructors
    public Vehicle() {}
    
    public Vehicle(String licensePlate, VehicleType vehicleType) {
        this.licensePlate = licensePlate;
        this.vehicleType = vehicleType;
        this.entryTime = LocalDateTime.now();
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getLicensePlate() { return licensePlate; }
    public void setLicensePlate(String licensePlate) { this.licensePlate = licensePlate; }
    
    public LocalDateTime getEntryTime() { return entryTime; }
    public void setEntryTime(LocalDateTime entryTime) { this.entryTime = entryTime; }
    
    public LocalDateTime getExitTime() { return exitTime; }
    public void setExitTime(LocalDateTime exitTime) { this.exitTime = exitTime; }

    public Long getSlotId() {
        return slotId;
    }

    public void setSlotId(Long slotId) {
        this.slotId = slotId;
    }
    
    public VehicleType getVehicleType() { return vehicleType; }
    public void setVehicleType(VehicleType vehicleType) { this.vehicleType = vehicleType; }
    
    public Double getConfidence() { return confidence; }
    public void setConfidence(Double confidence) { this.confidence = confidence; }
    
    public String getAiMethod() { return aiMethod; }
    public void setAiMethod(String aiMethod) { this.aiMethod = aiMethod; }
    
    public Integer getFloor() { return floor; }
    public void setFloor(Integer floor) { this.floor = floor; }
    
    public Integer getSlot() { return slot; }
    public void setSlot(Integer slot) { this.slot = slot; }
    
    public Double getParkingFee() { return parkingFee; }
    public void setParkingFee(Double parkingFee) { this.parkingFee = parkingFee; }
    
    public Integer getParkingDuration() { return parkingDuration; }
    public void setParkingDuration(Integer parkingDuration) { this.parkingDuration = parkingDuration; }
    
    public enum VehicleType {
        CAR, MOTORCYCLE, BICYCLE, TRUCK
    }
}
