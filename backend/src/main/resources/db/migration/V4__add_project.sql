CREATE TABLE project (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  user_id       BIGINT       NOT NULL,
  name          VARCHAR(100) NOT NULL,
  type          VARCHAR(20)  NOT NULL DEFAULT 'FREE',  -- FREE|PROGRESS|EXAM
  color         VARCHAR(20)  NOT NULL DEFAULT 'BLUE',
  total_units   INT          NULL,        -- 진도형: 총 회차 / 시험형: 단원 수
  exam_date     DATE         NULL,        -- 시험형만
  work_days     TINYINT      NOT NULL DEFAULT 127,  -- 작업 요일 7비트. 기본 전체
  deadline_week CHAR(8)      NULL,        -- ISO 주차 'YYYY-Www'
  status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  archived_at   DATETIME     NULL,
  deleted_at    DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_project_user (user_id, status),
  CONSTRAINT fk_project_user FOREIGN KEY (user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE milestone (
  id           BIGINT       NOT NULL AUTO_INCREMENT,
  project_id   BIGINT       NOT NULL,
  seq          INT          NOT NULL,
  title        VARCHAR(100) NOT NULL,
  target_week  CHAR(8)      NULL,
  started_at   DATETIME     NULL,
  completed_at DATETIME     NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_milestone_seq (project_id, seq),
  CONSTRAINT fk_milestone_project FOREIGN KEY (project_id) REFERENCES project(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE task
  ADD COLUMN project_id BIGINT NULL AFTER routine_id,
  ADD COLUMN milestone_id BIGINT NULL AFTER project_id,
  ADD CONSTRAINT fk_task_project FOREIGN KEY (project_id) REFERENCES project(id),
  ADD CONSTRAINT fk_task_milestone FOREIGN KEY (milestone_id) REFERENCES milestone(id),
  ADD KEY idx_task_project (project_id, completed_at);
