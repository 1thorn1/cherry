package com.cherry.farm;

import com.cherry.common.InvalidFarmException;
import com.cherry.farm.dto.FarmPlotResponse;
import com.cherry.farm.dto.FarmResponse;
import com.cherry.farm.dto.ProductionResponse;
import com.cherry.farm.dto.RecipeDiscoveryResponse;
import com.cherry.farm.dto.RecipeIngredientResponse;
import com.cherry.farm.dto.RecipeResponse;
import com.cherry.farm.dto.VillagerRequestResponse;
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
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
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
    private static final int GRID_HEIGHT = 5;
    // 스펙 8절 "한 번에 2~3개까지만" — 중간값으로 임시 고정.
    private static final int MAX_VILLAGER_REQUESTS = 2;
    // "조용히 교체" — 사용자에게 기한처럼 보이지 않게 넉넉히 잡은 임시값.
    private static final int VILLAGER_ROTATE_AFTER_HOURS = 48;
    // 좋아하는 걸 만들면 "값을 더 쳐준다" — 스펙에 숫자가 없어 판매가의 50%를 보너스로 임시 고정.
    private static final double VILLAGER_BONUS_RATE = 0.5;

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
    private final VillagerRepository villagerRepository;
    private final VillagerRequestRepository villagerRequestRepository;

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

    // 스펙 9절 "꾸미기" — 밭 배치는 자유. 겹치면(우리 작물은 전부 1x1이라 같은 칸) 막지
    // 않고 서로 자리를 바꿔준다 — 드래그 중 "여기 안 돼요"로 막히는 것보다 자연스럽다.
    @Transactional
    public void movePlot(Long userId, Long plotId, int gridX, int gridY) {
        if (gridX < 0 || gridX >= GRID_WIDTH || gridY < 0 || gridY >= GRID_HEIGHT) {
            throw new InvalidFarmException("농장 범위를 벗어났습니다");
        }
        FarmPlot plot = farmPlotRepository.findByIdAndUserId(plotId, userId)
                .orElseThrow(() -> new InvalidFarmException("존재하지 않는 밭입니다"));

        byte targetX = (byte) gridX;
        byte targetY = (byte) gridY;
        farmPlotRepository.findByUserIdAndGridXAndGridY(userId, targetX, targetY)
                .filter(other -> !other.getId().equals(plot.getId()))
                .ifPresent(other -> other.move(plot.getGridX(), plot.getGridY(), other.getRotation()));

        plot.move(targetX, targetY, plot.getRotation());
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

            // 스펙 8절 "좋아하는 걸 만들면 값을 더 쳐준다" — 만든 게 어떤 주민의 요청과
            // 겹치면 그 자리에서 들어준 걸로 치고 보너스를 얹는다.
            villagerRequestRepository.findByUserIdAndStatus(userId, "PENDING").stream()
                    .filter(r -> r.getRecipeCode().equals(recipe.getCode()))
                    .findFirst()
                    .ifPresent(request -> {
                        request.fulfill(now);
                        int bonus = (int) Math.round(recipe.getSellPrice() * VILLAGER_BONUS_RATE);
                        user.earnPoints(bonus);
                        pointLedgerRepository.save(PointLedger.create(
                                userId, LocalDate.now(), bonus, "VILLAGER_REQUEST",
                                "VILLAGER_REQUEST", request.getId()));
                    });
        }
    }

    // 스펙 8절 — 기한 없이 2~3개를 유지하다가, 오래된 건 조용히 EXPIRED로 바꾸고
    // 새 요청으로 채운다. 사용자가 못 채워도 불이익이 없으니 "실패" 처리는 없다.
    @Transactional
    public void ensureVillagerRequests(Long userId) {
        LocalDateTime now = LocalDateTime.now();
        List<VillagerRequest> pending = villagerRequestRepository.findByUserIdAndStatus(userId, "PENDING");
        for (VillagerRequest request : pending) {
            if (request.getCreatedAt().isBefore(now.minusHours(VILLAGER_ROTATE_AFTER_HOURS))) {
                request.expire(now);
            }
        }

        List<VillagerRequest> stillPending = pending.stream().filter(VillagerRequest::isPending).toList();
        Set<String> activeVillagerCodes = new HashSet<>(
                stillPending.stream().map(VillagerRequest::getVillagerCode).toList());

        List<Recipe> recipes = recipeRepository.findAll();
        if (recipes.isEmpty()) return;

        int need = MAX_VILLAGER_REQUESTS - stillPending.size();
        if (need <= 0) return;

        for (Villager villager : villagerRepository.findAll()) {
            if (need <= 0) break;
            if (activeVillagerCodes.contains(villager.getCode())) continue;
            String recipeCode = villager.getFavoriteRecipeCode() != null
                    ? villager.getFavoriteRecipeCode()
                    : recipes.get(0).getCode();
            villagerRequestRepository.save(VillagerRequest.create(userId, villager.getCode(), recipeCode));
            activeVillagerCodes.add(villager.getCode());
            need--;
        }
    }

    @Transactional
    public FarmResponse getFarm(Long userId) {
        collectReady(userId);
        ensureVillagerRequests(userId);

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

        List<VillagerRequestResponse> villagerRequests = villagerRequestRepository.findByUserIdAndStatus(userId, "PENDING").stream()
                .map(request -> {
                    String villagerName = villagerRepository.findById(request.getVillagerCode())
                            .map(Villager::getName).orElse(request.getVillagerCode());
                    String recipeName = recipeRepository.findById(request.getRecipeCode())
                            .map(Recipe::getName).orElse(request.getRecipeCode());
                    return new VillagerRequestResponse(
                            request.getId(), villagerName, request.getRecipeCode(), recipeName, request.getCreatedAt());
                })
                .toList();

        return new FarmResponse(plots, inventory, recipes, pending, discoveries, villagerRequests);
    }
}
