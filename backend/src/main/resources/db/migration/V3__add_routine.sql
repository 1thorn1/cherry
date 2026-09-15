CREATE TABLE routine (
  id           BIGINT       NOT NULL AUTO_INCREMENT,
  user_id      BIGINT       NOT NULL,
  title        VARCHAR(255) NOT NULL,
  freq         VARCHAR(10)  NOT NULL,          -- DAILY | WEEKLY | MONTHLY
  weekdays     TINYINT      NULL,              -- WEEKLY: 7비트 마스크 (월=1,화=2,수=4…)
  month_day    TINYINT      NULL,              -- MONTHLY: 1~31
  default_time TIME         NULL,              -- 기본 예정 시각
  time_basis   VARCHAR(20)  NOT NULL DEFAULT 'CHECKED',   -- CHECKED | SCHEDULED
  started_on   DATE         NOT NULL,
  ended_on     DATE         NULL,
  paused       BOOLEAN      NOT NULL DEFAULT 0,
  deleted_at   DATETIME     NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_routine_user (user_id, paused, deleted_at),
  CONSTRAINT fk_routine_user FOREIGN KEY (user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE task
  ADD COLUMN routine_id BIGINT NULL AFTER effective_at,
  ADD CONSTRAINT fk_task_routine FOREIGN KEY (routine_id) REFERENCES routine(id),
  ADD UNIQUE KEY uk_task_routine (routine_id, task_date);
