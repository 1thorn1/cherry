CREATE TABLE challenge (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  owner_id    BIGINT       NOT NULL,
  title       VARCHAR(100) NOT NULL,
  type        VARCHAR(20)  NOT NULL,       -- PROGRESS | EXAM | FREE
  total_units INT          NULL,
  target_date DATE         NULL,
  invite_code CHAR(8)      NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at   DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_challenge_invite (invite_code),
  CONSTRAINT fk_challenge_owner FOREIGN KEY (owner_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE challenge_member (
  challenge_id BIGINT   NOT NULL,
  user_id      BIGINT   NOT NULL,
  project_id   BIGINT   NULL,              -- 참여 시 각자에게 복제된 프로젝트
  joined_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paused       BOOLEAN  NOT NULL DEFAULT 0,  -- 잠시 쉬기
  left_at      DATETIME NULL,
  PRIMARY KEY (challenge_id, user_id),
  CONSTRAINT fk_cm_challenge FOREIGN KEY (challenge_id) REFERENCES challenge(id),
  CONSTRAINT fk_cm_project   FOREIGN KEY (project_id)   REFERENCES project(id),
  CONSTRAINT fk_cm_user      FOREIGN KEY (user_id)      REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
