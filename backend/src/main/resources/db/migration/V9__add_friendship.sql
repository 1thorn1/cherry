CREATE TABLE friendship (
  id           BIGINT      NOT NULL AUTO_INCREMENT,
  requester_id BIGINT      NOT NULL,
  addressee_id BIGINT      NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'PENDING',   -- PENDING | ACCEPTED
  created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted_at  DATETIME    NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_friend (requester_id, addressee_id),
  KEY idx_friend_addressee (addressee_id, status),
  CONSTRAINT fk_friend_requester FOREIGN KEY (requester_id) REFERENCES user(id),
  CONSTRAINT fk_friend_addressee FOREIGN KEY (addressee_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
