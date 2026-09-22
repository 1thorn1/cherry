package com.cherry.user;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    private Long id;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(name = "friend_code", nullable = false, length = 8)
    private String friendCode;

    @Column(name = "point_balance", nullable = false)
    private int pointBalance;

    @Column(nullable = false)
    private int population;

    @Column(name = "share_park", nullable = false)
    private boolean sharePark = true;

    @Column(name = "share_activity_count", nullable = false)
    private boolean shareActivityCount = false;

    @Column(name = "share_task_titles", nullable = false)
    private boolean shareTaskTitles = false;

    public void updateSharingSettings(boolean sharePark, boolean shareActivityCount, boolean shareTaskTitles) {
        this.sharePark = sharePark;
        this.shareActivityCount = shareActivityCount;
        this.shareTaskTitles = shareTaskTitles;
    }

    public void earnPoints(int amount) {
        this.pointBalance += amount;
    }

    public void spendPoints(int amount) {
        this.pointBalance -= amount;
    }

    public void growPopulation(int amount) {
        this.population += amount;
    }
}
