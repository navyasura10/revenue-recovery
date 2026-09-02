package com.ride.revenue_recovery.service;

import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class EvaluationService {

    private static final String CSV_FILE =
            "ai/data/gemini_vs_baseline_results.csv";

    public List<Map<String, Object>> getEvaluationResults() {

        List<Map<String, Object>> results = new ArrayList<>();

        Path csvPath = Paths.get(CSV_FILE);

        System.out.println(
                "Loading evaluation CSV from: "
                        + csvPath.toAbsolutePath()
        );

        if (!Files.exists(csvPath)) {

            System.err.println(
                    "Evaluation CSV does not exist: "
                            + csvPath.toAbsolutePath()
            );

            return results;
        }

        try (
                BufferedReader reader =
                        Files.newBufferedReader(
                                csvPath,
                                StandardCharsets.UTF_8
                        )
        ) {

            String headerLine =
                    reader.readLine();

            if (headerLine == null) {
                return results;
            }

            List<String> headers =
                    parseCsvLine(headerLine);

            String line;

            while ((line = reader.readLine()) != null) {

                if (line.trim().isEmpty()) {
                    continue;
                }

                List<String> values =
                        parseCsvLine(line);

                Map<String, Object> row =
                        new LinkedHashMap<>();

                for (int i = 0;
                     i < headers.size();
                     i++) {

                    String header =
                            headers.get(i)
                                    .trim();

                    String value =
                            i < values.size()
                                    ? values.get(i).trim()
                                    : "";

                    row.put(
                            header,
                            convertValue(
                                    header,
                                    value
                            )
                    );
                }

                results.add(row);
            }

            System.out.println(
                    "Loaded "
                            + results.size()
                            + " evaluation records."
            );

        } catch (IOException e) {

            System.err.println(
                    "Failed to read evaluation CSV."
            );

            e.printStackTrace();
        }

        return results;
    }

    private Object convertValue(
            String header,
            String value
    ) {

        if (value == null || value.isEmpty()) {
            return null;
        }

        if (
                header.equals("amount")
                        || header.equals("recovered_amount")
        ) {

            try {
                return Long.parseLong(value);
            } catch (NumberFormatException e) {

                try {
                    return Double.parseDouble(value);
                } catch (NumberFormatException ignored) {
                    return 0;
                }
            }
        }

        if (header.equals("gemini_confidence")) {

            try {
                return Double.parseDouble(value);
            } catch (NumberFormatException e) {
                return 0;
            }
        }

        return value;
    }

    private List<String> parseCsvLine(
            String line
    ) {

        List<String> values =
                new ArrayList<>();

        StringBuilder current =
                new StringBuilder();

        boolean insideQuotes = false;

        for (
                int i = 0;
                i < line.length();
                i++
        ) {

            char character =
                    line.charAt(i);

            if (character == '"') {

                if (
                        insideQuotes
                                && i + 1 < line.length()
                                && line.charAt(i + 1) == '"'
                ) {

                    current.append('"');
                    i++;

                } else {

                    insideQuotes =
                            !insideQuotes;
                }

            } else if (
                    character == ','
                            && !insideQuotes
            ) {

                values.add(
                        current.toString()
                );

                current.setLength(0);

            } else {

                current.append(character);
            }
        }

        values.add(
                current.toString()
        );

        return values;
    }
}