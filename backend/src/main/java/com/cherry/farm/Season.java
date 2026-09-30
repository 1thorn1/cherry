package com.cherry.farm;

import java.time.LocalDate;

// 스펙 6절 "계절과 날씨" 중 계절만 구현한다. 실시간 날씨(비/맑음)는 기상청 API
// 키가 있어야 해서 이번 범위 밖 — 계절은 달력만으로 정해지니 바로 구현 가능하다.
public enum Season {
    SPRING, SUMMER, FALL, WINTER;

    public static Season of(LocalDate date) {
        return switch (date.getMonthValue()) {
            case 3, 4, 5 -> SPRING;
            case 6, 7, 8 -> SUMMER;
            case 9, 10, 11 -> FALL;
            default -> WINTER;
        };
    }
}
