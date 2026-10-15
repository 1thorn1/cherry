-- docs/farm-spec.md 8절 "주민" — 취향이 있어서 좋아하는 걸 만들면 값을 더 쳐준다.
-- 기한 없음·누적 안 됨·호감도 하락 없음·진척도 표시 금지가 원칙이라, 요청은
-- 상태(status)만 있고 실패/기한 개념 자체가 없다 — 오래되면 조용히 EXPIRED로
-- 바뀌고 새 요청이 채워질 뿐, 사용자에게 불이익으로 보이지 않는다.

CREATE TABLE villager (
  code                 VARCHAR(50)  NOT NULL,
  name                 VARCHAR(50)  NOT NULL,
  sprite_key           VARCHAR(100) NOT NULL,
  favorite_recipe_code VARCHAR(50)  NULL,
  PRIMARY KEY (code),
  CONSTRAINT fk_villager_recipe FOREIGN KEY (favorite_recipe_code) REFERENCES recipe(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE villager_request (
  id            BIGINT      NOT NULL AUTO_INCREMENT,
  user_id       BIGINT      NOT NULL,
  villager_code VARCHAR(50) NOT NULL,
  recipe_code   VARCHAR(50) NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'PENDING',  -- PENDING | FULFILLED | EXPIRED
  created_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at   DATETIME    NULL,
  PRIMARY KEY (id),
  KEY idx_request_user_status (user_id, status),
  CONSTRAINT fk_request_user FOREIGN KEY (user_id) REFERENCES user(id),
  CONSTRAINT fk_request_villager FOREIGN KEY (villager_code) REFERENCES villager(code),
  CONSTRAINT fk_request_recipe FOREIGN KEY (recipe_code) REFERENCES recipe(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 시드: 스펙 8절 예시 2명. sprite_key는 아직 없는 파일명(자리만 잡아둠).
INSERT INTO villager (code, name, sprite_key, favorite_recipe_code) VALUES
  ('minji',      '민지',   'villager_minji',      'cherry_latte'),
  ('grandma',    '할머니', 'villager_grandma',    'cherry_jam');
