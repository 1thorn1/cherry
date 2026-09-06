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
- feat/#12-task-entity - 기능
- fix/#31-null-check - 버그
- chore/#3-flyway-setup - 설정, 빌드
- docs/#1-readme - 문서

main에 직접 커밋하지 않는다. 모든 변경은 PR을 거친다.

### 커밋
feat / fix / refactor / test / chore / docs 접두어를 붙인다.

예) feat: 태스크 생성 API 구현
