CREATE TABLE cosmetic_item (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  category   VARCHAR(20)  NOT NULL,   -- THEME | FONT | ICON | EFFECT
  code       VARCHAR(50)  NOT NULL,
  name       VARCHAR(100) NOT NULL,
  value      VARCHAR(100) NULL,       -- 카테고리별 실제 적용값 (테마는 hex 색상 등)
  price      INT          NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_item_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_cosmetic (
  id          BIGINT   NOT NULL AUTO_INCREMENT,
  user_id     BIGINT   NOT NULL,
  item_id     BIGINT   NOT NULL,
  acquired_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_item (user_id, item_id),   -- 중복 구매 차단
  CONSTRAINT fk_cosmetic_user FOREIGN KEY (user_id) REFERENCES user(id),
  CONSTRAINT fk_cosmetic_item FOREIGN KEY (item_id) REFERENCES cosmetic_item(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_equipped (
  user_id     BIGINT      NOT NULL,
  category    VARCHAR(20) NOT NULL,
  item_id     BIGINT      NOT NULL,
  equipped_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, category),   -- 카테고리당 하나만 착용
  CONSTRAINT fk_equipped_user FOREIGN KEY (user_id) REFERENCES user(id),
  CONSTRAINT fk_equipped_item FOREIGN KEY (item_id) REFERENCES cosmetic_item(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO cosmetic_item (category, code, name, value, price) VALUES
  ('THEME',  'theme_default',   '기본',    '#D4537E', 0),
  ('THEME',  'theme_lavender',  '라벤더',  '#8B6FD4', 100),
  ('THEME',  'theme_forest',    '숲',      '#4E8B6B', 100),
  ('THEME',  'theme_ocean',     '바다',    '#3B7EA1', 100),
  ('FONT',   'font_default',    '기본',    NULL, 0),
  ('ICON',   'icon_default',    '기본',    NULL, 0),
  ('EFFECT', 'effect_default',  '없음',    NULL, 0),
  ('EFFECT', 'effect_confetti', '색종이',  NULL, 50);
