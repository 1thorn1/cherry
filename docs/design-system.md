# 체리 디자인 시스템

모든 UI 작업은 이 문서를 따른다. 토큰 값의 원본은 `frontend/src/index.css`의 `:root`다.

---

## 무드

- **구조**: 깔끔한 업무 앱 — 할 일은 모바일 카드 목록, 캘린더는 주간 격자
- **색감**: 햇볕 든 흙길 · 나무 헛간 · 옥수수밭. 크림 바탕에 나무 갈색
- **핵심 경험**: 할 일을 끝내면 **체리(포인트)** 를 받고, 그 체리로 농장을 키운다. 보상은 항상 눈에 보여야 한다

레이아웃은 정돈된 카드·격자·세그먼트 탭 그대로 두고, 색만 흙과 나무로 바꾼다. 일러스트는 농장 화면에만 쓴다.

---

## 색

```css
:root {
  /* 면 */
  --bg:             #f6f1e7;  /* 페이지 바탕. 순백 금지 */
  --surface:        #fffcf6;  /* 카드·시트·탭 바 */
  --surface-sunken: #efe7d8;  /* 세그먼트 트랙, 입력, 추가 바, 비활성 */
  --line:           #e6dccb;  /* 카드 테두리, 격자선 */
  --line-strong:    #917e66;  /* 체크 원, 입력 테두리 (3:1) */

  /* 텍스트 */
  --ink:            #33271b;  /* 본문·제목. 검정 금지 */
  --ink-muted:      #6e5c47;  /* 시간, 날짜, 보조 (4.5:1) */
  --ink-faint:      #8f7d66;  /* 플레이스홀더, 완료 취소선 전용 */

  /* 브랜드 */
  --wood:           #8b5a33;  /* 주요 버튼, 활성 탭 */
  --wood-deep:      #5e3b22;  /* hover/pressed, 활성 메뉴 글자 */
  --wood-soft:      #f1e3d3;  /* 활성 메뉴 배경, 선택 날짜 */
  --on-wood:        #fffaf2;

  /* 의미 */
  --sprout:         #4f7d2c;  /* 완료, 진행률 */
  --sprout-soft:    #e3ecd3;
  --coin:           #e0a93a;  /* 체리(포인트) 아이콘 채움 */
  --coin-soft:      #f7e7c2;  /* 보상 칩 배경 */
  --coin-ink:       #7a5412;  /* 보상 숫자 */
  --barn:           #a84632;  /* 중요 깃발, 마감, 오류, 현재 시각선 */
  --barn-soft:      #f4ddd5;
  --sky:            #3f6f7a;  /* 회의, 정보 */
  --sky-soft:       #dde8ea;

  /* 농장 그림 전용 — UI 텍스트 바탕으로 쓰지 않는다 */
  --soil: #d2b384;  --soil-deep: #b08d5c;  --hay: #e9d6a6;  --leaf: #6b9a3a;
  --farm-barn: #a84632;  --farm-roof: #8b5a33;  --farm-roof-deep: #5e3b22;
}
```

**규칙**

- 바탕은 `--bg`, 카드는 `--surface`. `#FFF`를 면으로 쓰지 않는다
- 주요 버튼·활성 탭은 `--wood` + `--on-wood`. 사이드바 활성 메뉴는 `--wood-soft` 바탕 + `--wood-deep` 글자
- 체리 보상은 `--coin` 아이콘 + `--coin-soft` 바탕 + `--coin-ink` 숫자. 노란색(`--coin`) 위에 흰 글자 금지
- `--barn`을 오류로 쓸 때는 반드시 아이콘이나 문구를 같이 둔다 (색만으로 구분 금지)
- 모든 텍스트 조합은 4.5:1 이상. `--ink-faint`(3:1)는 장식·비활성에만

### 다크 테마

값의 원본은 `docs/design_system.pdf` 3쪽(각 칸 오른쪽). `index.css`의 `:root[data-theme="dark"]`에서 **이름은 그대로, 값만** 바꾼다. 그래서 컴포넌트는 토큰만 쓰면 다크를 따로 신경 쓸 필요가 없다.

- `<html data-theme="light|dark">`는 `lib/colorScheme.ts`가 정한다. 설정 > 화면 테마(시스템/라이트/다크), 기본은 시스템(OS 설정 따라감)
- Tailwind `neutral-*`·`white`·`red-*`도 `@theme inline`으로 토큰에 묶여 있어 같이 바뀐다
- 농장 그림은 `farm-*`·`soil`·`hay`·`leaf`를 쓴다. 다크에서도 밝게 뜨지 않도록 따로 낮춘 값이다
- 색을 하드코딩하면(`#fff`, `rgba(...)`) 다크에서 그대로 남는다 → 반드시 토큰

### 일정·프로젝트 분류색

네 가지로 고정한다. 블록은 `*-soft` 바탕 + `--ink` 글자, 분류 점은 진한 색.

| 분류 | 블록 | 점 |
|---|---|---|
| 업무 | `--sprout-soft` | `--sprout` |
| 회의 | `--sky-soft` | `--sky` |
| 개인 | `--coin-soft` | `--coin` |
| 마감 | `--barn-soft` | `--barn` |

범례(태그)를 함께 둬서 색만으로 구분하지 않게 한다.

### 기존 이름 (호환용)

아래 이름은 `index.css`에서 새 토큰의 별칭으로 남겨뒀다. **새 코드에서는 쓰지 않는다.**

| 기존 | → 새 토큰 |
|---|---|
| `--text` / `--text-muted` / `--text-faint` | `--ink` / `--ink-muted` / `--ink-faint` |
| `--border` / `--border-strong` | `--line` / `--line-strong` |
| `--surface-muted` | `--surface-sunken` |
| `--cherry` / `--cherry-bg`·`--cherry-soft` / `--cherry-deep` | `--wood` / `--wood-soft` / `--wood-deep` |
| `--done` / `--done-soft` | `--sprout` / `--sprout-soft` |
| `--warn` / `--warn-soft` | `--barn` / `--barn-soft` |
| `--meadow*` / `--gold*` / `--cream` | `--sprout*` / `--coin*` / `--surface` |
| `--block-rose/sage/sand/sky/lilac` | `--barn-soft` / `--sprout-soft` / `--coin-soft` / `--sky-soft` / `--wood-soft` |

`--cherry`는 상점 THEME 아이템이 덮어쓰는 강조색이라 이름을 유지한다 (`lib/theme.ts`).

### Tailwind 회색

`@theme`에서 `neutral-*`, `white`, `red-*` 값을 흙 톤으로 바꿔뒀다. `text-neutral-400` 같은 기존 클래스는 자동으로 따뜻한 갈색이 된다. 새 코드는 가능하면 `text-[var(--ink-muted)]`처럼 토큰을 직접 쓴다.

---

## 타이포

두 서체 모두 Google Fonts(`index.html`)에서 불러온다. 딱딱하지 않지만 너무 둥글지도 않게.

| 이름 | 서체 | 쓰는 곳 |
|---|---|---|
| `display` (`.font-display`) | **고운돋움** — 손글씨 느낌의 부드러운 돋움 | 페이지 제목, 큰 숫자, 카드 제목 |
| `sans` (body 기본) | **IBM Plex Sans KR** — 획 끝이 살짝 부드러운 산세리프 | 본문, 버튼, 라벨, 탭 바 |

| 스타일 | 서체 | 크기 / 줄간격 | 굵기 | 용도 |
|---|---|---|---|---|
| display-lg | display | 34 / 42 | 400 | 페이지 제목 |
| display-num | display | 28 / 34 | 400 | 체리 잔액, 레벨 |
| title | display | 20 / 28 | 400 | 카드·패널 제목, 월 표시 |
| heading | sans | 16 / 24 | 600 | 섹션 제목 |
| body | sans | 15 / 22 | 400 | 할 일 제목, 본문 |
| body-strong | sans | 15 / 22 | 600 | 버튼, 강조 |
| caption | sans | 13 / 18 | 400 | 시간, 날짜 |
| label | sans | 12 / 16 | 500 | 칩, 배지, 일정 블록 |

- 고운돋움은 **굵기가 400 하나뿐**이다. `font-display`에 `font-bold`를 겹치지 말고 크기로 위계를 준다
- 숫자는 `tabular-nums`로 자릿수를 맞춘다

---

## 간격

**4의 배수만 쓴다.** `4 8 12 16 20 24 32 40`

| 위치 | 값 |
|---|---|
| 페이지 좌우 여백 | 20px (모바일) / 32px (데스크톱) |
| 카드 안쪽 | 16px (모바일) / 20px (데스크톱) |
| 할 일 카드 사이 | 12px |
| 섹션 사이 | 24~32px |

---

## 모서리

| 요소 | 값 | Tailwind |
|---|---|---|
| 카드, 패널 | 16px | `rounded-2xl`, `rounded-xl` |
| 버튼, 입력, 세그먼트 선택 칸 | 12px | `rounded-lg` |
| 칩, 일정 블록 | 8px | `rounded-lg` 보다 작게 `rounded-[8px]` |
| 큰 패널, 모바일 시트 | 24px | `rounded-3xl` |
| 잔액 배지, 진행률 바, 체크 원 | 999px | `rounded-full` |

---

## 그림자

테두리(`--line` 1px)로 구분하고 그림자는 아주 옅게.

```css
--shadow-card: 0 1px 2px rgba(74, 47, 30, 0.06);  /* 카드 기본 */
--shadow-pop:  0 8px 24px rgba(74, 47, 30, 0.12); /* 세그먼트 선택 칸, 드롭다운, 토스트 */
```

---

## 컴포넌트 규칙

### 할 일 카드

```
--surface + 1px --line + 16px 모서리, 안쪽 16×20
왼쪽 원형 체크 26px (--line-strong 테두리)
제목 body, 아래 시계 아이콘 + 시간 caption --ink-muted (· 프로젝트명, 넘치면 말줄임)
오른쪽: 보상 칩(+N) → 중요 깃발
```

- **완료 시**: 체크 원이 `--sprout`로 채워지고 흰 체크, 제목 `--ink-faint` + 취소선, 보상 칩은 `받음 +N`(`--sprout-soft`)
- **중요**: 깃발을 `--barn`으로 채움
- 구분선 대신 카드 간격으로 나눈다

### 보상 칩 · 잔액 배지

```
보상 칩: --coin-soft 바탕, 8px 모서리, 높이 24, 체리 아이콘 13 + "+10" label --coin-ink
잔액 배지: --coin-soft 알약, 높이 32, 아이콘 16 + 숫자(천 단위 쉼표)
```

할 일 · 일정 · 칸반 카드마다 보상 칩을 붙인다. 잔액은 모든 화면에서 한 번 이상 보인다(모바일 상단 배지 / 데스크톱 사이드바 하단).

### 입력창

목록 **하단**에 카드 모양으로 둔다. `--surface-sunken` 바탕, `+` 아이콘 + 플레이스홀더(`--ink-faint`). 포커스되면 `--line-strong` 테두리.

### 세그먼트 탭

```
--surface-sunken 트랙 + 4px 안쪽 여백, 16px 모서리
선택 칸: --surface + --shadow-pop, 글자 --ink 600
나머지: --ink-muted 500
```

### 버튼

| 종류 | 모양 |
|---|---|
| 주요 | `--wood` 바탕 + `--on-wood`, hover `--wood-deep`. 한 화면에 하나 |
| 보조 | `--surface` + `--line` 테두리 |
| 가격 | 소형 주요 버튼 + 체리 아이콘 + 숫자. 모자라면 disabled로 "N 필요" |

포커스 링: `--wood` 2px 실선, 2px 띄움. 기존 `.btn-3d`(아래 턱)는 `--wood-deep` 턱으로 계속 쓸 수 있다.

### 하단 탭 바 (모바일)

`--surface` + 위쪽 1px `--line`. 아이콘 22 + 11px 라벨. 활성은 `--cherry`(기본 `--wood`) 600, 비활성 `--ink-muted`.

### 주간 시간표

```
세로 시간축, 가로 7일. 1시간 = 64px
시간 라벨 11px --ink-muted, 줄바꿈 금지
가로선 1px --line, 주말 열은 --bg
오늘 날짜는 --wood 원 + --on-wood 숫자
현재 시각 --barn 2px 가로선 + 점
일정 블록: 분류 *-soft 바탕 + --ink, 8px 모서리, 보상 +N 표시
지난 일정: opacity .6 + 취소선
```

### 프로젝트 카드

분류색 `*-soft` 아이콘 칸 + title 제목 + 설명 `--ink-muted` + 진행률 바(`--sprout`) + "완료 수 · %" / "체리 N 획득"(`--coin-ink`) + 마감일·멤버. 칸반 열은 `--surface-sunken`, 작업 카드는 `--surface`.

### 농장

- 들판 바탕 `--hay`, 심은 칸 `--soil` + 아래 `--soil-deep` 턱, 잠긴 칸 `--surface-sunken` 점선
- 잎·새싹 `--sprout`/`--leaf`, 이삭 `--coin`, 체리 나무 `--farm-barn`, 헛간 `--farm-barn`·`--farm-roof`
- 요약 카드(규모·수확량·체리)는 `*-soft` 단색 바탕. 그라데이션 금지

### 빈 상태

텍스트 한 줄로 끝내지 않는다. 아이콘 + 짧은 안내.

```
아직 없어요
오늘 할 일을 하나 적어보세요
```

---

## 반응형

브레이크포인트는 **640 / 1024** 두 개만. 접두어 없는 것이 모바일, `lg:`로 확장한다.

| 화면 | 레이아웃 |
|---|---|
| < 640 | 1단, 상단 잔액 배지, 세그먼트 탭 전환, 하단 탭 바 |
| ≥ 1024 | 좌측 사이드바(메뉴 · 내 프로젝트 · 체리 잔액) + 본문. 하단 탭 없음 |

### 틀 (`Layout.tsx`)

모든 화면이 공유한다. 페이지는 본문만 그린다.

```
데스크톱 (lg 이상)                     모바일
┌──────────┬────────────────────┐    ┌───────────────────┐
│ ▣ 체리   │ 페이지 제목 display-lg│   │ ≡   (● 1,240)  설정│ ← 상단 바 (sticky, --bg)
│ 메뉴     │                    │    │ 페이지 제목         │
│ ▸ 오늘   │  본문               │    │ 본문               │
│   캘린더 │                    │    │                   │
│   …      │                    │    ├───────────────────┤
│ 내 프로젝트│                   │    │ 오늘 캘린더 프로젝트 농장│ ← 하단 탭 바
│ ■ 농장자금│                    │    └───────────────────┘
└──────────┴────────────────────┘
```

- 사이드바: 너비 240, `--surface` + 오른쪽 1px `--line`. 활성 메뉴 `--wood-soft` 바탕 + `--wood-deep` 600
- 내 프로젝트: 즐겨찾기 먼저, 최대 8개. 점 색은 분류색 네 가지를 차례로(이름이 옆에 있으니 색만으로 구분하지 않음)
- 농장 자금 카드: 사이드바 하단 `--coin-soft`, 숫자 display-num. 누르면 농장
- 모바일 ≡: 사이드바와 같은 내용을 왼쪽 서랍으로 연다(검색·같이 하기·설정 포함)
- 잔액은 `lib/balance.ts` 하나에 모은다. `getPark()`로 새 값을 받은 화면은 `setBalance()`로 알려서 틀 숫자가 늦지 않게 한다
- 페이지 제목은 `font-display text-[34px] leading-[42px]` (display-lg)

---

## 애니메이션

- `transform`과 `opacity`만 애니메이션한다
- 토큰: `--dur-fast 120ms`, `--dur-base 200ms`, `--dur-slow 320ms`, `--ease-out`, `--ease-pop`
- 체크 완료는 200ms 안에 끝낸다 (체크 원 채움 + 살짝 커졌다 돌아옴)
- 보상: 칩이 `받음`으로 바뀌고, 체리가 잔액 배지로 날아간 뒤 숫자가 올라간다(320ms 안쪽)
- 농장: 심을 때 `animate-pop-in`, 작물은 `animate-sway`로 은은하게
- `prefers-reduced-motion`을 반드시 처리한다 (`index.css`에 전역 처리됨)

---

## 금지

| | 왜 |
|---|---|
| 순백 배경 `#FFF`, 회색 UI | 차갑다. 흙길 톤이 아니다 |
| 검정 텍스트 `#000` | 대비가 과하다 |
| 하드코딩 색상값 (`#E5E5E5` 등) | 토큰(`var(--…)`)을 쓴다 |
| 그라데이션, 진한 그림자 | 단색 + 테두리로 충분하다 |
| 컬러 왼쪽 테두리 카드 | 흔한 AI 스타일. 분류는 점·태그로 |
| 4의 배수 아닌 간격 | 리듬이 깨진다 |
| 이모지 아이콘 | Tabler Icons를 쓴다 (stroke 1.5~1.8) |
| `font-display` + 굵게 | 고운돋움엔 굵은 두께가 없다 |
