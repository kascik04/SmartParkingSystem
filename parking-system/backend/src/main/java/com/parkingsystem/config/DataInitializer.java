package com.parkingsystem.config;

import com.parkingsystem.model.Block;
import com.parkingsystem.repository.BlockRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataInitializer {
    
    @Bean
    CommandLineRunner initDatabase(BlockRepository blockRepository) {
        return args -> {
            // Chỉ tạo 4 tầng, không tạo xe mẫu
            if (blockRepository.count() == 0) {
                for (int floor = 1; floor <= 4; floor++) {
                    Block block = new Block();
                    block.name = "Tầng " + floor;
                    block.floor = floor;
                    block.slots = 250;
                    blockRepository.save(block);
                }
                System.out.println("✅ Đã tạo 4 tầng bãi xe!");
            }
        };
    }
}
