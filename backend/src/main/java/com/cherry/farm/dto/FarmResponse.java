package com.cherry.farm.dto;

import java.util.List;
import java.util.Map;

public record FarmResponse(
        List<FarmPlotResponse> plots,
        Map<String, Integer> inventory,
        List<RecipeResponse> recipes,
        List<ProductionResponse> pendingProductions,
        List<RecipeDiscoveryResponse> discoveries,
        List<VillagerRequestResponse> villagerRequests
) {
}
