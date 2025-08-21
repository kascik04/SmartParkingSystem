package com.parkingsystem.repository;

import com.parkingsystem.model.Lane;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LaneRepository extends JpaRepository<Lane, Long> {}