# 여행 메모 해석과 수동 모델 선정

**설계 기준일 2026-11-27 · 리허설 소스 1bbbe62.** 여행자는 문장으로 목표를 설명할 수 있다. AI는 목표·K-pop 배경 선호·무계단 요구를 제안하고, 사용자가 적용을 눌러야 폼에 반영된다. 대기 시간, 서울 시각, 운영 여부와 최종 행동은 기존 판정 코드가 관리한다. 여행 메모는 사용자가 읽기를 누를 때만 서버에 보낸다. [메모 입력·확인](https://github.com/esm5678-dot/TRIP-FIXER/blob/1bbbe62bad8afa4650b5d793c8ffbf297f43daa8/components/SetupForm.tsx) · [요청·응답 판독](https://github.com/esm5678-dot/TRIP-FIXER/blob/1bbbe62bad8afa4650b5d793c8ffbf297f43daa8/lib/interpret.ts)

## 소스에서 발견한 결함

**무계단 조건을 체크한 여행자가 메모에 “산책하고 싶다”라고만 쓰면, 제안 적용 시 기존 접근 조건이 사라질 수 있다.** 현재 모델 계약은 무계단 요구를 언급하지 않은 경우에도 false를 반환한다. 실제 컴포넌트의 제안 적용 함수를 추출해 기존 값 true와 제안 값 false를 넣었더니 목표는 walk, 무계단은 false로 바뀌었다. 제안 미리보기에서도 false는 빈 문자열이라 사용자가 어떤 조건을 잃는지 보이지 않는다. 이 재현은 로컬 함수 수준의 검증이다. 기존 브라우저 시험에는 false에서 true로 설정하는 예만 있다. [제안 반영](https://github.com/esm5678-dot/TRIP-FIXER/blob/1bbbe62bad8afa4650b5d793c8ffbf297f43daa8/components/SetupForm.tsx#L75-L84) · [브라우저 시험](https://github.com/esm5678-dot/TRIP-FIXER/blob/1bbbe62bad8afa4650b5d793c8ffbf297f43daa8/tests/browser/recovery.spec.ts#L121-L156)

**P0 인수 조건.** 메모는 무계단 요구를 추가할 수 있다. 이미 체크한 접근 조건은 사용자가 체크박스에서 직접 해제한다. 제안 적용 전후 모두 같은 장소·복귀 시각을 유지한다. 무계단이 체크된 상태에서 산책 제안을 수락한 뒤에도 광교 계단 입구가 제외돼야 한다. 기존 접근 조건을 끄기로 직접 선택한 경우의 결과도 별도로 시험한다. 네 화면 언어에서 같은 의미로 보여 주고, 변경 전후 값은 1회 확인으로 파악할 수 있어야 한다.

## GitHub에서 확인한 근거

| 고정한 구현 | 확인한 동작 | 이번 설계에서 가져올 부분 | 라이선스 |
|---|---|---|---|
| [openai/openai-node · Responses 예제](https://github.com/openai/openai-node/blob/3ee4d75beda64e704845356bd3537c99682ea56a/examples/responses/structured-outputs.ts) | 같은 스키마로 요청 형식과 응답 판독을 연결한다. | 현재 fetch와 Zod를 유지한다. 전송할 세 필드의 이름·enum·필수 여부와 로컬 검증기가 일치하는지 계약 시험을 추가한다. SDK 설치는 도구·스트리밍 등 실제 요구가 생길 때 다시 비교한다. | [Apache-2.0](https://github.com/openai/openai-node/blob/3ee4d75beda64e704845356bd3537c99682ea56a/LICENSE) |
| [openai/openai-cookbook · 구조화 출력 실습](https://github.com/openai/openai-cookbook/blob/dfd760b4de0bd175b51ad05b9b5260c36dfea09c/examples/Structured_Outputs_Intro.ipynb) | 예제는 거절을 정상 스키마 결과와 분리해 표시한다. | Responses 상태와 거절을 먼저 확인하는 기존 순서를 유지한다. 정상 JSON이어도 의미가 모호하면 선택 버튼으로 돌아간다. 관광객에게 모델의 원본 거절 문장을 노출할 필요가 없다. | [MIT](https://github.com/openai/openai-cookbook/blob/dfd760b4de0bd175b51ad05b9b5260c36dfea09c/LICENSE) |
| [openai/evals · 목표값 대조](https://github.com/openai/evals/blob/8eac7a7de5215c907fbddc30efdaf316913eccdd/evals/elsuite/basic/match.py#L30-L66) | 입력과 기대값을 분리해 표본별 결과를 기록하고 정확도를 집계한다. | 자체 작성한 문장표와 Node 테스트에서 세 필드 값을 정확히 비교한다. 평가 플랫폼이나 데이터셋을 들여오지 않아도 된다. | [코드 MIT, 지정 데이터셋 조건 별도](https://github.com/openai/evals/blob/8eac7a7de5215c907fbddc30efdaf316913eccdd/LICENSE.md) |

위 세 저장소는 수집 당시 고정 커밋의 예제와 라이선스 원문을 확인했다. 기법을 참고했으며 추가 의존성은 제안하지 않는다.

## 승민이 모델을 직접 고르는 순서

1. **비교할 두 모델**을 계정에서 사용 가능한 OpenAI 모델 중 직접 고른다. 현재 환경변수는 TRIP_FIXER_MODEL이며 코드 기본값은 gpt-6-luna다. 후보별 실제 접근권한과 단가는 시험일에 확인한다. 개발용 Codex 모델 선택과 관광객 메모를 읽을 서비스 모델 선택은 별개다. [서비스 모델 설정](https://github.com/esm5678-dot/TRIP-FIXER/blob/1bbbe62bad8afa4650b5d793c8ffbf297f43daa8/lib/interpret.ts#L25-L46)
2. **사람이 기대값을 먼저 적는다.** 영어·일본어·중국어 간체·프랑스어 네 언어에 동일 의미의 여섯 상황을 준비한다. 단체 사진, 무대 영상 필수, 산책과 무계단 필요, 단체 사진과 선택적 무대 배경, 상충하는 두 필수 목표, 목표 없이 운영시간만 묻기로 총 24문항이다. 이 24문항은 설계상의 시험 규모다.
3. **동일한 조건에서 수동 비교한다.** 매 요청은 한 모델만 부른다. 동일한 프롬프트·제한시간·문항으로 2개 모델을 각 1회씩 비교하면 48회다. 호출 전 예산을 결정하고 호출 후 각 문항의 정답·제안·수동전환 사유·시간·입출력 토큰을 기록한다. 24개 중 정확한 결과 수를 분자로 표시하고 언어별 6개 결과와 시간 초과 횟수도 적는다. 평가 세트가 작으므로 실사용 정확도로 일반화하지 않는다.
4. **안전한 후보에서 승민이 선택한다.** 권장 출시 조건은 기존 무계단 조건의 묵시적 해제 0건, 사용자 확정 전 계획 변경 0건, API에 허용되지 않은 장소·시간이 최종 계획에 반영된 사례 0건이다. 통과한 후보끼리 목표·선호 해석의 정확도, 응답시간, 실비를 비교한다. 기준 미달이면 다국어 선택형 화면으로 시연하고 교체 이유를 기록한다.

| 검수 층 | 방법 | 이번에 실제로 확인한 범위 |
|---|---|---|
| 코드·대역 | 키 없음, 429, 응답 거절, 미완료, 비정상 필드 → 버튼 선택. 성공 응답도 명시적으로 적용한 뒤에만 반영. 네 언어에서 같은 상태 전환 확인 | 현재 소스의 대역·HTTP 경계 시험과 조건 누락 재현. 실모델이 올바른 목표를 냈다는 근거는 별도 필요. [대역 시험](https://github.com/esm5678-dot/TRIP-FIXER/blob/1bbbe62bad8afa4650b5d793c8ffbf297f43daa8/tests/interpret.test.ts) |
| 실모델 | 선택한 모델의 버전, 수행 날짜, 목표값, 실패 사유, 지연·토큰·비용을 사람이 대조 | 이번 설계 조사에서 유료 호출은 실시하지 않았다. 실사용자 메모 대신 팀이 만든 평가 문장을 사용한다. |
| 인수와 비용 | 공식 데이터와 화면 서버는 모델 없이 동작. 서버 키·사용량·모델 ID의 담당자와 허용 예산을 재단이 지정 | 5초 기한·store=false·24회/분 제어가 코드에 있다. 호출 제한 카운터는 인스턴스별 메모리에 있어 여러 인스턴스의 월 지출 상한으로 쓸 수 없다. [API 경계](https://github.com/esm5678-dot/TRIP-FIXER/blob/1bbbe62bad8afa4650b5d793c8ffbf297f43daa8/app/api/recover/route.ts#L5-L21) |
