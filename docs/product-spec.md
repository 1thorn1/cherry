# 기획서 + 기술 명세서

**프로젝트명:** **체리 (Cherry)** — 체크하며 리마인드
**작성일:** 2026-09-02
**최종 수정:** 2026-09-14
**문서 상태:** 설계 확정. 열린 결정 없음
**스택:** React (PWA) / Spring Boot / MySQL 8

---

# PART A. 기획서

## A-0. 이름

**체리 (Cherry)** — **체**크하며 **리**마인드

이 앱은 알림으로 재촉하는 앱이 아니다. **잊고 있던 것을 다시 보여주는** 쪽의 리마인드다.

- 완료가 사라지지 않고 옆에 쌓인다
- 프로젝트 페이지가 저절로 채워져 "8월에 이걸 했구나"가 보인다
- 공원의 기구가 어느 마일스톤에서 나왔는지 남는다
- 주간 돌아보기

**체리는 앱 안에서 보상 단위로도 쓰인다.** 포인트를 "체리"라고 부른다. 이름이 곧 목표가 되어 "오늘 체리 몇 개 벌었지"가 자연스럽게 나온다.

> 검색 고유성 문제로 표기는 "체리파크"를 쓸 수 있다. 부를 때는 "체리". *(미확정)*

---

## A-1. 한 줄 정의

> 오늘 할 일을 체크하면 내 공원이 지어지고, 프로젝트 기록은 저절로 쌓이는 생산성 앱.

## A-2. 문제 정의

기존 도구를 쓰면서 겪은 세 가지 불편에서 출발한다.

| 도구 | 문제 |
|---|---|
| 투두메이트 등 투두 앱 | 오늘만 보인다. 여러 날 걸리는 일의 **앞이 안 보인다** |
| 구글 캘린더 / 노션 | 좁은 날짜 칸에 일정을 욱여넣는다. **프로젝트를 담기에 부적합** |
| 공통 | 계속 쓸 이유가 없다. **성취가 눈에 보이지 않는다** |

추가로, 기존 도구는 쓰기 전에 설정할 게 많다. 프로젝트를 만들고 속성을 정하고 뷰를 만들어야 비로소 할 일을 적을 수 있다. **이 마찰이 이 서비스를 만드는 근본 이유다.**

## A-3. 타깃

- 여러 날에 걸친 개인 프로젝트(포트폴리오, 사이드 프로젝트)를 굴리는 사람
- 강의 완주·자격증 같은 진도형 공부를 병행하는 사람
- 노션이 과하다고 느끼고, 투두 앱은 부족하다고 느끼는 사람
- 게임에 익숙해서 "짓는 재미"가 동기가 되는 사람

1차 사용자는 제작자 본인. 자기가 매일 쓰는 것이 성공 기준이다.

## A-4. 핵심 원칙 (설계 판단이 갈릴 때 여기로 돌아온다)

### 원칙 1 — 제목 하나면 할 일이 성립한다
프로젝트, 시간, 마감, 태그 무엇도 묻지 않는다. 텍스트만 던지면 저장된다.
가입 직후 3초 안에 첫 할 일을 적을 수 있어야 한다.

### 원칙 2 — 완료는 사라지지 않는다
체크한 항목은 목록에서 지워지지 않고 완료 영역으로 이동한다.
모든 완료는 **시각과 함께** 기록된다.

### 원칙 3 — 기록은 자동으로 쌓인다
프로젝트 페이지는 사용자가 쓰는 문서가 아니라, 완료 이벤트가 만드는 로그다.
아무것도 안 써도 페이지가 비어 있지 않다. 쓴 만큼만 살이 붙는다.

### 원칙 4 — 벌주지 않는다
- 날씨 배율은 **1.0 미만으로 내려가지 않는다**
- 안 한 날은 공원이 망가지는 게 아니라 조용할 뿐이다
- 밀린 항목을 세어 보여주지 않는다. "며칠 밀림" 대신 "이렇게 하면 맞출 수 있음"
- 포인트로 **기능을 잠그지 않는다.** 장식만 판다

### 원칙 5 — 월 그리드 캘린더를 만들지 않는다
하나라도 만들면 결국 거기로 들어가게 되고, 애초에 벗어나려던 경험이 돌아온다.
시간축은 **주간 시간표**와 **프로젝트 레인** 두 가지로만 표현한다.

## A-5. 정보 구조

탭 4개. 하단 고정.

```
오늘 (기본 진입)  |  캘린더  |  프로젝트  |  공원
```

- **오늘** — 할 일 목록 + 완료 영역 + 오늘의 시간표
- **캘린더** — 주간 시간표 (월 그리드 없음)
- **프로젝트** — 진행 현황(트랙) + 기록 타임라인 + 검색
- **공원** — 지어진 기구, 인구/방문객/포인트, 커스텀 상점

## A-6. 화면 명세

### A-6-1. 오늘 (기본 진입 화면)

**상단**
- 인사 + 날짜
- 오늘의 공원 상태 한 줄: 날씨, 배율, 오늘 방문객 수
- "이번주에서 당겨오기" 버튼

**좌측: 할 일 목록**
- 카드 하나 = 태스크. 체크박스 + 제목 + 프로젝트 태그
- 입력창은 목록 하단에 상시 노출. `#프로젝트명`으로 즉시 묶기 지원
- 시간이 지정된 항목은 시각을 우측에 작게 표기
- **반복 항목**은 순환 아이콘 + 규칙 표기 ("월·수·금"). 일반 항목과 같은 목록에 섞여 있다

**좌측 하단: 완료 영역**
- 체크하면 이 영역으로 이동. 완료 시각 표시
- 완료 직후 **한 줄 메모 입력창이 잠깐 열린다** (평문, 선택)
- 시간이 지정된 항목은 함께 **완료 시각 기준 칩**이 뜬다 — `예정대로 08:00` / `지금 23:14` / 직접 입력
  - 기본값은 반복별 설정을 따른다. 다르게 남기고 싶은 날만 그 자리에서 바꾼다
- 안 적으면 항목만 남는다
- 반복 항목에는 누적 표기 ("이번 달 24일"). **끊긴 일수를 세지 않는다**

**우측: 시간표**
- 시간이 지정된 항목만 표시
- 좌측 목록에서 **끌어다 놓으면 시간이 생긴다.** 시간 지정은 항상 선택
- 상단 토글: **예정 / 실제**
  - 예정 = `scheduled_start` 기준으로 그림
  - 실제 = `completed_at` 기준으로 그림
  - 항목별로 고르지 않고 **화면 전체가 한 번에 전환**된다

> 두 뷰를 비교하면 "아침에 잡은 계획보다 항상 2시간씩 밀린다" 같은 자기 패턴이 보인다.
> 이건 2주만 쌓여도 나오는 정보이고, 다른 앱에는 거의 없다.

### A-6-2. 캘린더 (주간)

- 오늘 화면의 시간표가 7일치로 늘어난 형태. **화면 문법이 같아서 배울 게 없다**
- 예정/실제 토글 동일 적용
- 상단 **종일 줄** — 시간 미지정 항목이 어느 날에 몰렸는지
- **반복 미래 미리보기** — 점선. 행이 아직 없으므로 체크 불가
- **주말 흐림** — `project.work_days` 반영
- 레인은 넣지 않는다. 프로젝트 탭과 중복되면 어디를 봐야 할지 모호해진다
- 월 그리드 없음

### A-6-3. 프로젝트 — 목록

제목: "공사 중인 것들"

1. **겹침 경고 배너** — "10월 2주에 두 개가 같이 끝나요. 하나를 당기거나 미루는 게 좋아요"
   카드 목록으로는 절대 볼 수 없는 정보. 이 탭에 들어올 이유가 된다.
2. **압축 레인 타임라인** — 프로젝트별 막대를 6주 격자 위에 표시. 오늘 위치 세로선
3. **포커스 카드 (1개)** — 롤러코스터 트랙으로 진행 표현
   - 마일스톤 1개 = 트랙 1구간
   - 완공 구간은 실선 + 기둥, 남은 구간은 점선
   - 현재 위치에 카트 표시
   - 포커스 대상은 **최근 7일 완료가 가장 많은 프로젝트를 앱이 자동 선정** (사용자 설정 아님)
4. **나머지 프로젝트** — 축약 행. 진행 도트 + 핵심 지표

### A-6-4. 프로젝트 — 상세

탭 2개: **진행 / 기록**

**진행 탭**
- 트랙 또는 진도 그리드 (타입에 따라 다름)
- 이번주 목표량 및 페이스 안내
- "N강 오늘 할 일로 보내기" 버튼

> 진도 그리드에서 직접 체크하지 않는다. 모든 완료는 오늘 화면에서만 일어난다.
> 그래야 시간표·공원·통계로 데이터가 한 줄로 흐른다.

**기록 탭** (타임라인)
- **얇은 한 줄** = 자동 로그 (완료 이벤트가 생성)
- **카드** = 사람이 쓴 기록
- 마일스톤 구간별로 구분선. 완료 구간엔 소요 일수 표기 ("완료 · 12일")
- 상단에 입력 진입점 상시 노출

**기록 타입 3종** (아이콘 클릭이 곧 타입 선택)

| 타입 | 내용 | 형식 |
|---|---|---|
| 메모 | 결정, 막힌 것, 정리 | **마크다운** |
| 링크 | URL + 한 줄 설명 | 평문 |
| 이미지 | 스크린샷 | 캡션 평문 |
| 구간 회고 | 마일스톤 닫을 때 1회 | 마크다운 |

한 줄 메모(완료 직후)는 **평문**. 3초 안에 던지는 자리라 문법이 방해된다.

> **노션과의 경계선:** 표·토글·데이터베이스·블록 에디터는 만들지 않는다.
> "이 세 개로 안 되면 그건 노션에 쓰세요"가 정직한 태도다.

### A-6-5. 검색

- **전역 검색.** 프로젝트를 넘나들며 찾는다
- 검색 대상: 태스크 제목, 한 줄 메모, 기록 본문, 링크 제목/URL
- **필터를 먼저 고르게 하지 않는다.** 검색 → 결과 → 타입 칩으로 좁히기 (칩에 건수 표시)
- 결과마다 맥락 줄: `프로젝트 · 구간 · 날짜`
- 매칭 부분 하이라이트
- 빈 검색어일 때는 최근 기록 표시

### A-6-6. 공원

- **기구 슬롯** — 마일스톤 1개 완료 = 기구 1개. 실내/야외 구분 있음
- **지표 3종**
  - 인구 = 누적 성취. 계속 우상향
  - 오늘 방문객 = 인구 × 오늘 활동 × 날씨 배율
  - 포인트 = 방문객이 그날 벌어준 값
- **상점** — 테마 / 폰트 / 아이콘 / 완료 이펙트. **장식만**

### A-6-7. 반복 일정

매일 반복되는 일을 매일 손으로 적는 것은 **이 앱이 없애려는 마찰 그 자체**다. 원칙 1에 직결되므로 v1 필수.

캘린더급 반복(RRULE, 예외 처리)은 만들지 않는다. 개인 용도의 대부분은 세 규칙으로 충분하다.

| 규칙 | 입력 | 예시 |
|---|---|---|
| 매일 | — | 약 먹기 |
| 요일 | 요일 다중 선택 | 월·수·금 스트레칭 |
| 매월 | 날짜 1개 | 매월 5일 월세 |

**설계 규칙**

1. **놓친 날은 이월하지 않는다.** 어제 안 한 반복은 오늘 목록에 오르지 않는다.
   며칠 밀린 항목이 따라다니면 목록이 죄책감 덩어리가 된다. (원칙 4)
2. **미래 날짜를 미리 만들지 않는다.** 오늘 것만 생성. 앞날은 규칙으로 계산해 표시만 하고 체크 불가
3. **과거를 소급 생성하지 않는다.** 앱을 3일 안 켜도 밀린 행이 쌓이지 않는다
4. **규칙을 수정해도 이미 생성된 과거 행은 그대로 둔다** (스냅샷 원칙)
5. **누적은 긍정형으로 표기.** "3일 놓침"이 아니라 "이번 달 24일". 끊겨도 0으로 리셋하지 않는다

**부작용 방어**

| 위험 | 대응 |
|---|---|
| 반복 10개 만들고 체크만 반복 → 포인트 어뷰징 | 반복 항목 적립을 일반보다 낮게. 세계관상 "매일 오는 손님이라 신규 방문객이 적다" |
| 프로젝트 기록에 "약 먹기"가 매일 한 줄씩 → 타임라인 오염 | 자동 로그에서 반복 항목은 접어서 한 줄로 ("약 먹기 × 24") |

### A-6-8. 완료 시각 기준

**체크한 시각과 실제로 한 시각은 다른 경우가 더 많다.** 약은 8시에 먹고 체크는 밤 11시에 할 수 있다. 그대로 기록하면 실제 뷰 시간표가 밤에 몰려 하루 모양이 왜곡된다.

세 층으로 분리한다.

| 값 | 의미 | 변경 |
|---|---|---|
| `completed_at` | 체크 버튼을 누른 물리적 시각 | 불변. 항상 기록 |
| `effective_at` | 몇 시에 한 것으로 칠지. 기록·시간표·통계의 기준 | 사용자가 조정 가능 |
| `routine.time_basis` | 반복별 기본 정책 (`CHECKED` / `SCHEDULED`) | 반복 생성 시 지정 |

- 전역 설정이 아니라 **반복마다** 정한다. 약처럼 정시성이 중요한 것과 일반 할 일은 답이 다르다
- 조회는 `COALESCE(effective_at, completed_at)` 기준
- 시간표의 예정/실제 토글은 **보기 전환**일 뿐, 저장값을 바꾸지 않는다

### A-6-9. AI 프로젝트 초안 *(v2)*

자유형 프로젝트를 만들 때 **마일스톤을 직접 정하는 것**이 남은 가장 큰 마찰이다. 자연어 한 줄로 초안을 받는다.

**입력 예시**
> "9월 2일부터 30일까지 포트폴리오 리뉴얼 끝내고 싶어. 주말은 쉬고 싶고, 배포까지는 해야 해."

**추출 항목**

| 항목 | 저장 위치 | 위 예시에서 |
|---|---|---|
| 프로젝트명 | `project.name` | 포트폴리오 리뉴얼 |
| 기간 | `project.deadline_week` | 2026-W40 |
| 타입 | `project.type` | FREE |
| 작업 요일 | `project.work_days` (신규) | 월~금 |
| 마일스톤 목록 | `milestone` N건 | 4구간 |

> **"주말은 쉬고 싶어"의 처리**
> 마일스톤은 주 단위라서 주말 제외가 구간을 바꾸지는 않는다. 대신 `work_days`로 저장되어
> **진도형·시험형의 페이스 계산**에 쓰인다. "남은 21일에 13강"이 아니라 "남은 평일 15일에 13강"이 된다.
> 반복 생성 시 요일 기본값으로도 재사용한다.
> 자연어에는 UI로 물어보면 귀찮은 제약 조건이 딸려 온다는 점이 이 기능의 진짜 가치다.

**UX 규칙**

1. 결과는 **초안**이다. 모든 항목이 그 자리에서 편집 가능
2. **"빈 프로젝트로" 탈출구를 항상 둔다.** 제안이 마음에 안 들 때 빠져나갈 길이 없으면 재사용하지 않는다
3. "다시 제안받기" 제공
4. 실패·타임아웃 시 조용히 빈 프로젝트 생성 화면으로 폴백

### A-6-10. 자연어 할 일 입력 *(v1 로컬 파서 / v2 AI)*

**2단 구조로 만든다.**

| 단계 | 방식 | 처리 |
|---|---|---|
| 1 | 로컬 규칙 파서 (정규식) | "내일", "3시", "매주 월수금", "다음주 금요일까지" 등 한국어 날짜 표현 |
| 2 | LLM 호출 | 1단계가 실패했을 때만 |

**원칙**

- **AI 없이도 저장되는 경로가 기본.** 엔터를 치면 즉시 저장된다. 응답을 기다려야 저장되면 "빠르게 던진다"는 감각이 깨진다
- **원문을 제목으로 보존.** 파싱 결과는 부가 정보. 잘못 해석해도 내용은 남는다
- **확인은 한 번의 탭.** 파싱 결과를 칩으로 보여주고, 맞으면 그대로, 틀리면 칩 하나만 수정
- 로컬 파서는 오프라인에서도 동작하고 비용이 없다. v1은 이것만으로 충분하다

### A-6-11. 주간 패턴 돌아보기 *(v2)*

부록의 "2주 자기 관찰"을 앱이 대신한다. **사용자에게 아무것도 묻지 않는다.** 필요한 데이터는 이미 쌓여 있다.

| 알고 싶은 것 | 계산 근거 |
|---|---|
| 아침에 계획하는가 / 그때그때 하는가 | `created_at`이 `task_date`보다 얼마나 앞서는가 |
| 계획을 얼마나 지키는가 | `scheduled_start` 대 `effective_at` 평균 편차 |
| 여러 개 굴리는가 / 하나씩 끝내는가 | 활성 프로젝트 수 대비 완료 분산도 |
| 언제 잘 되는가 | `effective_at`의 요일·시간대 분포 |
| 마감이 동력인가 / 압박인가 | 마감 임박도와 완료 밀도의 상관 |

**핵심 구조 — 지표는 코드가, 서술만 LLM이**

```
1. SQL/코드로 지표 계산   → 편차 +1h40m, 전날 밤 추가 78%, 집중도 71% …
2. 계산된 숫자만 LLM에 전달 (제목·메모 원문은 보내지 않음)
3. LLM은 숫자를 문장으로 옮기고 제안 1건 생성
```

원시 로그를 던지고 "분석해줘"라고 하면 안 된다. 숫자 세기는 LLM이 가장 취약한 작업이라 환각이 섞이고, 매주 결과가 달라져 신뢰가 쌓이지 않는다.

**부수 효과:** 집계 숫자만 전송하므로 **할 일 내용이 외부로 나가지 않는다.** 개인 일정 앱에서 큰 이점이며, UI에 명시한다.

**규칙 4가지**

1. **성격을 규정하지 않는다.** "계획성이 부족합니다"는 원칙 4 위반.
   관찰만 서술하고 판단하지 않는다 — "늦었다"가 아니라 "이만큼 차이가 났다"
2. **표본이 부족하면 침묵한다.** 최소 3주 + 완료 30건. 데이터 5개로 단정하면
   한 번 틀리는 순간 기능 전체의 신뢰를 잃는다
3. **관찰이 앱 동작으로 이어진다.** "당신은 이런 사람입니다"로 끝나면 심리테스트다.
   카드 하단에 **적용 버튼**을 둔다

   | 관찰 | 연결되는 동작 |
   |---|---|
   | 완료가 밤에 몰림 | 반복 생성 시 기본 시각 제안 |
   | 계획 대비 편차 큼 | 시간표 블록 기본 길이 확대 |
   | 프로젝트 3개일 때 완료율 하락 | 새 프로젝트 생성 시 1회 안내 |
   | 특정 요일에만 진도 | 진도형 페이스를 그 요일에 몰아 배분 |

4. **주 1회.** 일요일 저녁 오늘 화면 상단에 카드 1장. 매일은 노이즈, 매달은 잊힌다

### LLM 기능 공통 원칙

세 기능 모두 **없어도 앱이 완전히 동작한다.** LLM 장애·타임아웃 시 조용히 폴백하며, 사용자에게 오류를 노출하지 않는다.

| 기능 | LLM 역할 | 실패 시 |
|---|---|---|
| 자연어 할 일 입력 (A-6-10) | 로컬 파서 실패 시 폴백 | 원문 그대로 저장 |
| 프로젝트 초안 (A-6-9) | 마일스톤 구조 제안 | 빈 프로젝트 생성 |
| 주간 돌아보기 (A-6-11) | 지표를 문장으로 서술 | 카드 미표시 |

### A-6-12. 외부 캘린더 연동 *(v2)*

**목적은 "오늘 실제로 쓸 수 있는 시간"을 보이게 하는 것.** 회의가 3시간 잡힌 날에 할 일 8개를 배치하면 계획이 아니라 희망이다.

#### 방향은 가져오기만

| 방향 | 방식 | 판단 |
|---|---|---|
| 가져오기 | 구글 Calendar API / ICS 구독 | **한다** |
| 내보내기 | 우리가 ICS 피드 발행 → 사용자가 구독 | 한다 (읽기 전용) |
| 양방향 동기화 | 구글에 쓰기 | **하지 않는다** |

양방향은 충돌·중복·삭제 전파·반복 예외가 전부 따라오고, 사용자 캘린더를 우리 데이터로 오염시킨다.

#### 서비스별 현실

| 서비스 | 방법 |
|---|---|
| 구글 | Calendar API (`calendar.readonly`) 또는 ICS |
| 애플 | 공식 API 없음 → **ICS 구독 URL** |
| 아웃룩 | ICS 구독 URL |
| **삼성** | **외부 ICS URL 구독도, 자기 캘린더의 ICS URL 발행도 지원하지 않는다** |

삼성 캘린더는 연동 경로가 사실상 없다. 다만 대부분의 사용자가 삼성 캘린더에 구글 계정을 연결해 쓰므로 **구글 연동으로 커버된다.** 순수 삼성 계정 저장분은 "삼성 캘린더에서 구글 계정으로 저장하도록 설정" 안내로 처리한다.

**ICS부터 구현한다.** 애플·아웃룩·구글을 한 방식으로 커버하고, OAuth 스코프를 건드리지 않으며, 구현이 반나절이다. 구글 API는 실시간성이 필요해질 때 추가한다.

#### 체크 가능 여부 — 구분하지 않는다

> **완료는 오직 `task`에만 존재한다.**
> 외부 일정을 체크하면 **그 순간 `task` 행이 생긴다** (지연 실체화).
> 반복 일정과 동일한 패턴이므로 개념이 늘지 않는다.

`task.kind` 같은 구분 칸을 **두지 않는다.** 이유:

- 이 앱은 밀린 항목을 세지 않는다(원칙 4). 따라서 **체크하지 않는 비용이 이미 0**이다
- 체크박스가 두 종류이면 "이건 눌러도 되나?"를 매번 판단하게 되어 오히려 지저분하다
- 출처는 `external_uid` / `routine_id` 유무로 판단 가능하다

| | 저장 | 체크박스 | 포인트 |
|---|---|---|---|
| 내가 적은 할 일 | `task` | 있음 | 정상 |
| 반복 | `task` + `routine_id` | 있음 | 낮음 |
| 외부 캘린더 | `external_event` → 체크 시 `task` | 있음 | 낮음 |

**시각적으로 세 줄이 동일하다.** 뒤에서 하는 일은 다르지만 사용자에게는 전부 "오늘 있는 일"이다.

#### 표시 규칙

- **연동 캘린더가 1개면 라벨 없음. 2개 이상이면 프로젝트 태그 자리에 회색 라벨** (`구글` / `회사` / `학교`)
  - 아이콘을 쓰지 않는다. 체크박스와 제목 사이에 새 열이 생겨 제목 시작점이 줄마다 달라진다
  - 태그 슬롯은 이미 존재하며, 외부 일정은 프로젝트가 없어 그 자리가 비어 있다
- **지난 시간의 항목은 흐려지기만 한다.** 빨간색이나 "미완료" 딱지를 붙이지 않는다
- **수정 불가 안내는 항목을 열었을 때만**

  > 이 일정은 구글 캘린더에서 가져왔어요. 제목과 시간은 구글에서 바꿔주세요.
  > 메모와 완료는 여기서 남길 수 있어요.

  할 수 없는 것만 말하지 말고 할 수 있는 것을 같이 말한다.
- **`show_title` 옵션** — 끄면 제목 없이 "바쁨"으로만 표시. 회사 캘린더를 연동하는 사용자에게 필수

#### 동기화

- **구글 스코프를 로그인 시점에 요구하지 않는다.** 연동을 켤 때 추가 동의(점진적 인증)
- 폴링 15~30분으로 시작. 푸시 알림은 웹훅 관리가 따라오므로 나중에
- **반복 일정은 확장된 형태로 받는다.** 구글은 `singleEvents=true`, ICS는 라이브러리로 확장.
  반복 규칙을 우리가 재해석하지 않는다

### A-6-13. 알림 *(v1.1)*

> **구현하면서 조정 예정.** 아래는 출발점이며, 실제 사용 데이터를 보고 기본값을 다시 정한다.

이 앱에서 **가장 조심해야 하는 기능.** 지금까지 "안 하면 조용히 넘어간다"로 설계해왔는데, 알림은 그 원칙을 가장 쉽게 깨뜨린다.

> **기준: 알림은 "하기로 한 것"만 알리고, "안 한 것"은 말하지 않는다.**

#### 알림 종류

| 종류 | 시점 | 기본 |
|---|---|---|
| 시간 지정 항목 | 항목별 설정 | 10분 전 |
| 반복 항목 | 항목별 설정 | 정시 |
| 아침에 한 번 | 사용자 지정 | 꺼짐 |
| 저녁에 한 번 | 사용자 지정 | 꺼짐 |
| 주간 돌아보기 | 일요일 저녁 | 꺼짐 |

**기본값이 종류마다 다르다.** 약은 정시에 먹어야 하고, 작업은 준비할 시간이 필요하다.

#### 만들지 않는 알림

- "오늘 3개 안 하셨어요"
- "연속 기록이 끊길 수 있어요"
- "공원에 손님이 없어요"
- "마감이 3일 남았어요"

전부 **안 한 것**을 알리는 알림이다. 넣는 순간 사용자가 앱을 끈다.

#### UI — 최소로

- **알림 시점은 칩 4개, 단일 선택.** `안 함` / `정시` / `10분 전` / `30분 전`
  - **5분 전을 넣지 않는다.** 10분 전과 실질 차이가 없다
  - **복수 선택을 넣지 않는다.** 두 개 거는 사용자는 소수인데 UI 복잡도는 두 배가 된다. 요청이 나오면 그때 연다
- 항목을 누르면 시트가 뜨고, 칩을 누르면 **바로 저장되고 닫힌다**
- 목록에서는 알림이 켜진 항목에 **작은 종 아이콘 하나**만
- **설정 화면은 토글 3개가 전부** — 알림 받기 / 아침에 한 번 / 저녁에 한 번
  - 항목별 알림 목록을 설정에 또 두지 않는다. 같은 것을 두 곳에서 관리하면 거기서부터 복잡해진다

#### 기술 제약 (미리 알아둘 것)

- **iOS는 홈 화면에 설치해야만 웹 푸시가 온다.** 사파리 탭 상태에서는 오지 않는다 (iOS 16.4+ & A2HS).
  아이폰 사용자가 알림을 켜려 하면 **먼저 설치를 안내**해야 한다
- **타이머를 클라이언트에 두지 않는다.** 브라우저가 닫히면 동작하지 않는다.
  서버 스케줄러가 발송 시각을 관리하고 웹 푸시를 보낸다 (반복 생성·날씨 수집 스케줄러에 얹는다)
- **정확한 시각은 보장되지 않는다.** 푸시 서비스 사정으로 수 분 지연될 수 있다.
  "정확히 8시 정각"을 약속하지 않는다
- **권한 요청은 토글을 켜는 순간에만.** 첫 실행에 팝업을 띄우면 대부분 거절하고, 되돌리기 어렵다

### A-6-14. 친구 *(v2.0)*

#### 공원이 프라이버시 완충재다

일반적인 투두 앱은 소셜을 붙이기 어렵다. 할 일 제목에 "병원 검사", "이직 면접 준비" 같은 것이 섞여 있기 때문이다.

이 앱은 다르다. **공원은 성취의 추상화**다. 기구 12개가 서 있는 것은 자랑스럽지만, 그것이 무슨 일이었는지는 드러나지 않는다. **보여주고 싶은 것은 보여주면서 내용은 새지 않는 형태**다.

> **기본값: 공원은 공개, 일정은 비공개.**

#### 공개 범위 3단계

| 항목 | 내용 | 기본 |
|---|---|---|
| 공원 보여주기 | 기구, 인구 | **켜짐** |
| 오늘 활동량 | 개수만. 내용은 안 보임 | 꺼짐 |
| 일정 제목 | `is_shared = 1`인 프로젝트만 | 꺼짐 |

**기본값이 전부 안전한 쪽이다.** 실수로 무언가 새는 일이 구조적으로 발생하지 않는다.
개별 태스크 숨김은 만들지 않는다(마찰). 제목 공개는 **프로젝트 단위**로만 제어한다.

#### 만들지 않는 것

- **랭킹 · 리더보드** — 친구가 20개 했는데 내가 2개면 앱을 끈다
- **연속 기록 비교**
- **"친구가 오늘 12개 완료했어요" 알림**
- **미완료 노출**

전부 비교를 만드는 장치다. 소셜은 **구경과 축하까지만.** (원칙 4)

#### 친구 방문 = 방문객 보너스

친구가 놀러오면 내 공원의 오늘 방문객이 늘어난다. **소셜이 게임 메카닉으로 흡수되며**, 놀이공원 은유와 정확히 맞고, "친구 공원 한 바퀴"가 매일 앱을 여는 또 하나의 이유가 된다.

친구가 많은 사람이 유리해지지 않도록 상한을 둔다.

- 하루 방문 보너스는 **3명까지**
- 한 사람당 **하루 1회** — `UNIQUE (visitor_id, host_id, visited_on)`

#### 친구 추가는 코드로

**이름·이메일 검색을 만들지 않는다.** 모르는 사람이 나를 찾을 수 있게 되는 순간 프라이버시 문제가 생기고 신고·차단 기능까지 따라온다. **친구 코드를 직접 공유하는 방식**이면 그 문제가 통째로 사라진다.

`friend_code`는 **v1.0부터 미리 발급**한다. 나중에 도입하면 기존 사용자 전원에게 코드를 소급 생성하는 마이그레이션이 필요하다.

### A-6-15. 같이 하기 *(v2.0)*

"나 오픽 볼 거야" → "오 나도 할래" 처럼 **같은 목표를 함께 진행**하는 방.

#### 친구 기능과 다르게 진도를 서로 공개한다

A-6-14(친구)는 공원만 보여주고 일정은 감춘다. **여기는 반대로 진도를 서로 본다.**

근거: 자기가 방을 만들거나 초대를 수락해서 **자발적으로 들어온 관계**다. 스터디 그룹과 같다. 서로 보이는 것이 이 기능의 존재 이유이고, 감시가 싫으면 애초에 참여하지 않는다.

#### 대신 지키는 것

| 규칙 | 이유 |
|---|---|
| **순위를 매기지 않는다** | 진도를 보여주는 것과 등수를 매기는 것은 다르다. 등수가 붙으면 꼴찌가 생기고, 꼴찌는 나간다 |
| **정렬은 참여순** | 진도순으로 정렬하면 순서만으로 등수처럼 읽힌다 |
| **최근 7일 참여 점 표시** | 숫자만 보면 "몇 회"뿐이지만, 점을 보면 꾸준한지 몰아서 하는지가 드러난다. 회차가 적어도 꾸준하면 그것이 보인다 |
| **잠시 쉬기** | 방은 유지하되 내 진도가 공유되지 않는 상태. 나가는 것보다 심리적 문턱이 낮다 |
| **조용히 나가기** | "쏜님이 나갔습니다" 알림 없음. 못 나가면 앱 전체를 안 열게 된다 |

#### 구조 — 각자 자기 프로젝트를 갖는다

방에 들어오면 **내 계정에 프로젝트가 복제로 생성된다.** 진도·태스크·기록·공원 보상이 전부 평소와 동일하게 동작하고, 방은 그것을 모아 보여주기만 한다.

> **이 구조의 이점: 방을 나가도 내 진도는 그대로 남는다.**
> 오픽 준비를 혼자 계속하면 된다. 나가는 것이 무섭지 않아진다.

#### 공유되는 것

- 각자의 진도 (N / M회, 막대)
- 최근 7일 참여 여부 (점 7개)
- 공유 메모 (선택)

태스크 제목 자체는 공유하지 않는다. 진도 숫자와 참여 여부까지다.

## A-7. 프로젝트 타입 3종

만들 때 숫자 하나만 입력하면 나머지는 자동 생성된다.

| 타입 | 입력값 | 자동 생성 | 예시 |
|---|---|---|---|
| **자유형** | 마일스톤 직접 | — | 포트폴리오 리뉴얼 |
| **진도형** | 총 회차 수 | 회차 1~N | React 강의 20강 |
| **시험형** | 시험 날짜 + 단원 수 | 역산한 주당 분량 | 정보처리기사 D-47 |

진도형·시험형은 마일스톤을 손으로 만들 필요가 없다. 공부 계획이 일반 프로젝트와 다른 지점이다.

## A-8. 게임화 설계

### 보상 루프

```
할 일 체크 → 완료 기록 → 방문객 유입 → 포인트 획득
   → 캘린더 스킨 구매 → 매일 보는 화면이 예뻐짐 → 다시 오늘 화면
```

보상이 **매일 20번 보는 화면 자체**를 바꾼다는 점이 핵심이다. 보상을 확인하러 별도 화면에 들어가지 않는다.

### 방문객 계산

```
오늘 방문객 = floor( 기본치 × (1 + 인구 보정) × 날씨 배율 )
포인트     = 오늘 방문객
```

- 인구가 클수록 하루 수익이 커진다 (오래 쓴 사람이 보상받음)
- 활동이 0이면 방문객 0. 공원이 망가지는 게 아니라 한산할 뿐

### 날씨 (기상청 단기예보 기반)

**모든 날씨가 각자 좋은 날이 된다.** 배율은 1.0 미만으로 내려가지 않는다.

| 날씨 | 효과 |
|---|---|
| 맑음 | 방문객 ×1.2 |
| 흐림 | ×1.0 |
| 비 | 실내 시설당 추가 방문객 |
| 눈 | 겨울 한정 장식 임시 해금 |
| 폭염·한파 | 매점 매출 보너스 |

> **비 오는 날 감점을 넣지 않는 이유**
> ① 이중 처벌 — 이미 컨디션이 안 좋은 날에 앱까지 한마디 얹는다
> ② 장마철 2주간 성장이 눌린다
> ③ 예보가 미리 보이므로 "내일 맑으니 오늘은 쉬자"는 미루기 명분이 생긴다

날씨 문구는 **공원 사건으로 번역**해서 보여준다. "서울 기온 8도, 강수확률 60%"를 그대로 쓰면 그냥 날씨 위젯이고, 그건 이미 폰에 있다.

### 인플레이션 방지

- 커스텀은 목록이 아니라 **조합형** (테마 × 폰트 × 아이콘 × 이펙트)
- 시즌 아이템으로 수명 연장
- **소프트 캡** — 하루 적립 상한. 도달해도 경고하지 않고 조용히 0으로 처리
- 커스터마이즈 범위는 색·폰트·여백·아이콘까지. **레이아웃은 못 건드린다** (가독성 해치면 기본 테마로 돌아가고 루프 전체가 죽는다)

## A-9. 온보딩

가입 시 묻는 것은 **이름 하나**. (소셜에서 받아오므로 사실상 확인만)

1. 소셜 로그인
2. 즉시 "오늘 뭐 할 거예요?" 입력창 하나. 프로젝트·마감 안 물어봄
3. 하나 적고 체크 → **공원에 첫 부지가 깔리고 손님이 들어온다**
4. 그 다음에야 "여러 날 걸리는 일은 프로젝트로 묶어보세요" 안내

3번이 핵심. 개념 설명보다 **한 번 체크해서 공원이 반응하는 걸 보여주는 것**이 빠르다.

- 생년월일은 **받지 않는다** (운세 기능을 나중에 켤 때만)
- 위치 권한을 **묻지 않는다** (가입 시 도시 하나 선택)

## A-10. 범위

세부 순서는 B-10 참조.

### v1.0까지 (공개 전)
오늘 화면 · 할 일 CRUD · 완료/한 줄 메모 · **반복 일정(매일/요일/매월)** · **완료 시각 기준 선택** · 시간표(드래그, 예정/실제) · 프로젝트 3종 · 마일스톤 · 기록(메모·링크, 마크다운) · 검색 · 공원 기본(인구/방문객/체리) · 날씨 · 커스텀 · 구글 로그인 · PWA

### v1.1 ~ v1.2
**알림(A-6-13)** · 주간 캘린더 탭

### v2
깃허브 연동(커밋 = 자동 완료 기록) · **외부 캘린더 연동(A-6-12)** · **AI 프로젝트 초안(A-6-9)** · **자연어 입력 LLM 폴백(A-6-10)** · **주간 패턴 돌아보기(A-6-11)** · 이미지 기록 · 주간 캘린더 고도화 · 커스텀 아이템 확장 · 시즌 · 통계 화면 · 뽀모도로(포인트 없이 연출만)

### 만들지 않는 것
- 월 그리드 캘린더
- 캘린더급 반복 규칙 (RRULE 전체 문법, 회차별 예외 처리, "매월 셋째 화요일" 류)
  → 매일 / 요일 / 매월 세 가지만 지원 (A-6-7)
- 포인트를 주는 뽀모도로 (타이머만 돌리는 게 최적 전략이 된다)
- 기능 잠금 아이템
- 블록 에디터 / 표 / 데이터베이스 뷰

## A-11. 확정된 결정

| 항목 | 결정 |
|---|---|
| **미완료 이월** | **자동 이월 없음.** 어제 못 한 항목은 오늘 목록에 자동으로 뜨지 않는다 |
| **프로젝트 타입 선택** | **묻지 않는다.** 이름만 받고 자유형 생성. 선택 옵션으로 전환 |
| **캘린더 탭** | **주간 시간표만.** 레인은 프로젝트 탭에만 (중복 금지) |
| **공원 렌더링** | **정적 웹 (SVG + CSS).** Unity 미사용 |
| **진도 그리드** | **주차 묶음 + 접기.** 접으면 드롭다운으로 한 주만 |

### 미완료 이월 상세

- 어제 못 한 항목은 `task_date`가 어제인 채로 남고, 오늘 목록에 오르지 않는다
- **잊히지 않게:** 상단 버튼에 배지 → `이번주에서 당겨오기 · 어제 못 한 것 3`
  눌러야 보이므로 부담이 없고, 사라지지도 않는다
- **개별 미루기:** 항목 메뉴에 `내일` / `이번 주말` / `날짜 선택` / `이번주로` 4가지
  - 날짜 선택은 작은 달력 팝오버. **원칙 5와 충돌하지 않는다** —
    금지 대상은 *일정을 보는* 월 그리드이지 날짜를 고르는 피커가 아니다

### 프로젝트 타입 선택 상세

타입이라는 단어를 사용자에게 노출하지 않는다.

```
프로젝트 이름 [                    ]

  ○ 회차가 있어요     ○ 시험일이 있어요
```

- 아무것도 안 누르면 **자유형**
- `회차가 있어요` → 숫자 입력 1칸 펼침 → **진도형**
- `시험일이 있어요` → 날짜 입력 1칸 펼침 → **시험형**
- 생성 후 언제든 전환 가능

### 캘린더 탭 상세

주간 7일 시간표. 오늘 화면의 시간표와 **같은 화면 문법**이므로 새로 배울 것이 없다.

여기서만 볼 수 있는 것 3가지:

| 요소 | 내용 |
|---|---|
| **종일 줄** | 시간을 안 정한 항목이 어느 날에 몰렸는지 |
| **반복 미리보기** | 미래의 반복 항목을 점선으로 표시. 행이 없으므로 **체크 불가** |
| **주말 흐림** | `project.work_days` 반영 |

예정/실제 토글은 오늘 화면과 동일하게 적용.

### 진도 그리드 상세

- **주차로 묶어 표시.** 지난주 / 이번주 / 다음주 + "N–M강 더 보기"
- 이번주 그룹만 강조 (색상 + 진도 표기)
- **접기 지원.** 접으면 한 줄만 남고, 드롭다운으로 볼 주를 선택
  - 드롭다운 항목마다 진도 표기 (`5 / 5`, `2 / 5`) — 다른 주 상태를 알아야 고를 이유가 생긴다
  - 항목: 지난주 / 이번주 / 다음주 / 모두 펼치기
- **기본은 펼침.** 처음 만든 사용자는 접혀 있으면 무엇을 볼지 모른다
- **접힘 상태는 프로젝트별로 기억한다.** 매번 펼쳐지면 접는 의미가 없다
- 40강을 넘어 "다음주부터" 블록이 다시 커지면, 그 안에서 뒷부분만 접는다

---

# PART B. 기술 명세서

## B-0. 기술 스택

### 프론트엔드

| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | **React 18** + Vite | — |
| 언어 | **TypeScript** | 태스크 필드 대부분이 nullable이라 타입 체크의 효용이 크다 |
| 라우팅 | React Router | 탭 4개 + 상세 페이지 |
| 서버 상태 | **TanStack Query** | 낙관적 업데이트가 핵심. 체크 즉시 UI 반영 후 동기화 |
| 클라 상태 | Zustand | 가볍다. Redux는 이 규모에 과함 |
| 스타일 | Tailwind CSS | — |
| 드래그 | **dnd-kit** | 터치 지원이 좋다. react-beautiful-dnd는 유지보수 중단 |
| 마크다운 | react-markdown + remark-gfm + **rehype-sanitize** | sanitize 없으면 XSS |
| 코드 하이라이팅 | shiki 또는 highlight.js | 기록의 코드 블록 |
| 날짜 | **date-fns** | 주차 계산(ISO week) 필요. moment는 사용 중단 권고 |
| PWA | vite-plugin-pwa (Workbox) | 설치, 서비스워커 |
| 오프라인 저장 | **idb** (IndexedDB 래퍼) | 완료 큐잉 |
| 아이콘 | Tabler Icons | — |
| 차트 (v2) | Recharts | 통계 화면 |

### 백엔드

| 영역 | 선택 | 비고 |
|---|---|---|
| 런타임 | **Java 21** + Spring Boot 3.x | — |
| 웹 | spring-boot-starter-web | REST |
| ORM | spring-boot-starter-data-jpa | Hibernate |
| 인증 | spring-boot-starter-security<br>spring-boot-starter-oauth2-client | 구글 / 깃허브 |
| 검증 | spring-boot-starter-validation | — |
| DB 드라이버 | MySQL Connector/J | — |
| 마이그레이션 | **Flyway** | `V1__init.sql` 부터 버전 관리 |
| 동적 쿼리 | QueryDSL *(선택)* | 검색 필터 조합에 유용 |
| 캐시 | spring-cache + Caffeine | 날씨 조회 |
| 스케줄러 | Spring `@Scheduled` | 반복 생성(04:00), 날씨 수집 |
| 문서화 | springdoc-openapi | Swagger UI |
| 보일러플레이트 | Lombok | — |
| 테스트 | JUnit 5 + **Testcontainers** | 실제 MySQL로 테스트 |

### 외부 API

| API | 용도 | 단계 | 비고 |
|---|---|---|---|
| **기상청 단기예보** (공공데이터포털)<br>`VilageFcstInfoService_2.0` | 날씨 배율 | v1 | 무료, 일 10,000회. 격자 변환 필요 (B-6) |
| **Google OAuth 2.0** | 로그인 | v1 | — |
| **GitHub OAuth + REST API** | 로그인, 커밋 연동 | v2 | 커밋 = 자동 완료 기록 |
| **LLM API** (Anthropic / OpenAI) | 마일스톤 초안, 자연어 파싱 | v2 | **반드시 백엔드 프록시**. 프론트에 키 노출 금지 |
| **Google Calendar API** | 외부 일정 가져오기 | v2 | `calendar.readonly`. **점진적 동의** |
| **ICS 구독 URL** | 애플·아웃룩·기타 캘린더 | v2 | 삼성은 미지원 (A-6-12) |
| **S3 / Cloudflare R2** | 이미지 기록 저장 | v2 | DB에 이미지를 넣지 않는다 |

### 인프라

**비용을 결정하는 것은 Spring Boot다.** JVM이 상주해야 하므로 서버리스로 갈 수 없고(콜드 스타트), 메모리도 1GB 이상 필요하다. "24시간 켜져 있는 박스 하나"가 유일한 고정비다.

**MySQL은 사실상 무료다.** 같은 박스에 올린다. 유저 100명이 하루 5건씩 적어도 연 18만 행, 스토리지 수십 MB 수준이다.

**프론트는 어느 구성이든 무료다.** 빌드된 정적 파일이므로 Cloudflare Pages / Vercel 무료 티어로 충분하다.

| 구성 | 내용 | 월 비용 |
|---|---|---|
| **0원** | Oracle Cloud Always Free ARM 1대<br>(Spring + MySQL + nginx) + Cloudflare Pages | **0원** |
| **저가 (권장)** | VPS 1대 (Hetzner ~€4 / Vultr·DO $6) + 정적 호스팅 | **6~9천 원** |
| 관리형 | Railway·Render + 관리형 MySQL | 2~4만 원 |

#### Oracle Always Free 주의점

스펙 자체는 이 앱에 과할 정도로 충분하다. 다만:

- **2026년 6월, 무료 한도가 절반으로 축소됐다.** Ampere A1 할당이 4 OCPU / 24GB → **2 OCPU / 12GB**,
  월 3,000 OCPU-시간 → 1,500시간. **공지 메일 없이 문서만 수정됐다**
- 신규 계정이 사기로 오인되어 거절되거나 무기한 심사 대기에 걸리는 사례가 흔하다
- 승인 후에도 계정이 갑자기 종료됐다는 보고가 있다
- ARM 인스턴스가 리전별 용량 부족으로 생성되지 않는 경우가 잦다

축소된 2 OCPU / 12GB로도 이 앱은 충분히 돌아간다. 다만 **무료 티어는 언제든 바뀐다는 전제**로 설계한다.

#### 이식성 확보 (필수)

무료 티어를 쓰되 거기에 묶이지 않는다.

1. **Docker Compose로 묶는다** — Spring Boot + MySQL + nginx. 어느 박스로든 그대로 이사
2. **`mysqldump` 일일 백업** — 오브젝트 스토리지(무료 한도 내) 또는 외부
3. 벤더 고유 서비스(관리형 큐, 전용 함수 등)에 의존하지 않는다

이렇게 두면 계정이 닫히거나 정책이 또 바뀌어도 VPS로 한 시간 안에 이전할 수 있다.

#### 배포 시 주의

- **쿠키:** 프론트와 백엔드 도메인이 다르면 `SameSite=None; Secure` 필요.
  가능하면 같은 도메인의 `/api` 경로로 두는 편이 훨씬 단순하다
- CORS 허용 오리진을 환경변수로 관리
- 로컬 개발: Docker Compose (MySQL 8)

### 운영 비용 추정 (유저 100명 기준)

| 항목 | 월 |
|---|---|
| 인프라 (0원 구성) | 0원 |
| 인프라 (VPS 구성) | 6~9천 원 |
| LLM (v2, Haiku 기준) | 약 6천 원 |
| 도메인 | 1~2천 원 |
| **합계** | **1만 원 안팎** |

**LLM 토큰 계산 근거** — Haiku 4.5 기준 입력 $1 / 출력 $5 per MTok, 배치 50% 할인

| 기능 | 유저당 월 입력 | 유저당 월 출력 |
|---|---|---|
| 주간 돌아보기 (주 1회) | ~2,150 | ~1,720 |
| 프로젝트 초안 (월 2–3회) | ~1,500 | ~1,250 |
| 자연어 폴백 (월 20–30회) | ~7,500 | ~3,750 |
| 유저 1명 합계 | **~11,000** | **~6,700** |

100명 → 입력 1.1M ($1.1) + 출력 0.67M ($3.4) ≈ **$4.5/월**

토큰이 작은 이유는 설계에 이미 있다. **집계 숫자만 전송**(원문 미전송)이 프라이버시 대책이자 토큰 대책이고, **로컬 파서 1차 처리**가 호출 자체를 80% 제거한다.

### 과금 경계 (정책)

**시간 기반 무료 체험을 쓰지 않는다.** 두 달 쓰고 공원을 지어놓은 사용자에게 잠금이 걸리면, 성실하게 쓴 사람을 벌주는 구조가 된다 — 원칙 4를 시간 축으로 옮긴 것뿐이다.

| 구분 | 범위 |
|---|---|
| **영구 무료** | A-10의 v1 전체 — 오늘·캘린더·프로젝트·기록·검색·공원·포인트·커스텀 |
| **유료 (검토)** | 실비가 드는 것만 — LLM 3종, 이미지 저장, 백업·내보내기 |

LLM 기능이 전부 v2이고 "없어도 앱이 완전히 동작"하도록 설계된 것이 **그대로 과금 경계선**이 된다.

- 재방문 동기는 잠금이 아니라 **축적된 데이터**에서 나온다 — 6개월치 완료 기록, 지어진 공원, 프로젝트 회고. 잠글 필요가 없다
- **초기부터 "코어는 영구 무료"를 명시한다.** 아무 말 없다가 나중에 잠그는 것이 최악이다

### 비용 방어 (v2 LLM 도입 시)

1. **콘솔에서 월 지출 상한과 알람**을 먼저 건다. 버그로 인한 무한 루프가 최대 위험
2. **유저당 일일 호출 상한.** 초과 시 로컬 파서로 조용히 폴백 (기능이 막히지 않고 정확도만 하락)
3. **`weekly_review` 테이블에 캐싱.** 같은 주는 1회만 생성

```sql
CREATE TABLE weekly_review (
  user_id    BIGINT   NOT NULL,
  week       CHAR(8)  NOT NULL,        -- 'YYYY-Www'
  metrics    JSON     NOT NULL,        -- LLM에 보낸 집계값
  body       TEXT     NOT NULL,        -- 생성된 문장
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, week)          -- 같은 주 중복 생성 불가
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

4. **미리 생성한다.** 일요일 밤 스케줄러가 배치로 처리 → 대기 시간 0, 호출 분산, 배치 50% 할인
5. **모델 급을 나눈다.** 자연어 파싱은 소형 모델로 충분. 서술만 상위 모델
6. **`max_tokens`를 낮게 고정.** 돌아보기 400 토큰이면 충분

## B-1. 아키텍처

```
[React SPA / PWA]
   │  REST (JSON), 쿠키 세션
[Spring Boot]
   ├── Spring Security (OAuth2 Client)
   ├── Spring Data JPA
   └── 스케줄러 (날씨 수집, 일일 집계)
        │
   [MySQL 8]        [기상청 단기예보 API]
```

- 모놀리식. 개인 프로젝트 규모에서 분리할 이유 없음
- 프론트/백 분리 배포. CORS 및 쿠키 `SameSite` 설정 필요

## B-2. 인증

- **Spring Security OAuth2 Client** 사용. v1은 구글만, v2에 깃허브 추가
- 사용자 식별은 `(provider, provider_uid)` 조합. **이메일을 키로 쓰지 않는다**
  - 같은 이메일로 구글·깃허브 양쪽 가입 가능
  - 깃허브는 이메일 비공개 계정이 많아 `NULL`이 올 수 있음
- 세션 방식(쿠키) 권장. JWT는 로그아웃·갱신 처리가 번거로워 초기엔 손해
- 모든 조회 쿼리에 `user_id` 조건 필수 (B-9 참조)

## B-3. 데이터 모델

### 테이블 목록

| 테이블 | 역할 |
|---|---|
| `user` | 계정, 설정, 포인트 잔액 |
| `project` | 여러 날 걸리는 일 |
| `milestone` | 프로젝트의 구간 |
| `task` | 할 일 (핵심) |
| `project_note` | 사용자가 쓴 기록 |
| `park_slot` | 공원에 지어진 기구 |
| `daily_stat` | 하루치 집계 |
| `point_ledger` | 포인트 입출금 원장 |
| `cosmetic_item` / `user_cosmetic` / `user_equipped` | 커스텀 아이템 |
| `weather_daily` | 지역별 날씨 캐시 (사용자 무관) |

### 핵심 DDL

```sql
CREATE TABLE user (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  provider      VARCHAR(20)  NOT NULL,          -- 'GOOGLE' | 'GITHUB'
  provider_uid  VARCHAR(191) NOT NULL,
  email         VARCHAR(191) NULL,
  nickname      VARCHAR(50)  NOT NULL,
  region_code   VARCHAR(20)  NOT NULL DEFAULT 'SEOUL',
  birth_date    DATE         NULL,
  point_balance INT          NOT NULL DEFAULT 0,
  population    INT          NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_user_provider (provider, provider_uid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE project (
  id            BIGINT       NOT NULL AUTO_INCREMENT,
  user_id       BIGINT       NOT NULL,
  name          VARCHAR(100) NOT NULL,
  type          VARCHAR(20)  NOT NULL DEFAULT 'FREE',  -- FREE|PROGRESS|EXAM
  color         VARCHAR(20)  NOT NULL DEFAULT 'BLUE',
  total_units   INT          NULL,        -- 진도형: 총 회차 / 시험형: 단원 수
  exam_date     DATE         NULL,        -- 시험형만
  work_days     TINYINT      NOT NULL DEFAULT 127,  -- 작업 요일 7비트. 기본 전체
  deadline_week CHAR(8)      NULL,        -- ISO 주차 'YYYY-Www'
  status        VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
  archived_at   DATETIME     NULL,
  deleted_at    DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                             ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_project_user (user_id, status),
  CONSTRAINT fk_project_user FOREIGN KEY (user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE milestone (
  id           BIGINT       NOT NULL AUTO_INCREMENT,
  project_id   BIGINT       NOT NULL,
  seq          INT          NOT NULL,
  title        VARCHAR(100) NOT NULL,
  target_week  CHAR(8)      NULL,
  started_at   DATETIME     NULL,
  completed_at DATETIME     NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_milestone_seq (project_id, seq),
  CONSTRAINT fk_milestone_project FOREIGN KEY (project_id) REFERENCES project(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE task (
  id              BIGINT       NOT NULL AUTO_INCREMENT,
  user_id         BIGINT       NOT NULL,
  title           VARCHAR(255) NOT NULL,
  project_id      BIGINT       NULL,
  milestone_id    BIGINT       NULL,      -- 완료 시점 스냅샷
  horizon         VARCHAR(20)  NOT NULL DEFAULT 'SOMEDAY',
  task_date       DATE         NULL,      -- 어느 날 '목록'에 올라와 있는지
  scheduled_start DATETIME     NULL,      -- 그날 '몇 시'에 하기로 했는지
  scheduled_end   DATETIME     NULL,
  completed_at    DATETIME     NULL,      -- 체크한 물리적 시각. 불변
  effective_at    DATETIME     NULL,      -- 기록 기준 시각. NULL이면 completed_at
  routine_id      BIGINT       NULL,      -- 이 반복에서 생성된 행
  external_uid    VARCHAR(255) NULL,      -- 외부 캘린더에서 실체화된 행
  memo            VARCHAR(500) NULL,      -- 한 줄 메모, 평문
  sort_order      INT          NOT NULL DEFAULT 0,
  deleted_at      DATETIME     NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                               ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_task_routine (routine_id, task_date),   -- 중복 생성 차단
  UNIQUE KEY uk_task_external (user_id, external_uid),  -- 중복 실체화 차단
  KEY idx_task_today   (user_id, task_date, deleted_at),
  KEY idx_task_done    (user_id, completed_at),
  KEY idx_task_project (project_id, completed_at),
  KEY idx_task_horizon (user_id, horizon, task_date),
  CONSTRAINT fk_task_project   FOREIGN KEY (project_id)   REFERENCES project(id),
  CONSTRAINT fk_task_milestone FOREIGN KEY (milestone_id) REFERENCES milestone(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE routine (
  id           BIGINT       NOT NULL AUTO_INCREMENT,
  user_id      BIGINT       NOT NULL,
  title        VARCHAR(255) NOT NULL,
  project_id   BIGINT       NULL,
  freq         VARCHAR(10)  NOT NULL,          -- DAILY | WEEKLY | MONTHLY
  weekdays     TINYINT      NULL,              -- WEEKLY: 7비트 마스크 (월=1,화=2,수=4…)
  month_day    TINYINT      NULL,              -- MONTHLY: 1~31
  default_time TIME         NULL,              -- 기본 예정 시각
  time_basis   VARCHAR(20)  NOT NULL DEFAULT 'CHECKED',   -- CHECKED | SCHEDULED
  started_on   DATE         NOT NULL,
  ended_on     DATE         NULL,
  paused       BOOLEAN      NOT NULL DEFAULT 0,
  deleted_at   DATETIME     NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_routine_user (user_id, paused, deleted_at),
  CONSTRAINT fk_routine_user FOREIGN KEY (user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE project_note (
  id           BIGINT       NOT NULL AUTO_INCREMENT,
  user_id      BIGINT       NOT NULL,
  project_id   BIGINT       NOT NULL,
  milestone_id BIGINT       NULL,        -- 작성 시점 스냅샷
  kind         VARCHAR(20)  NOT NULL,    -- NOTE|LINK|IMAGE|RETRO
  body         TEXT         NULL,        -- 마크다운 원문 (렌더 결과 아님)
  url          VARCHAR(500) NULL,
  file_key     VARCHAR(255) NULL,
  deleted_at   DATETIME     NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_note_project (project_id, created_at),
  CONSTRAINT fk_note_project FOREIGN KEY (project_id) REFERENCES project(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE park_slot (
  id           BIGINT      NOT NULL AUTO_INCREMENT,
  user_id      BIGINT      NOT NULL,
  slot_index   INT         NOT NULL,
  ride_code    VARCHAR(50) NOT NULL,
  is_indoor    BOOLEAN     NOT NULL DEFAULT 0,   -- 비 오는 날 보너스 계산용
  milestone_id BIGINT      NULL,
  built_at     DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_slot (user_id, slot_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE daily_stat (
  user_id         BIGINT       NOT NULL,
  stat_date       DATE         NOT NULL,
  completed_count INT          NOT NULL DEFAULT 0,
  weather_code    VARCHAR(20)  NULL,
  multiplier      DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  visitors        INT          NOT NULL DEFAULT 0,
  points_earned   INT          NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, stat_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE point_ledger (
  id          BIGINT      NOT NULL AUTO_INCREMENT,
  user_id     BIGINT      NOT NULL,
  occurred_on DATE        NOT NULL,
  amount      INT         NOT NULL,          -- 적립 +, 사용 -
  reason      VARCHAR(30) NOT NULL,
  ref_type    VARCHAR(20) NOT NULL,
  ref_id      BIGINT      NOT NULL,
  created_at  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_ledger_ref (user_id, ref_type, ref_id),   -- 이중 지급 차단
  KEY idx_ledger_daily (user_id, occurred_on)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE calendar_source (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  user_id     BIGINT       NOT NULL,
  kind        VARCHAR(20)  NOT NULL,           -- GOOGLE | ICS
  label       VARCHAR(100) NOT NULL,           -- 태그에 표시될 이름
  ics_url     VARCHAR(500) NULL,
  sync_token  VARCHAR(255) NULL,               -- 구글 증분 동기화
  show_title  BOOLEAN      NOT NULL DEFAULT 1, -- 끄면 '바쁨'으로만
  enabled     BOOLEAN      NOT NULL DEFAULT 1,
  last_sync   DATETIME     NULL,
  PRIMARY KEY (id),
  KEY idx_source_user (user_id, enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE external_event (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  source_id  BIGINT       NOT NULL,
  user_id    BIGINT       NOT NULL,
  uid        VARCHAR(255) NOT NULL,            -- 원본 고유 ID
  title      VARCHAR(255) NULL,
  starts_at  DATETIME     NOT NULL,
  ends_at    DATETIME     NULL,
  all_day    BOOLEAN      NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uk_event_uid (source_id, uid),
  KEY idx_event_range (user_id, starts_at),
  CONSTRAINT fk_event_source FOREIGN KEY (source_id) REFERENCES calendar_source(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

`external_event`에 **완료 관련 칸을 두지 않는다.** 순수 읽기 캐시이므로 동기화 시 통째로 교체해도 안전하다. 완료는 실체화된 `task` 행에만 존재한다.

```sql
CREATE TABLE reminder (
  id         BIGINT   NOT NULL AUTO_INCREMENT,
  user_id    BIGINT   NOT NULL,
  task_id    BIGINT   NOT NULL,
  offset_min INT      NOT NULL,          -- 0=정시, 10, 30
  fire_at    DATETIME NOT NULL,          -- 미리 계산한 발송 시각
  sent_at    DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_reminder (task_id, offset_min),
  KEY idx_fire (fire_at, sent_at),
  CONSTRAINT fk_reminder_task FOREIGN KEY (task_id) REFERENCES task(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE push_subscription (
  id         BIGINT       NOT NULL AUTO_INCREMENT,
  user_id    BIGINT       NOT NULL,
  endpoint   VARCHAR(500) NOT NULL,
  p256dh     VARCHAR(255) NOT NULL,
  auth       VARCHAR(255) NOT NULL,
  user_agent VARCHAR(255) NULL,          -- 기기 구분용
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_push_endpoint (endpoint),
  KEY idx_push_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**알림 관련 추가 컬럼**

```sql
-- user
notify_morning    TIME    NULL,   -- 켜면 시각, 끄면 NULL
notify_evening    TIME    NULL,
notify_weekly     BOOLEAN NOT NULL DEFAULT 0,

-- routine
notify_offset_min INT NULL,       -- NULL이면 알림 없음. 기본 0(정시)

-- task
notify_offset_min INT NULL,       -- 개별 설정. 기본 10
```

`NULL이면 알림 없음`으로 통일했다. 별도 on/off 칸이 필요 없고 **기본값이 자동으로 꺼짐**이 된다.

`push_subscription`은 사용자당 여러 행이다. 기기마다 구독이 따로 생긴다.

**`reminder`를 별도 테이블로 둔 이유**

발송 예정 시각을 미리 계산해 행으로 만들어두면 스케줄러 쿼리가 한 줄로 끝난다.

```sql
SELECT * FROM reminder
WHERE fire_at <= NOW() AND sent_at IS NULL
ORDER BY fire_at LIMIT 200;
```

- `UNIQUE (task_id, offset_min)` — 같은 알림이 두 번 걸리지 않는다
- `sent_at` — 이미 보낸 것을 다시 보내지 않는다

**운영 규칙 3가지**

1. **시간이 바뀌면 `fire_at`을 다시 계산한다.** 드래그로 시간표를 옮기면 알림도 따라가야 한다
2. **완료하면 남은 알림을 삭제한다.** 이미 한 일에 알림이 오면 안 된다
3. **이미 지난 시각이면 만들지 않는다.** 밤 11시에 오전 10시 일정을 추가했다고 즉시 울리면 안 된다

`routine`에는 기본값만 두고, 실제 `reminder` 행은 그날 태스크가 생성될 때 함께 만든다.

```sql
CREATE TABLE friendship (
  id           BIGINT      NOT NULL AUTO_INCREMENT,
  requester_id BIGINT      NOT NULL,
  addressee_id BIGINT      NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'PENDING',   -- PENDING | ACCEPTED
  created_at   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  accepted_at  DATETIME    NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_friend (requester_id, addressee_id),
  KEY idx_friend_addressee (addressee_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE park_visit (
  visitor_id BIGINT NOT NULL,
  host_id    BIGINT NOT NULL,
  visited_on DATE   NOT NULL,
  PRIMARY KEY (visitor_id, host_id, visited_on)          -- 하루 1회
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**친구 관련 추가 컬럼**

```sql
-- user
friend_code          CHAR(8)  NOT NULL UNIQUE,   -- ' 7K2MP4A9'. v1.0부터 발급
share_park           BOOLEAN  NOT NULL DEFAULT 1,
share_activity_count BOOLEAN  NOT NULL DEFAULT 0,
share_task_titles    BOOLEAN  NOT NULL DEFAULT 0,

-- project
is_shared            BOOLEAN  NOT NULL DEFAULT 0,
```

맞팔은 `status = 'ACCEPTED'`인 행 하나로 표현한다. 조회 시 `requester_id` 또는 `addressee_id`가 나인 행을 모두 가져온다.

```sql
CREATE TABLE challenge (
  id          BIGINT       NOT NULL AUTO_INCREMENT,
  owner_id    BIGINT       NOT NULL,
  title       VARCHAR(100) NOT NULL,
  type        VARCHAR(20)  NOT NULL,       -- PROGRESS | EXAM | FREE
  total_units INT          NULL,
  target_date DATE         NULL,
  invite_code CHAR(8)      NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closed_at   DATETIME     NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_challenge_invite (invite_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE challenge_member (
  challenge_id BIGINT   NOT NULL,
  user_id      BIGINT   NOT NULL,
  project_id   BIGINT   NULL,              -- 참여 시 각자에게 복제된 프로젝트
  joined_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paused       BOOLEAN  NOT NULL DEFAULT 0,  -- 잠시 쉬기
  left_at      DATETIME NULL,
  PRIMARY KEY (challenge_id, user_id),
  CONSTRAINT fk_cm_challenge FOREIGN KEY (challenge_id) REFERENCES challenge(id),
  CONSTRAINT fk_cm_project   FOREIGN KEY (project_id)   REFERENCES project(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

**`challenge_member.project_id`가 핵심이다.** 방에 참여하면 각자의 계정에 프로젝트가 복제 생성되고, 이후 모든 동작(진도·태스크·기록·공원 보상)은 평소와 동일하게 굴러간다. 방은 각 멤버의 프로젝트 진도를 모아 보여줄 뿐이다.

`project` 테이블을 재활용해 멤버를 붙이지 않는다. 그러면 소유권이 꼬이고, 나갈 때 데이터 처리가 복잡해진다.

```sql
CREATE TABLE weather_daily (
  region_code   VARCHAR(20)  NOT NULL,
  forecast_date DATE         NOT NULL,
  sky           TINYINT      NULL,
  pty           TINYINT      NULL,
  weather_code  VARCHAR(20)  NOT NULL,
  multiplier    DECIMAL(4,2) NOT NULL DEFAULT 1.00,   -- 1.00 미만 금지
  fetched_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (region_code, forecast_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

커스텀 아이템 3종 테이블은 v1 후반에 추가. `user_equipped`의 PK는 `(user_id, category)`로 두어 **카테고리당 하나만 착용 가능**하다는 규칙을 제약으로 표현한다.

### 설계 결정 근거 (요약)

| 결정 | 이유 |
|---|---|
| `completed_at DATETIME` (불리언 아님) | 예정/실제 토글, 기록 날짜, 방문객 계산이 전부 여기서 나온다 |
| `task_date` / `scheduled_start` 분리 | "오늘 목록엔 있지만 시간은 안 정함" 상태가 필요 |
| 거의 모든 칸 `NULL` 허용 | 원칙 1의 구현체. `NOT NULL`을 붙이면 UI에서 결국 강제하게 된다 |
| `horizon DEFAULT 'SOMEDAY'` | 아무것도 안 골라도 값이 채워진다 |
| `deadline_week CHAR(8)` | 주차만 저장하면 **날짜를 표현할 수 없다.** 원칙 5의 데이터 레벨 방어 |
| `milestone_id` 스냅샷 | 구간을 나중에 수정해도 과거 기록이 이동하지 않는다 |
| `weather_daily`에 `user_id` 없음 | 지역 단위 공용 캐시. 사용자 1만 명이어도 호출은 수십 회 |
| `point_ledger` UNIQUE | 체크/취소 반복 어뷰징을 **DB 레벨에서** 차단 |
| `memo VARCHAR(500)` | 길이 제한 자체가 제품 결정. 길면 노션이 된다 |
| `UNIQUE (routine_id, task_date)` | 스케줄러가 두 번 돌거나 서버가 재시작해도 같은 날 행이 하나만 생긴다 |
| `effective_at` 별도 칸 | 체크 시각과 실제 수행 시각이 다르다. `completed_at`은 사실이라 덮어쓰면 안 된다 |
| `weekdays TINYINT` 비트마스크 | 월수금 = 1+4+16 = 21. 읽기 편함이 더 중요하면 `VARCHAR(20)`에 `'MO,WE,FR'`도 무방 |

## B-4. 도메인 규칙

### 완료 처리 (트랜잭션)

```
@Transactional
1. task.completed_at = now
2. task.milestone_id = 현재 진행 중 마일스톤 (스냅샷)
3. point_ledger INSERT (ref_type='TASK', ref_id=task.id)
   → UNIQUE 위반 시 조용히 무시 (멱등)
4. daily_stat UPSERT (completed_count +1, visitors/points 재계산)
5. user.point_balance 갱신
```

### 마일스톤 완료 (트랜잭션)

```
1. milestone.completed_at = now
2. park_slot INSERT (기구 1개)
3. point_ledger INSERT (ref_type='MILESTONE')
4. user.population 갱신
```

이 셋이 부분적으로만 반영되면 "기구는 지어졌는데 포인트는 없는" 상태가 영구히 남는다.

### 반복 항목 생성

새벽 4시(하루 경계) 스케줄러가 **오늘 날짜 행만** 생성한다.

```
for each routine where paused = 0 and deleted_at is null
    and started_on <= today and (ended_on is null or ended_on >= today):
  if 규칙이 오늘과 일치:
    INSERT task (routine_id, task_date=today, scheduled_start=default_time, ...)
    → UNIQUE 위반 시 무시 (멱등)
```

- 미래 날짜 행을 만들지 않는다. 주간 캘린더의 앞날은 규칙으로 계산해 표시만 (체크 불가)
- 과거를 소급 생성하지 않는다
- 스케줄러가 실패한 날은 사용자가 앱을 연 시점에 보정 생성 (오늘 것만)

### 완료 시각 결정

```
completed_at = now                       # 항상, 불변
effective_at =
    routine.time_basis == 'SCHEDULED' and scheduled_start != null
        ? scheduled_start
        : now
```

사용자가 완료 직후 칩으로 변경하면 `effective_at`만 갱신한다. 모든 조회·집계는 `COALESCE(effective_at, completed_at)` 기준.

### 하루의 경계 — 새벽 4시

새벽 2시에 체크한 것은 사용자 감각으로 **어제의 연장**이다.

```sql
DATE(DATE_SUB(completed_at, INTERVAL 4 HOUR))
```

`daily_stat.stat_date`를 따로 저장하는 이유 중 하나다.

### 미완료 이월 — 없음

`task_date`를 자동으로 옮기는 배치는 **돌리지 않는다.** 어제 못 한 항목은 어제 날짜로 남는다.

- 오늘 화면 조회 시 `task_date = 오늘`만 가져오므로 자연히 안 보인다
- 배지용 카운트: `WHERE task_date < 오늘 AND completed_at IS NULL AND deleted_at IS NULL`
- 미루기는 `PATCH /api/tasks/{id}` 로 `task_date`(및 필요 시 `horizon`) 변경. 사용자 행동으로만 일어난다

### 포인트 소프트 캡

```sql
SELECT COALESCE(SUM(amount), 0) FROM point_ledger
WHERE user_id = ? AND occurred_on = ? AND amount > 0;
```

상한 초과 시 추가 적립을 0으로 처리. **사용자에게 경고하지 않는다.** 체크 자체는 정상 동작.

## B-5. API 명세 (초안)

| 메서드 | 경로 | 설명 |
|---|---|---|
| `GET` | `/api/today?date=` | 오늘 화면 일괄 조회 (할 일 + 완료 + 공원 상태) |
| `POST` | `/api/tasks` | 생성. body는 `title`만 필수 |
| `PATCH` | `/api/tasks/{id}` | 제목·프로젝트·horizon 수정 |
| `PATCH` | `/api/tasks/{id}/schedule` | 시간 배정/해제 (드래그) |
| `PATCH` | `/api/tasks/{id}/complete` | 완료. 멱등 |
| `PATCH` | `/api/tasks/{id}/uncomplete` | 완료 취소 |
| `PATCH` | `/api/tasks/{id}/memo` | 한 줄 메모 |
| `PATCH` | `/api/tasks/{id}/effective-time` | 완료 시각 기준 변경 |
| `PATCH` | `/api/tasks/reorder` | 정렬 일괄 갱신 |
| `GET` | `/api/routines` | 반복 목록 |
| `POST` | `/api/routines` | 반복 생성. 당일 해당하면 즉시 task 1건 생성 |
| `PATCH` | `/api/routines/{id}` | 규칙·시간·기준 수정 (과거 행 불변) |
| `PATCH` | `/api/routines/{id}/pause` | 일시 중지 / 재개 |
| `DELETE` | `/api/tasks/{id}` | 소프트 삭제 |
| `GET` | `/api/projects` | 목록 + 겹침 경고 데이터 |
| `POST` | `/api/projects` | 생성. 타입별로 마일스톤 자동 생성 |
| `POST` | `/api/projects/draft` | *(v2)* 자연어 → 마일스톤 초안. 저장하지 않고 반환만 |
| `POST` | `/api/parse/task` | 자연어 → 태스크 필드 추출. 로컬 파서 실패 시 LLM |
| `GET` | `/api/projects/{id}` | 진행 상세 |
| `GET` | `/api/projects/{id}/timeline` | 기록 탭 (task + note 병합, 커서 페이징) |
| `POST` | `/api/projects/{id}/notes` | 기록 작성 |
| `PATCH` | `/api/milestones/{id}/complete` | 구간 완료 + 회고 |
| `GET` | `/api/search?q=&type=&projectId=` | 전역 검색 |
| `GET` | `/api/park` | 공원 상태 |
| `GET` | `/api/friends` | *(v2)* 친구 목록 + 공원 요약 |
| `POST` | `/api/friends` | *(v2)* 친구 코드로 요청 |
| `PATCH` | `/api/friends/{id}/accept` | *(v2)* 수락 |
| `GET` | `/api/friends/{id}/park` | *(v2)* 친구 공원 구경 (공개 범위 적용) |
| `POST` | `/api/friends/{id}/visit` | *(v2)* 방문. 하루 1회, 일 3명까지 |
| `POST` | `/api/challenges` | *(v2)* 같이 하기 방 생성 |
| `POST` | `/api/challenges/join` | *(v2)* 초대 코드로 참여. 프로젝트 복제 생성 |
| `GET` | `/api/challenges/{id}` | *(v2)* 멤버별 진도 + 최근 7일 |
| `PATCH` | `/api/challenges/{id}/pause` | *(v2)* 잠시 쉬기 / 재개 |
| `DELETE` | `/api/challenges/{id}/leave` | *(v2)* 조용히 나가기. 내 프로젝트는 유지 |
| `PATCH` | `/api/tasks/{id}/reminder` | *(v1.1)* 알림 시점 변경 (0/10/30/해제) |
| `POST` | `/api/push/subscribe` | *(v1.1)* 기기 구독 등록 |
| `DELETE` | `/api/push/subscribe` | *(v1.1)* 구독 해제 |
| `GET` | `/api/calendar-sources` | *(v2)* 연동 목록 |
| `POST` | `/api/calendar-sources` | *(v2)* ICS URL 또는 구글 연동 추가 |
| `POST` | `/api/calendar-sources/{id}/sync` | *(v2)* 수동 동기화 |
| `POST` | `/api/external-events/{id}/complete` | *(v2)* 체크 → `task` 실체화 + 완료 |
| `GET` | `/api/feed/{token}.ics` | *(v2)* 내보내기용 읽기 전용 피드 |
| `GET` | `/api/weather/today` | 오늘 날씨 + 배율 |
| `GET` | `/api/review/weekly?week=` | *(v2)* 주간 돌아보기. 표본 미달 시 204 |
| `POST` | `/api/review/apply` | *(v2)* 제안 적용 (기본 시각·블록 길이 등) |

**설계 메모**
- `/api/today`를 하나로 묶는다. 앱 진입 시 왕복을 3~4회에서 1회로 줄인다
- 완료/취소는 반드시 **멱등**. PWA 오프라인 동기화 시 같은 요청이 여러 번 온다
- 기록 타임라인은 두 테이블을 애플리케이션에서 시간순 병합 (SQL `UNION`보다 구조가 달라 편하다)

## B-6. 외부 연동 — 기상청 단기예보

- 엔드포인트: `apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst`
- 공공데이터포털 무료. 개발계정 기준 일 10,000회

**주의점**
- 전국을 5km 격자로 나눈 자체 좌표계 사용 → 위경도를 `nx`, `ny`로 변환 필요
- 발표 8회 (02·05·08·11·14·17·20·23시) → `base_time` 규칙 준수
- 활용신청 후 키 반영까지 약 1시간

**수집 전략**
- 스케줄러가 하루 1회, **시·도 단위로만** 수집 → `weather_daily`
- 사용자별 호출 금지. 게임 연출이므로 읍면동 정밀도 불필요
- 응답에서 **`SKY`와 `PTY` 두 값만** 사용. 나머지 무시
- 실패 시 행을 만들지 않고, 조회 시 없으면 `CLEAR` + `1.00`으로 폴백
- **날씨 오류를 사용자에게 노출하지 않는다.** 앱이 안 켜지는 것처럼 보인다

## B-6-2. LLM 연동 *(v2)*

### 공통

- **반드시 백엔드 프록시.** 프론트에 API 키를 두지 않는다
- 타임아웃 3초. 초과 시 폴백 (A-6-11의 실패 표)
- 응답은 **JSON 스키마를 강제**하고, 파싱 실패 시 1회 재시도 후 폴백
- 사용자별 호출 횟수 상한 (일 단위)

### 주간 돌아보기 — 지표 계산

**LLM에는 아래 계산 결과만 보낸다. 제목·메모 원문은 전송하지 않는다.**

```sql
-- 1) 계획 습관: 할 일을 언제 적는가
SELECT AVG(TIMESTAMPDIFF(HOUR, created_at, task_date)) AS lead_hours,
       SUM(HOUR(created_at) >= 20) / COUNT(*)          AS night_ratio
FROM task
WHERE user_id = ? AND task_date BETWEEN ? AND ? AND deleted_at IS NULL;

-- 2) 계획 정확도: 예정 대비 실제
SELECT AVG(TIMESTAMPDIFF(MINUTE, scheduled_start,
                         COALESCE(effective_at, completed_at))) AS drift_min
FROM task
WHERE user_id = ? AND scheduled_start IS NOT NULL
  AND completed_at IS NOT NULL AND task_date BETWEEN ? AND ?;

-- 3) 집중 분포: 한 곳에 몰리는가
SELECT project_id, COUNT(*) AS cnt
FROM task
WHERE user_id = ? AND completed_at IS NOT NULL AND task_date BETWEEN ? AND ?
GROUP BY project_id;

-- 4) 시간대·요일 분포
SELECT DAYOFWEEK(effective_at) AS dow, HOUR(effective_at) AS hh, COUNT(*)
FROM task
WHERE user_id = ? AND completed_at IS NOT NULL AND task_date BETWEEN ? AND ?
GROUP BY dow, hh;
```

**전송 페이로드 예시**

```json
{
  "period": "2026-W37",
  "completed_count": 19,
  "night_planning_ratio": 0.78,
  "avg_drift_minutes": 100,
  "top_project_share": 0.71,
  "active_project_count": 3,
  "weekday_distribution": [7, 4, 3, 2, 1, 1, 1],
  "weeks_observed": 5
}
```

**게이트:** `weeks_observed >= 3 && completed_count >= 30` 이 아니면 호출 자체를 하지 않는다.

### 프로젝트 초안 — 반환 스키마

```json
{
  "name": "string",
  "type": "FREE|PROGRESS|EXAM",
  "deadline_week": "YYYY-Www | null",
  "work_days": [1,2,3,4,5],
  "milestones": [{ "seq": 1, "title": "string", "target_week": "YYYY-Www" }]
}
```

저장하지 않고 반환만 한다. 사용자가 확인·수정 후 별도 요청으로 생성한다.

## B-7. 프론트엔드

### 반응형 전략 (웹 ↔ PWA)

**PWA는 별개의 앱이 아니다.** 같은 URL, 같은 코드가 홈 화면에 설치된 것이므로 코드베이스는 하나다. 따라서 문제는 "웹과 앱을 맞추는 것"이 아니라 **"넓은 화면과 좁은 화면을 다르게 배치하는 것"**이다.

> **같은 레이아웃을 늘리고 줄이는 방식은 실패한다.**
> 같은 데이터를 다른 배치로 재구성하되, 화면 문법은 유지한다.

**원칙 3가지**

1. **나란히 있던 것을 위아래로 쌓지 말고 전환으로 바꾼다.**
   목록과 시간표를 세로로 이으면 시간표를 보려고 매번 스크롤해야 한다 → 세그먼트 토글.
   위아래로 쌓아도 되는 것은 *위쪽만 봐도 되는* 경우뿐이다
2. **탐색은 위치만 옮긴다.** 넓은 화면 좌측 사이드바 = 좁은 화면 하단 탭. 항목과 순서는 동일
3. **부가 정보는 밀도를 낮춘다.** 날씨·방문객이 사이드바에 상주 → 헤더 한 줄로 압축. 없애지 않는다

**화면별 대응**

| 화면 | ≥1024px | <640px |
|---|---|---|
| 오늘 | 목록 + 시간표 2단 | 세그먼트 전환 |
| 캘린더 | 7일 시간표 | **3일 뷰** + 좌우 스와이프 |
| 프로젝트 목록 | 레인 + 포커스 카드 + 목록 | 포커스 카드 우선, 레인은 접기 |
| 진도 그리드 | 10열 | 5열 |
| 프로젝트 트랙 | 가로 SVG | 진행바로 축약 |
| 기록 타임라인 | 그대로 | 그대로 |

- **캘린더가 가장 어렵다.** 7열을 360px에 넣으면 한 칸이 45px로 제목이 들어가지 않는다.
  구글 캘린더도 모바일 기본이 3일 뷰다
- **기록 타임라인은 대응 비용이 0이다.** 원래 한 방향으로 흐르는 구조이기 때문이다.
  → 처음부터 세로로 흐르게 설계하면 반응형이 공짜다
- 브레이크포인트는 **640 / 1024 두 개.** 세 개를 넘기면 관리가 안 된다
- **좁은 화면부터 만든다.** 넓은 화면에서 줄이면 매번 무엇을 버릴지 고민해야 한다
- **드래그만이 레이아웃으로 안 풀린다.** 넓은 화면은 마우스 드래그, 좁은 화면은 길게 눌러 시간 선택.
  상호작용 자체가 달라서 대체 경로를 따로 만들어야 한다

### 마크다운

- 저장은 **원문**. 렌더 결과를 DB에 넣지 않는다 (스타일 변경 시 과거 기록이 따라오지 않음)
- `react-markdown` + `remark-gfm`
- **`rehype-sanitize` 필수.** 마크다운 파서는 `<script>` 등 HTML을 통과시킨다
- 코드 하이라이팅은 `shiki` 또는 `highlight.js`
- **블록 에디터를 만들지 않는다.** textarea + 미리보기. 툴바는 커서 위치에 문법 삽입만

### 드래그 앤 드롭

- 마우스에서 되던 드래그가 모바일에서 스크롤과 충돌하는 경우가 많다
- **터치 환경에서 먼저 검증.** 안 되면 "길게 눌러 시간 선택" 방식으로 대체

### PWA / 오프라인

- 지하철에서 체크가 안 되면 신뢰가 즉시 깨진다
- 완료는 IndexedDB에 먼저 기록 → 온라인 복귀 시 동기화
- 이때 서버가 같은 요청을 여러 번 받으므로 **B-4의 멱등성 + `point_ledger` UNIQUE**가 방패가 된다

## B-8. 검색 구현

**1단계 — `LIKE`**

```sql
SELECT 'TASK' AS src, id, title AS text, completed_at AS at, project_id
FROM task
WHERE user_id = ? AND deleted_at IS NULL
  AND (title LIKE CONCAT('%', ?, '%') OR memo LIKE CONCAT('%', ?, '%'))
```

`LIKE '%키워드%'`는 앞에 `%`가 붙어 **인덱스를 쓰지 못한다.** 개인용 규모(수천~수만 행)에서는 체감되지 않는다.

**2단계 — ngram FULLTEXT**

```sql
ALTER TABLE project_note
  ADD FULLTEXT INDEX ft_note_body (body) WITH PARSER ngram;

SELECT * FROM project_note
WHERE MATCH(body) AGAINST('그리드' IN BOOLEAN MODE);
```

일반 `FULLTEXT`는 공백 기준으로 잘라 "그리드는", "그리드를"이 안 걸린다. `ngram`은 글자 단위 색인이라 한국어에 실용적. 기본 토큰 2글자라 한 글자 검색은 불가.

## B-9. 비기능 요구사항

| 항목 | 규칙 |
|---|---|
| **보안** | 모든 조회에 `WHERE user_id = ?`. 한 군데만 빠져도 타인 데이터 노출 |
| **XSS** | 마크다운 sanitize 필수 (B-7) |
| **타임존** | 한국 전용 → DB·JVM·컨테이너 전부 `Asia/Seoul` 통일. `hibernate.jdbc.time_zone: Asia/Seoul` |
| **문자셋** | 전 구간 `utf8mb4`. `utf8`은 이모지 저장 불가 |
| **삭제** | 물리 삭제 금지. `deleted_at` + 모든 조회에 `IS NULL` |
| **N+1** | `@ManyToOne`은 `LAZY`. 목록 조회는 `LEFT JOIN FETCH`. 개발 중 `show-sql`로 쿼리 수 확인 |
| **JOIN** | NULL 허용 FK에는 반드시 `LEFT JOIN` (안 그러면 프로젝트 없는 태스크가 사라진다) |
| **Enum** | `@Enumerated(EnumType.STRING)` 필수. `ORDINAL`은 순서 변경 시 기존 데이터 의미가 뒤바뀐다 |
| **마이그레이션** | Flyway. 운영은 `ddl-auto: validate` |
| **파일 저장** | 이미지는 DB에 넣지 않는다. S3 또는 디스크 + 경로만 DB. **v1에서는 이미지 제외** |

## B-10. 버전 순서

기준 3가지로 정했다. **매 단계가 그 자체로 쓸 수 있을 것**, **차별점을 공개 전에 완성할 것**, **구현이 무거운 것은 뒤로**.

| 버전 | 범위 | 이 단계의 의미 |
|---|---|---|
| **0.1** | `user` + `task` · 오늘 화면 · 체크 · 한 줄 메모 | 매일 쓸 수 있음. **여기부터 본인이 사용 시작** |
| **0.2** | 시간표 · 드래그 · 예정/실제 토글 | 투두 앱에 없는 것 |
| **0.3** | `routine` · 반복 일정 | 체감 효용 최대 구간 |
| **0.4** | `project` · `milestone` · 자동 로그 | 캘린더가 못 하던 것 |
| **0.5** | `project_note` 마크다운 기록 · 검색 | 노션과 갈리는 지점 |
| **1.0** | 공원 · 체리 · 날씨 · 커스텀 · PWA · **`friend_code` 발급** | **여기서 공개** |
| **1.1** | 알림 (웹 푸시) | 공개 후 첫 요청이 여기서 나온다 |
| **1.2** | 주간 캘린더 탭 | |
| **2.0** | **친구(A-6-14)** · **같이 하기(A-6-15)** · 외부 캘린더 · AI 3종 · 깃허브 · 이미지 · 통계 | |

**알림을 1.1로 미룬 이유**

없어도 앱이 완전히 동작하고, 웹 푸시는 iOS 설치 안내까지 딸려와 **손 대비 효용이 낮은 구간**이다. 무엇보다 실제 사용 데이터를 보고 기본값을 정하는 편이 낫다. 지금 "10분 전이 기본"이라고 정하는 것은 추측이다.

**공원을 1.0에 넣은 이유**

없으면 그냥 투두 앱이라 공개할 이유가 없다. 차별점은 공개 전에 완성되어야 한다.

**0.1~0.5는 혼자 쓰는 기간.** 최소 3~4주 두고, 그동안 부록의 자기 관찰을 병행한다. A-11에서 확정한 것들이 실제로 맞았는지 여기서 검증된다.

---

## 부록. 자기 관찰 2주 기록 (병행 권장)

UI 취향은 앉아서 결정할 수 없다. 개발과 동시에 진행할 것.

- 매일 아침 오늘 할 일 적기
- 저녁에 두 가지만: **못 한 게 있으면 왜 못 했는지**, **뭘 할 때 기분이 좋았는지**
- 주말에 몰아 보기

2주 뒤 확인할 것: 아침에 계획하는 사람인가 그때그때 하는 사람인가 / 마감이 동력인가 압박인가 / 프로젝트를 여러 개 굴리는가 하나씩 끝내는가.

이 결과가 A-11의 미정 항목을 그대로 결정한다. 스키마는 취향과 무관하게 필요하므로 2주간 병행해도 헛수고가 아니다.
