package com.cherry.farm;

import com.cherry.common.InvalidFarmException;
import com.cherry.farm.dto.FarmPlotResponse;
import com.cherry.farm.dto.FarmResponse;
import com.cherry.farm.dto.ProductionResponse;
import com.cherry.farm.dto.RecipeDiscoveryResponse;
import com.cherry.farm.dto.RecipeIngredientResponse;
import com.cherry.farm.dto.RecipeResponse;
import com.cherry.park.PointLedger;
import com.cherry.park.PointLedgerRepository;
import com.cherry.project.MilestoneRepository;
import com.cherry.user.User;
import com.cherry.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// docs/farm-spec.md 3~5절 — 프로젝트가 밭 한 구획, 마일스톤 완료가 수확, 레시피
// 가공이 유일한 선택 지점. 성장 단계·밸런스 숫자는 스펙에 없어 전부 최소 동작만
// 구현한다(플레이스홀더는 각 상수에 주석으로 표시).
@Service
@RequiredArgsConstructor
public class FarmService {

    // 마일스톤 완료(수확)마다 쌓이는 재료 체리 양 — 잼 레시피 재료량(3)을 기준으로 잡은 임시값.
    private static final int CHERRY_PER_HARVEST = 3;
    private static final int GRID_WIDTH = 4;

    private static final Map<String, String> CROP_BY_PROJECT_TYPE = Map.of(
            "FREE", "cherry_tree",
            "PROGRESS", "row_crop_basic",
            "EXAM", "fixed_crop_basic"
    );

    private final FarmPlotRepository farmPlotRepository;
    private final InventoryRepository inventoryRepository;
    private final RecipeRepository recipeRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final ProductionRepository productionRepository;
    private final RecipeDiscoveryRepository recipeDiscoveryRepository;
    private final MilestoneRepository milestoneRepository;
    private final PointLedgerRepository pointLedgerRepository;
    private final UserRepository userRepository;

    // 프로젝트 생성(스펙 3절 "프로젝트가 밭 한 구획") — 타입에 따라 작물이 갈린다(4절).
    @Transactional
    public void plantForProject(Long userId, Long projectId, String projectType) {
        if (farmPlotRepository.findByUserIdAndProjectId(userId, projectId).isPresent()) return;

        String cropCode = CROP_BY_PROJECT_TYPE.getOrDefault(projectType, "row_crop_basic");
        int index = farmPlotRepository.findByUserId(userId).size();
        farmPlotRepository.save(FarmPlot.create(
                userId, cropCode, projectId, (byte) (index % GRID_WIDTH), (byte) (index / GRID_WIDTH)));
    }

    // 마일스톤 완료(수확) — TaskService.complete()에서 호출된다.
    @Transactional
    public void harvest(Long userId, Long projectId) {
        Inventory cherry = inventoryRepository.findByUserIdAndItemCode(userId, "cherry")
                .orElseGet(() -> inventoryRepository.save(Inventory.create(userId, "cherry")));
        cherry.add(CHERRY_PER_HARVEST);

        if (projectId == null) return;
        farmPlotRepository.findByUserIdAndProjectId(userId, projectId).ifPresent(plot -> {
            boolean allDone = milestoneRepository.findByProjectIdOrderBySeqAsc(projectId).stream()
                    .allMatch(m -> m.getCompletedAt() != null);
            if (allDone) plot.promoteToTree(); // 스펙 3절 "프로젝트 완료 → 나무로 승격"
        });
    }

    @Transactional
    public void startProduction(Long userId, String recipeCode) {
        Recipe recipe = recipeRepository.findById(recipeCode)
                .orElseThrow(() -> new InvalidFarmException("존재하지 않는 레시피입니다"));
        List<RecipeIngredient> ingredients = recipeIngredientRepository.findByRecipeCode(recipeCode);

        for (RecipeIngredient ingredient : ingredients) {
            int owned = inventoryRepository.findByUserIdAndItemCode(userId, ingredient.getItemCode())
                    .map(Inventory::getAmount).orElse(0);
            if (owned < ingredient.getAmount()) {
                throw new InvalidFarmException("재료가 부족합니다: " + ingredient.getItemCode());
            }
        }
        for (RecipeIngredient ingredient : ingredients) {
            inventoryRepository.findByUserIdAndItemCode(userId, ingredient.getItemCode())
                    .ifPresent(inv -> inv.add(-ingredient.getAmount()));
        }

        productionRepository.save(Production.start(
                userId, recipeCode, LocalDateTime.now().plusMinutes(recipe.getMinutes())));
    }

    // 완성 확인하러 들어올 필요 없게(스펙 5절) — 별도 배치/스케줄러 없이 농장을 읽을 때마다
    // 다 된 것을 조용히 수거·판매한다.
    @Transactional
    public void collectReady(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        List<Production> ready = productionRepository.findByUserIdAndCollectedFalse(userId).stream()
                .filter(p -> !p.getDoneAt().isAfter(now))
                .toList();
        if (ready.isEmpty()) return;

        User user = userRepository.findById(userId).orElseThrow();
        for (Production production : ready) {
            Recipe recipe = recipeRepository.findById(production.getRecipeCode()).orElseThrow();
            production.collect();
            user.earnPoints(recipe.getSellPrice());
            pointLedgerRepository.save(PointLedger.create(
                    userId, LocalDate.now(), recipe.getSellPrice(),
                    "PRODUCTION_SOLD", "PRODUCTION", production.getId()));

            recipeDiscoveryRepository.findById(new RecipeDiscoveryId(userId, recipe.getCode()))
                    .ifPresentOrElse(
                            RecipeDiscovery::increment,
                            () -> recipeDiscoveryRepository.save(
                                    RecipeDiscovery.create(userId, recipe.getCode(), now)));
        }
    }

    @Transactional
    public FarmResponse getFarm(Long userId) {
        collectReady(userId);

        List<FarmPlotResponse> plots = farmPlotRepository.findByUserId(userId).stream()
                .map(FarmPlotResponse::from).toList();

        Map<String, Integer> inventory = inventoryRepository.findByUserId(userId).stream()
                .collect(Collectors.toMap(Inventory::getItemCode, Inventory::getAmount));

        List<RecipeResponse> recipes = recipeRepository.findAll().stream()
                .map(recipe -> RecipeResponse.from(recipe,
                        recipeIngredientRepository.findByRecipeCode(recipe.getCode()).stream()
                                .map(RecipeIngredientResponse::from).toList()))
                .toList();

        List<ProductionResponse> pending = productionRepository.findByUserIdAndCollectedFalse(userId).stream()
                .map(ProductionResponse::from).toList();

        List<RecipeDiscoveryResponse> discoveries = recipeDiscoveryRepository.findByUserId(userId).stream()
                .map(RecipeDiscoveryResponse::from).toList();

        return new FarmResponse(plots, inventory, recipes, pending, discoveries);
    }
}
