# ERD

`V1` ~ `V6` 마이그레이션 기준. 실제 구현된 스키마만 반영하며, 새 마이그레이션이 추가될 때마다 갱신한다.
전체 계획(친구·같이하기·외부 캘린더 등 미구현 테이블 포함)은 `product-spec.md`의 B-3을 참조.

```mermaid
erDiagram
    USER ||--o{ TASK : "작성"
    USER ||--o{ ROUTINE : "작성"
    USER ||--o{ PROJECT : "작성"
    USER ||--o{ PROJECT_NOTE : "작성"
    USER ||--o{ POINT_LEDGER : "적립"
    USER ||--o{ PARK_SLOT : "소유"
    USER ||--o{ DAILY_STAT : "집계"

    PROJECT ||--o{ MILESTONE : "구간"
    PROJECT ||--o{ TASK : "묶음"
    PROJECT ||--o{ PROJECT_NOTE : "기록"

    MILESTONE ||--o{ TASK : "완료 스냅샷"
    MILESTONE ||--o{ PROJECT_NOTE : "작성 스냅샷"
    MILESTONE ||--o| PARK_SLOT : "완료 시 기구 생성"

    ROUTINE ||--o{ TASK : "매일 생성"

    USER {
        bigint id PK
        varchar provider
        varchar provider_uid
        varchar nickname
        char friend_code
        int point_balance
        int population
    }

    TASK {
        bigint id PK
        bigint user_id FK
        varchar title
        varchar horizon
        date task_date
        datetime scheduled_start
        datetime scheduled_end
        datetime completed_at
        datetime effective_at
        bigint routine_id FK
        bigint project_id FK
        bigint milestone_id FK
        varchar memo
    }

    ROUTINE {
        bigint id PK
        bigint user_id FK
        varchar title
        varchar freq "DAILY|WEEKLY|MONTHLY"
        tinyint weekdays "비트마스크"
        tinyint month_day
        time default_time
        varchar time_basis "CHECKED|SCHEDULED"
        date started_on
        date ended_on
        boolean paused
    }

    PROJECT {
        bigint id PK
        bigint user_id FK
        varchar name
        varchar type "FREE|PROGRESS|EXAM"
        varchar color
        int total_units
        date exam_date
        tinyint work_days
        varchar status
    }

    MILESTONE {
        bigint id PK
        bigint project_id FK
        int seq
        varchar title
        char target_week
        datetime completed_at
    }

    PROJECT_NOTE {
        bigint id PK
        bigint user_id FK
        bigint project_id FK
        bigint milestone_id FK
        varchar kind "NOTE|LINK|RETRO"
        text body
        varchar url
    }

    POINT_LEDGER {
        bigint id PK
        bigint user_id FK
        date occurred_on
        int amount
        varchar reason
        varchar ref_type "TASK|MILESTONE"
        bigint ref_id
    }

    PARK_SLOT {
        bigint id PK
        bigint user_id FK
        int slot_index
        varchar ride_code
        boolean is_indoor
        bigint milestone_id FK
    }

    DAILY_STAT {
        bigint user_id PK "FK"
        date stat_date PK
        int completed_count
        varchar weather_code
        decimal multiplier
        int visitors
        int points_earned
    }
```

## 참고

- `TASK.routine_id` / `TASK.project_id` / `TASK.milestone_id`는 전부 `NULL` 허용 — 반복도 프로젝트도 아닌 일반 할 일이 기본값
- `MILESTONE.completed_at`이 채워지는 순간(`ProjectService.completeMilestone`) `PARK_SLOT` 한 행이 같이 생긴다 — "마일스톤 1개 완료 = 기구 1개" 규칙(A-6-6)
- `DAILY_STAT`은 기본키가 `(user_id, stat_date)` 복합키. 완료 이벤트마다 그날 행을 다시 계산해서 갱신한다
- `POINT_LEDGER.UNIQUE(user_id, ref_type, ref_id)` — 같은 완료 이벤트로 포인트가 중복 지급되지 않도록 막는 제약 (B-4)
