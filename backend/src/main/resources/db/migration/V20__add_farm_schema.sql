-- docs/farm-spec.md 11절 스키마. 기존 공원 테이블(park_slot 등)은 이번엔 그대로 둔다 —
-- 실제 게임 로직(성장률, 수확량, 레시피 밸런스)을 붙이기 전까지는 이 스키마만
-- 추가해두고 병행한다. 사용자 데이터가 있는 park_slot을 건드리지 않기 위함.

CREATE TABLE crop_type (
  code       VARCHAR(50)  NOT NULL,
  name       VARCHAR(50)  NOT NULL,
  category   VARCHAR(20)  NOT NULL,   -- CROP | TREE | FACILITY | DECO
  sprite_key VARCHAR(100) NOT NULL,
  tile_w     TINYINT      NOT NULL DEFAULT 1,
  tile_h     TINYINT      NOT NULL DEFAULT 1,
  price      INT          NOT NULL,
  season     VARCHAR(20)  NULL,
  PRIMARY KEY (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE farm_plot (
  id         BIGINT      NOT NULL AUTO_INCREMENT,
  user_id    BIGINT      NOT NULL,
  crop_code  VARCHAR(50) NOT NULL,
  project_id BIGINT      NULL,        -- 프로젝트와 연결된 밭. NULL이면 자유 배치
  grid_x     TINYINT     NOT NULL,
  grid_y     TINYINT     NOT NULL,
  rotation   TINYINT     NOT NULL DEFAULT 0,
  planted_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_plot_user (user_id, grid_x, grid_y),
  CONSTRAINT fk_plot_user FOREIGN KEY (user_id) REFERENCES user(id),
  CONSTRAINT fk_plot_crop FOREIGN KEY (crop_code) REFERENCES crop_type(code),
  CONSTRAINT fk_plot_project FOREIGN KEY (project_id) REFERENCES project(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE inventory (
  user_id   BIGINT      NOT NULL,
  item_code VARCHAR(50) NOT NULL,
  amount    INT         NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, item_code),
  CONSTRAINT fk_inventory_user FOREIGN KEY (user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE recipe (
  code       VARCHAR(50)  NOT NULL,
  name       VARCHAR(50)  NOT NULL,
  sprite_key VARCHAR(100) NOT NULL,
  minutes    INT          NOT NULL,   -- 가공 소요 시간
  sell_price INT          NOT NULL,
  unlock_at  INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE recipe_ingredient (
  recipe_code VARCHAR(50) NOT NULL,
  item_code   VARCHAR(50) NOT NULL,
  amount      INT         NOT NULL,
  PRIMARY KEY (recipe_code, item_code),
  CONSTRAINT fk_ingredient_recipe FOREIGN KEY (recipe_code) REFERENCES recipe(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE production (
  id          BIGINT      NOT NULL AUTO_INCREMENT,
  user_id     BIGINT      NOT NULL,
  recipe_code VARCHAR(50) NOT NULL,
  started_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  done_at     DATETIME    NOT NULL,
  collected   BOOLEAN     NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_prod_user (user_id, done_at),
  CONSTRAINT fk_production_user FOREIGN KEY (user_id) REFERENCES user(id),
  CONSTRAINT fk_production_recipe FOREIGN KEY (recipe_code) REFERENCES recipe(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE recipe_discovery (
  user_id     BIGINT      NOT NULL,
  recipe_code VARCHAR(50) NOT NULL,
  first_made  DATETIME    NOT NULL,
  total_count INT         NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, recipe_code),
  CONSTRAINT fk_discovery_user FOREIGN KEY (user_id) REFERENCES user(id),
  CONSTRAINT fk_discovery_recipe FOREIGN KEY (recipe_code) REFERENCES recipe(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 시드: 스펙 4절(작물이 프로젝트 타입을 따라간다) 예시. sprite_key는 아직 없는
-- 파일명이라 프론트에서 당장 렌더링하진 않는다 — Kenney 임시 에셋으로 교체 전까지 자리만 잡아둠.
INSERT INTO crop_type (code, name, category, sprite_key, tile_w, tile_h, price, season) VALUES
  ('cherry_tree',      '체리나무',       'TREE', 'cherry_tree',      1, 1, 0, NULL),
  ('row_crop_basic',   '줄뿌림 작물',    'CROP', 'row_crop_basic',   1, 1, 0, NULL),
  ('fixed_crop_basic', '수확일 작물',    'CROP', 'fixed_crop_basic', 1, 1, 0, NULL);

-- 시드: 스펙 5절 레시피 체인 예시. minutes·sell_price·재료량은 스펙에 정확한 숫자가
-- 없어 임시로 정한 값이다 — 실제 밸런스는 나중에 조정할 것 (파이만 "두 시간"이 스펙에 명시됨).
INSERT INTO recipe (code, name, sprite_key, minutes, sell_price, unlock_at) VALUES
  ('cherry_jam',   '체리잼',     'cherry_jam',   1440, 30, 0),
  ('cherry_latte', '체리 라떼',  'cherry_latte', 30,   15, 0),
  ('cherry_pie',   '체리 파이',  'cherry_pie',   120,  60, 0);

INSERT INTO recipe_ingredient (recipe_code, item_code, amount) VALUES
  ('cherry_jam',   'cherry',     3),
  ('cherry_jam',   'sugar',      1),
  ('cherry_latte', 'cherry',     2),
  ('cherry_latte', 'milk',       1),
  ('cherry_pie',   'cherry_jam', 1),
  ('cherry_pie',   'dough',      1);
