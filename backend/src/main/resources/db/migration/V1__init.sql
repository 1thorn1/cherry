CREATE TABLE user (
  id                   BIGINT       NOT NULL AUTO_INCREMENT,
  provider             VARCHAR(20)  NOT NULL,
  provider_uid         VARCHAR(191) NOT NULL,
  email                VARCHAR(191) NULL,
  nickname             VARCHAR(50)  NOT NULL,
  friend_code          CHAR(8)      NOT NULL,
  region_code          VARCHAR(20)  NOT NULL DEFAULT 'SEOUL',
  birth_date           DATE         NULL,
  point_balance        INT          NOT NULL DEFAULT 0,
  population           INT          NOT NULL DEFAULT 0,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_provider (provider, provider_uid),
  UNIQUE KEY uk_user_friend_code (friend_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE task (
  id                   BIGINT       NOT NULL AUTO_INCREMENT,
  user_id              BIGINT       NOT NULL,
  title                VARCHAR(255) NOT NULL,
  horizon              VARCHAR(20)  NOT NULL DEFAULT 'SOMEDAY',
  task_date            DATE         NULL,
  scheduled_start      DATETIME     NULL,
  scheduled_end        DATETIME     NULL,
  completed_at         DATETIME     NULL,
  effective_at         DATETIME     NULL,
  memo                 VARCHAR(500) NULL,
  sort_order           INT          NOT NULL DEFAULT 0,
  deleted_at           DATETIME     NULL,
  created_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_task_today (user_id, task_date, deleted_at),
  KEY idx_task_done  (user_id, completed_at),
  CONSTRAINT fk_task_user FOREIGN KEY (user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
