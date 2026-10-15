-- 수확(체리 지급) 중복 방지. 완료를 취소해도 지우지 않는다 — 완료→취소→재완료를
-- 반복해도 체리는 마일스톤당 한 번만 나온다 (point_ledger가 포인트에 하는 역할).
ALTER TABLE milestone ADD COLUMN harvested_at DATETIME NULL;

-- 이미 완료된 마일스톤은 수확이 끝난 것으로 본다.
UPDATE milestone SET harvested_at = completed_at WHERE completed_at IS NOT NULL;

-- 삭제된 프로젝트의 밭은 칸만 차지하고 화면에도 남아 있었다. 프로젝트 삭제 시 밭도
-- 같이 지우도록 바꾸면서 이미 남아 있던 것도 정리한다.
DELETE fp FROM farm_plot fp
JOIN project p ON p.id = fp.project_id
WHERE p.deleted_at IS NOT NULL;
