package com.cherry.shop;

import com.cherry.common.CosmeticItemNotFoundException;
import com.cherry.common.InsufficientPointsException;
import com.cherry.common.ItemNotOwnedException;
import com.cherry.shop.dto.CosmeticItemResponse;
import com.cherry.user.User;
import com.cherry.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ShopService {

    private final CosmeticItemRepository cosmeticItemRepository;
    private final UserCosmeticRepository userCosmeticRepository;
    private final UserEquippedRepository userEquippedRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CosmeticItemResponse> catalog(Long userId) {
        Set<Long> ownedItemIds = userCosmeticRepository.findByUserId(userId)
                .stream().map(UserCosmetic::getItemId).collect(Collectors.toSet());
        Set<Long> equippedItemIds = userEquippedRepository.findByUserId(userId)
                .stream().map(UserEquipped::getItemId).collect(Collectors.toSet());

        return cosmeticItemRepository.findAll().stream()
                .map(item -> CosmeticItemResponse.from(
                        item, ownedItemIds.contains(item.getId()), equippedItemIds.contains(item.getId())))
                .toList();
    }

    @Transactional
    public CosmeticItemResponse purchase(Long userId, Long itemId) {
        CosmeticItem item = cosmeticItemRepository.findById(itemId)
                .orElseThrow(CosmeticItemNotFoundException::new);

        if (userCosmeticRepository.existsByUserIdAndItemId(userId, itemId)) {
            return CosmeticItemResponse.from(item, true, isEquipped(userId, item));
        }

        User user = userRepository.findById(userId).orElseThrow();
        if (user.getPointBalance() < item.getPrice()) {
            throw new InsufficientPointsException();
        }

        user.spendPoints(item.getPrice());
        userCosmeticRepository.save(UserCosmetic.create(userId, itemId));

        return CosmeticItemResponse.from(item, true, isEquipped(userId, item));
    }

    @Transactional
    public CosmeticItemResponse equip(Long userId, Long itemId) {
        CosmeticItem item = cosmeticItemRepository.findById(itemId)
                .orElseThrow(CosmeticItemNotFoundException::new);

        boolean owned = item.getPrice() == 0 || userCosmeticRepository.existsByUserIdAndItemId(userId, itemId);
        if (!owned) {
            throw new ItemNotOwnedException();
        }

        userEquippedRepository.findByUserIdAndCategory(userId, item.getCategory())
                .ifPresentOrElse(
                        equipped -> equipped.changeItem(itemId),
                        () -> userEquippedRepository.save(UserEquipped.create(userId, item.getCategory(), itemId))
                );

        return CosmeticItemResponse.from(item, true, true);
    }

    private boolean isEquipped(Long userId, CosmeticItem item) {
        return userEquippedRepository.findByUserIdAndCategory(userId, item.getCategory())
                .map(equipped -> equipped.getItemId().equals(item.getId()))
                .orElse(false);
    }
}
