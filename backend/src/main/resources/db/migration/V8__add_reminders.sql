ALTER TABLE task
  ADD COLUMN notify_offset_min INT NULL AFTER milestone_id;   -- NULL이면 알림 없음. 10=10분 전, 0=정시

CREATE TABLE reminder (
  id         BIGINT   NOT NULL AUTO_INCREMENT,
  user_id    BIGINT   NOT NULL,
  task_id    BIGINT   NOT NULL,
  offset_min INT      NOT NULL,          -- 0=정시, 10, 30
  fire_at    DATETIME NOT NULL,          -- 미리 계산한 발송 시각
  sent_at    DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_reminder (task_id, offset_min),
  KEY idx_fire (fire_at, sent_at),
  CONSTRAINT fk_reminder_task FOREIGN KEY (task_id) REFERENCES task(id),
  CONSTRAINT fk_reminder_user FOREIGN KEY (user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE push_subscription (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  user_id    BIGINT       NOT NULL,
  endpoint   VARCHAR(500) NOT NULL,
  p256dh     VARCHAR(255) NOT NULL,
  auth       VARCHAR(255) NOT NULL,
  user_agent VARCHAR(255) NULL,          -- 기기 구분용
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_push_endpoint (endpoint),
  KEY idx_push_user (user_id),
  CONSTRAINT fk_push_user FOREIGN KEY (user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
