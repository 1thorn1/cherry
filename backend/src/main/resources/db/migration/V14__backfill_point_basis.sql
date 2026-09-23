-- V13에서 point_basis를 0으로 추가했는데, 이미 쌓여 있던 날짜의 points_earned는
-- 전부 예전 방식(BASE_PER_COMPLETION=2, 반복 구분 없음)으로 계산된 값이다.
-- 그대로 두면 오늘 안에 다음 완료가 생길 때 point_basis=0에서 새로 계산해
-- 기존 points_earned보다 훨씬 낮은 값이 나와 포인트가 갑자기 깎여 보인다.
UPDATE daily_stat SET point_basis = completed_count * 2;
