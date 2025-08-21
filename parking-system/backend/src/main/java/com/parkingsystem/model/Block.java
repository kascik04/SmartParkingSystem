package com.parkingsystem.model;

import jakarta.persistence.*;

@Entity
public class Block {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    public String name;
    public int floor;
    public int slots;
}