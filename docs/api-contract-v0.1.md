# API 계약 — v0.1

오늘 화면에 필요한 최소 엔드포인트.

Base URL: http://localhost:8080
Content-Type: application/json
인코딩: UTF-8

---

## 공통 규칙

### JSON 키 형식

snake_case를 쓴다. DB 컬럼명과 일치시켜 변환 지점을 줄인다.

### 날짜 형식

| 종류 | 형식 | 예시 |
|---|---|---|
| 날짜 | YYYY-MM-DD | 2026-09-11 |
| 날짜+시각 | YYYY-MM-DDTHH:mm:ss | 2026-09-11T10:00:00 |

타임존은 KST 고정. 응답에 오프셋을 붙이지 않는다.

### 인증

v0.1에서는 인증을 구현하지 않는다. 모든 요청이 고정 사용자(user_id = 1)를 쓴다.
v1.0에서 구글 OAuth로 대체한다.

이 결정 때문에 서비스 계층은 처음부터 userId를 인자로 받도록 설계한다.
나중에 인증을 붙일 때 컨트롤러만 바꾸면 되게.

### 에러 응답

    { "code": "TASK_NOT_FOUND", "message": "해당 태스크를 찾을 수 없습니다" }

| 상태 | 언제 |
|---|---|
| 400 | 필수 값 누락, 형식 오류 |
| 404 | 대상이 없음 |
| 500 | 서버 오류 |

---

## 1. 오늘 화면 조회

    GET /api/today?date=2026-09-11

앱 진입 시 필요한 데이터를 한 번에 받는다. 왕복을 줄이기 위해 묶는다.

응답 200

    {
      "date": "2026-09-11",
      "todo": [
        {
          "id": 2,
          "title": "치과 예약 전화",
          "horizon": "THIS_WEEK",
          "task_date": "2026-09-11",
          "scheduled_start": null,
          "scheduled_end": null,
          "completed_at": null,
          "effective_at": null,
          "memo": null,
          "sort_order": 1000
        }
      ],
      "done": [
        {
          "id": 1,
          "title": "폼 유효성 검사",
          "horizon": "THIS_WEEK",
          "task_date": "2026-09-11",
          "scheduled_start": "2026-09-11T10:00:00",
          "scheduled_end": "2026-09-11T11:30:00",
          "completed_at": "2026-09-11T11:24:33",
          "effective_at": "2026-09-11T11:24:33",
          "memo": "세 번째 버전이 제일 낫다",
          "sort_order": 2000
        }
      ]
    }

- todo — completed_at IS NULL, sort_order 오름차순
- done — completed_at IS NOT NULL, completed_at 내림차순
- deleted_at IS NOT NULL인 항목은 제외

---

## 2. 태스크 생성

    POST /api/tasks

요청

    { "title": "폼 유효성 검사" }

| 필드 | 필수 | 기본값 |
|---|---|---|
| title | O | — |
| task_date | X | null |
| horizon | X | SOMEDAY |
| scheduled_start | X | null |
| scheduled_end | X | null |

title만 필수다. "제목 하나면 태스크가 성립한다"는 원칙(기획서 A-4)의 API 표현.

응답 201 — 생성된 태스크 전체

응답 400 — title이 비었거나 공백만 있을 때

    { "code": "TITLE_REQUIRED", "message": "제목을 입력해주세요" }

---

## 3. 태스크 완료

    PATCH /api/tasks/{id}/complete

요청 바디 없음.

동작

    completed_at = 현재 시각
    effective_at = 현재 시각

멱등하다. 이미 완료된 태스크에 다시 호출해도 completed_at을 덮어쓰지 않고 현재 상태를 반환한다.

PWA 오프라인 동기화 시 같은 요청이 여러 번 온다(기획서 7.10). 재시도해도 안전해야 한다.

응답 200 — 태스크 전체

응답 404

    { "code": "TASK_NOT_FOUND", "message": "해당 태스크를 찾을 수 없습니다" }

---

## 4. 태스크 완료 취소

    PATCH /api/tasks/{id}/uncomplete

동작

    completed_at = null
    effective_at = null

역시 멱등. 이미 미완료여도 200을 반환한다.

---

## 5. 한 줄 메모

    PATCH /api/tasks/{id}/memo

요청

    { "memo": "세 번째 버전이 제일 낫다" }

- 평문. 마크다운 파싱 없음 (기획서 A-6-4)
- 최대 500자
- null을 보내면 메모 삭제

응답 200 — 태스크 전체

---

## 6. 태스크 삭제

    DELETE /api/tasks/{id}

소프트 삭제. 물리 삭제하지 않고 deleted_at을 채운다(기획서 A-4 원칙 3).

응답 204 — 본문 없음

---

## 응답 객체 — Task

모든 엔드포인트가 같은 모양을 반환한다.

| 필드 | 타입 | 설명 |
|---|---|---|
| id | number | 고유 번호 |
| title | string | 제목 |
| horizon | string | THIS_WEEK / NEXT_WEEK / SOMEDAY |
| task_date | string / null | 어느 날 목록에 올라와 있는지 |
| scheduled_start | string / null | 몇 시에 하기로 했는지 |
| scheduled_end | string / null | |
| completed_at | string / null | null이면 미완료 |
| effective_at | string / null | 기록 기준 시각 |
| memo | string / null | 한 줄 메모 (평문) |
| sort_order | number | 목록 정렬 순서 |

deleted_at, user_id, created_at, updated_at은 응답에 포함하지 않는다.
클라이언트가 쓸 일이 없고, 내부 구조를 노출할 이유가 없다.

---

## v0.1에서 만들지 않는 것

| 항목 | 언제 |
|---|---|
| 인증 / 로그인 | v1.0 |
| 시간 배정 (드래그) | v0.2 |
| 정렬 변경 | v0.2 |
| 반복 | v0.3 |
| 프로젝트 연결 | v0.4 |
| 페이징 | 데이터가 쌓이면 |

---

## 확인용 curl

    curl -X POST http://localhost:8080/api/tasks \
      -H "Content-Type: application/json" \
      -d '{"title":"폼 유효성 검사"}'

    curl "http://localhost:8080/api/today?date=2026-09-11"

    curl -X PATCH http://localhost:8080/api/tasks/1/complete

    curl -X PATCH http://localhost:8080/api/tasks/1/memo \
      -H "Content-Type: application/json" \
      -d '{"memo":"짧게 쓰니까 읽힌다"}'

    curl -X DELETE http://localhost:8080/api/tasks/1
