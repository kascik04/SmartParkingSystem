package com.parkingsystem.controller;

import com.parkingsystem.model.Lane;
import com.parkingsystem.repository.LaneRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/lanes")
public class LaneController {
    private final LaneRepository repo;
    
    public LaneController(LaneRepository repo) { 
        this.repo = repo; 
    }
    
    @GetMapping
    public List<Lane> getAll() { 
        return repo.findAll(); 
    }
    
    @PostMapping
    public Lane add(@RequestBody Lane lane) { 
        return repo.save(lane); 
    }
}