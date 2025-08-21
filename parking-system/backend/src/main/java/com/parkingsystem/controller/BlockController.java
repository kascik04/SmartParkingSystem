package com.parkingsystem.controller;

import com.parkingsystem.model.Block;
import com.parkingsystem.repository.BlockRepository;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/blocks")
public class BlockController {
    private final BlockRepository repo;
    
    public BlockController(BlockRepository repo) { 
        this.repo = repo; 
    }
    
    @GetMapping
    public List<Block> getAll() { 
        return repo.findAll(); 
    }
    
    @PostMapping
    public Block add(@RequestBody Block block) { 
        return repo.save(block); 
    }
}