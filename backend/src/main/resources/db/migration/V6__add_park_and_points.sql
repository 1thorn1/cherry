CREATE TABLE point_ledger (
  id          BIGINT      NOT NULL AUTO_INCREMENT,
  user_id     BIGINT      NOT NULL,
  occurred_on DATE        NOT NULL,
  amount      INT         NOT NULL,          -- 적립 +, 사용 -
  reason      VARCHAR(30) NOT NULL,
  ref_type    VARCHAR(20) NOT NULL,
  ref_id      BIGINT      NOT NULL,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ledger_ref (user_id, ref_type, ref_id),   -- 이중 지급 차단
  KEY idx_ledger_daily (user_id, occurred_on),
  CONSTRAINT fk_ledger_user FOREIGN KEY (user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE park_slot (
  id           BIGINT      NOT NULL AUTO_INCREMENT,
  user_id      BIGINT      NOT NULL,
  slot_index   INT         NOT NULL,
  ride_code    VARCHAR(50) NOT NULL,
  is_indoor    BOOLEAN     NOT NULL DEFAULT 0,   -- 비 오는 날 보너스 계산용
  milestone_id BIGINT      NULL,
  built_at     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_slot (user_id, slot_index),
  CONSTRAINT fk_slot_user FOREIGN KEY (user_id) REFERENCES user(id),
  CONSTRAINT fk_slot_milestone FOREIGN KEY (milestone_id) REFERENCES milestone(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE daily_stat (
  user_id         BIGINT       NOT NULL,
  stat_date       DATE         NOT NULL,
  completed_count INT          NOT NULL DEFAULT 0,
  weather_code    VARCHAR(20)  NULL,
  multiplier      DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  visitors        INT          NOT NULL DEFAULT 0,
  points_earned   INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, stat_date),
  CONSTRAINT fk_stat_user FOREIGN KEY (user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
