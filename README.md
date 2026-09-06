# 체리 (Cherry)

체크하며 리마인드. 오늘 할 일을 체크하면 공원이 지어지는 생산성 앱.

## 스택
- Frontend: React 18, TypeScript, Vite, Tailwind CSS
- Backend: Spring Boot 3, Java 21, JPA
- DB: MySQL 8
- Infra: Docker Compose

## 구조
- backend/ - Spring Boot API
- frontend/ - React PWA
- docs/ - 기획서, API 계약

## 컨벤션

### 브랜치
- main - 배포 가능한 상태
- feat/12-task-entity - 기능
- fix/31-null-check - 버그
- chore/3-flyway-setup - 설정, 빌드
- docs/1-readme - 문서

숫자는 이슈 번호. 브랜치 이름에 #은 쓰지 않는다 (셸에서 주석으로 해석됨).
이슈 연결은 커밋 메시지와 PR 본문의 Closes #N이 담당한다.

한 번에 하나의 브랜치만 유지한다.
main에 직접 커밋하지 않는다. 모든 변경은 PR을 거친다.
PR 머지는 squash + 브랜치 삭제.

### 커밋
feat / fix / refactor / test / docs / chore 접두어를 붙인다.

- feat: 새 기능
- fix: 버그 수정
- refactor: 동작은 그대로, 코드 구조 개선
- test: 테스트 추가/수정
- docs: 문서만
- chore: 그 외 전부 (설정, 빌드, 의존성, 인프라)

예) feat: 태스크 생성 API 구현
