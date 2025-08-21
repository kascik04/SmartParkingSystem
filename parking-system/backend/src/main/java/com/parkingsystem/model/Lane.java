package com.parkingsystem.model;

import jakarta.persistence.*;

@Entity
public class Lane {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public String type;
    public String camera;
}