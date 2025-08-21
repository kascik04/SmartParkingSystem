package com.parkingsystem.repository;

import com.parkingsystem.model.Block;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BlockRepository extends JpaRepository<Block, Long> {}