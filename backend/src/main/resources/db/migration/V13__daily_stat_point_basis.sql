-- 반복 항목 포인트 어뷰징 방어(A-6-7): completed_count는 순수 완료 개수로 남기고,
-- 포인트 계산 전용 가중치 합계를 따로 둔다 (반복 항목은 일반 항목보다 낮은 가중치를 더한다).
ALTER TABLE daily_stat ADD COLUMN point_basis INT NOT NULL DEFAULT 0 AFTER completed_count;
