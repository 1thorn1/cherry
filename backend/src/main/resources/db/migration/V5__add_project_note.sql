CREATE TABLE project_note (
  id           BIGINT       NOT NULL AUTO_INCREMENT,
  user_id      BIGINT       NOT NULL,
  project_id   BIGINT       NOT NULL,
  milestone_id BIGINT       NULL,        -- 작성 시점 스냅샷
  kind         VARCHAR(20)  NOT NULL,    -- NOTE|LINK|RETRO (IMAGE는 v2)
  body         TEXT         NULL,        -- 마크다운 원문 (렌더 결과 아님)
  url          VARCHAR(500) NULL,
  file_key     VARCHAR(255) NULL,
  deleted_at   DATETIME     NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_note_project (project_id, created_at),
  CONSTRAINT fk_note_project FOREIGN KEY (project_id) REFERENCES project(id),
  CONSTRAINT fk_note_milestone FOREIGN KEY (milestone_id) REFERENCES milestone(id),
  CONSTRAINT fk_note_user FOREIGN KEY (user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
