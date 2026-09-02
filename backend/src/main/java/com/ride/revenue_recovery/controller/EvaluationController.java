package com.ride.revenue_recovery.controller;

import com.ride.revenue_recovery.service.EvaluationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/evaluation")
@CrossOrigin(origins = "http://localhost:5173")
public class EvaluationController {

    private final EvaluationService evaluationService;

    public EvaluationController(EvaluationService evaluationService) {
        this.evaluationService = evaluationService;
    }

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getEvaluation() {

        return ResponseEntity.ok(
                evaluationService.getEvaluationResults()
        );
    }
}