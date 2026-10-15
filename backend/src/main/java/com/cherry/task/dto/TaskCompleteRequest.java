package com.cherry.task.dto;

import java.time.OffsetDateTime;

// 기기에서 완료를 누른 시각. 시간대 오프셋을 같이 받아서 기기 시간대와 서버 시간대가
// 달라도 같은 순간으로 해석한다. 범위 검사는 TaskService.resolveCompletedAt()에서
// 거절 대신 보정으로 처리한다 — 시계가 몇 초 빠른 기기도 완료가 막히지 않게.
public record TaskCompleteRequest(OffsetDateTime completedAt) {
}
