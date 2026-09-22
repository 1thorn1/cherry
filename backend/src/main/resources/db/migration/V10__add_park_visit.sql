CREATE TABLE park_visit (
  visitor_id BIGINT NOT NULL,
  host_id    BIGINT NOT NULL,
  visited_on DATE   NOT NULL,
  PRIMARY KEY (visitor_id, host_id, visited_on),          -- 하루 1회
  CONSTRAINT fk_visit_visitor FOREIGN KEY (visitor_id) REFERENCES user(id),
  CONSTRAINT fk_visit_host FOREIGN KEY (host_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
