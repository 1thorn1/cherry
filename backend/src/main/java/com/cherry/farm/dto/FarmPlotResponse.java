package com.cherry.farm.dto;

import com.cherry.farm.FarmPlot;

public record FarmPlotResponse(
        Long id,
        String cropCode,
        Long projectId,
        int gridX,
        int gridY,
        int rotation
) {
    public static FarmPlotResponse from(FarmPlot plot) {
        return new FarmPlotResponse(
                plot.getId(), plot.getCropCode(), plot.getProjectId(),
                plot.getGridX(), plot.getGridY(), plot.getRotation());
    }
}
