# 재단 인수와 현장 테스트 설계

검토 기준은 2026년 11월 27일 리허설 커밋 1bbbe62다. 승민이 실행·모델·배포를 결정하고, 기술 검토자는 대회에서 허용된 역할 범위 안에서 아래 증거를 확인한다. [감사 기준 커밋](https://github.com/esm5678-dot/TRIP-FIXER/tree/1bbbe62bad8afa4650b5d793c8ffbf297f43daa8)

## 현재 구현 대조

현재 GitHub Actions는 읽기 전용 저장소 권한으로 설치·단위 시험·빌드·타입 검사·Chromium 브라우저 시험·잠금파일 SBOM 생성과 업로드를 수행한다. 모바일 CI는 네 가지 화면 폭에서 한 언어씩 검사한다. 320px는 프랑스어, 430px는 일본어다. 기기 프로필, WebKit, 실제 iPhone 소프트 키보드와 화면 읽기 사용성은 미측정이다. Node 규칙·메모 단위 시험 28개는 이번 감사에서 다시 실행해 모두 통과했다. [현재 CI](https://github.com/esm5678-dot/TRIP-FIXER/blob/1bbbe62bad8afa4650b5d793c8ffbf297f43daa8/.github/workflows/ci.yml#L5-L29) · [모바일 시험](https://github.com/esm5678-dot/TRIP-FIXER/blob/1bbbe62bad8afa4650b5d793c8ffbf297f43daa8/tests/browser/mobile.spec.ts)

| 직접 읽은 공개 구현 | 파일에서 확인한 동작·라이선스 | 설계 결정과 통과 기준 |
|---|---|---|
| Microsoft Playwright | iPhone 13 정의에는 화면 크기·배율, 터치, 모바일 모드, 기본 WebKit 엔진이 함께 있다. Apache-2.0. [기기 정의](https://github.com/microsoft/playwright/blob/bbd948344ea9a60bf1e6f125c02ca99b2b51593b/packages/isomorphic/deviceDescriptorsSource.json#L1068-L1083) · [라이선스](https://github.com/microsoft/playwright/blob/bbd948344ea9a60bf1e6f125c02ca99b2b51593b/LICENSE) | 기존 Chromium 시험에 대표 과제 한 건만 WebKit으로 추가한다. 사진 목표 → 45분 대기 → 3층 확인 → 한국어 질문 → 새로고침을 재현한다. Chromium 전용 실행 파일 경로는 WebKit 설정에서 제외한다. 실기기 시험은 별도 기록한다. |
| Deque axe-core | 자동 판정 위반과 사람이 확인해야 할 항목을 따로 돌려준다. 도구 본체 MPL-2.0. [실행 구현](https://github.com/dequelabs/axe-core/blob/f49c1c49b5eafe1f8065e07c314f75968dd91333/lib/core/public/run.js) · [결과 분류](https://github.com/dequelabs/axe-core/blob/f49c1c49b5eafe1f8065e07c314f75968dd91333/doc/API.md#L640) · [라이선스](https://github.com/dequelabs/axe-core/blob/f49c1c49b5eafe1f8065e07c314f75968dd91333/LICENSE) | 본선 기본안은 기존 Playwright와 키보드·화면 읽기 수동 점검이다. axe 도입은 테스트 환경으로 한정하고 SBOM에 개발 용도를 적는다. 테스트 전용 사용의 대회 허용 범위는 별도 확인한다. |
| npm CLI | 같은 명령으로 가상 잠금 트리와 설치 트리를 별도로 읽고 개발 의존성 등 대상을 제외할 수 있다. npm CLI는 Artistic-2.0, 내장 의존성은 개별 조건을 따른다. [SBOM 구현](https://github.com/npm/cli/blob/3acf9a784798094a5feb43c2e1898429dd667cb6/lib/commands/sbom.js#L38-L45) · [라이선스](https://github.com/npm/cli/blob/3acf9a784798094a5feb43c2e1898429dd667cb6/LICENSE) | 이미 설치된 npm으로 잠금 트리와 현재 운영체제 설치 트리를 따로 출력하고 최종 배포 파일과 대조한다. 새 SBOM 생성기 도입은 보류한다. |
| GitHub Actions upload-artifact | 검토한 v4 구현의 업로드 파일 누락 기본값은 경고다. 누락 시 실패와 보관 기간을 지정할 수 있다. MIT. [업로드 설정](https://github.com/actions/upload-artifact/blob/ea165f8d65b6e75b540449e92b4886f43607fa02/action.yml#L9-L26) · [라이선스](https://github.com/actions/upload-artifact/blob/ea165f8d65b6e75b540449e92b4886f43607fa02/LICENSE) | 현장 CI의 인계 아카이브는 SBOM이 없으면 실패하도록 설계한다. CI 보관 만료 전에 인수자가 커밋, SBOM, 고지문, 배포 식별자, 매뉴얼을 내려받는다. 리허설에는 누락 동작에 대한 별도 지정이 없다. |

위 링크는 확인한 소스의 불변 버전이다. Playwright 1.65.1은 리허설과 일치한다. axe와 upload-artifact는 참고 동작을 확인한 버전이다.

## LGPL 표시는 어디에 남는가

Linux x64, glibc 2.41, Node 24.22.3, npm 11.19.1에서 같은 커밋에 npm ci를 실행한 뒤 두 산출물을 비교했다.

| 11월 27일 직접 측정 대상 | 전체 구성요소 | LGPL 표시 | 해석 |
|---|---:|---:|---|
| 잠금파일에서 생성한 CycloneDX | 65 | 14 | 잠금파일의 해당 14개가 모두 플랫폼별 선택 항목이다. |
| Linux 설치 트리에서 개발 부품을 뺀 CycloneDX | 24 | 1 | 이 환경에는 @img/sharp-libvips-linux-x64가 설치됐다. |
| 로컬 Next 프로덕션 빌드의 파일 추적 명세 | 7개 명세 | 파일 경로 기준 | 전체 서버 명세(next-server.js.nft.json)에 sharp·libvips 관련 경로 19개가 있었다. recover 경로 명세와 minimal 서버 명세에는 각각 0개였다. 명세별 집계이며 패키지 수와 단위가 다르다. |
| Vercel에 실제 올라간 함수와 정적 자산 | 미측정 | 미확인 | 재단 인수에 사용할 배포 빌드 결과의 파일·라이선스와 배포 ID를 대조한다. |

재현 명령은 잠금파일 기준 `npm sbom --sbom-format cyclonedx --package-lock-only`, 설치 기준 `npm sbom --sbom-format cyclonedx --omit=dev`다. 이미지 최적화를 끈 설정은 설치 여부를 결정하지 않는다. 확인 전에는 대회 허용 여부를 단정할 수 없다. 외부 지도·모델 약관, 사진 원작자·출처, 장소 설명, 팀이 작성한 프롬프트도 인계 목록에 별도로 넣는다. [기존 인수 고지·출처](https://github.com/esm5678-dot/TRIP-FIXER/blob/1bbbe62bad8afa4650b5d793c8ffbf297f43daa8/docs/SOURCES.md#L25-L40) · [npm 공식 SBOM 설명](https://docs.npmjs.com/cli/commands/npm-sbom/)

## 14시간 중 검수와 인수

아래는 기존 9~12시간대 통합·배포 구간에 포함하는 제안 시간이다.

| 우선순위·예상 | 참가자가 직접 할 일 | 통과 증거·장애 시 조치 |
|---|---|---|
| 필수 · 20분 | 모바일 목표·복귀·결과·후보 없음에서 영어와 프랑스어 문구를 확인하고 일본어·중국어로 직원용 질문을 연다. 실물 휴대폰이 있으면 소프트 키보드가 열린 상태에서 시간 입력·이전 단계·한국어 문구도 확인한다. | 단계 이름, 복귀 시각과 목표 보존, 버튼 가림 여부, 한글 원문을 기록한다. 기기가 없으면 검증한 브라우저·화면 크기와 미검증 항목을 적는다. |
| 필수 · 20분 | 제출 직전 설치 트리와 잠금파일 목록을 만들고 제3자 고지, 배포 식별자와 묶는다. | 두 목록의 생성 기준·Node/npm·운영체제·커밋이 남는다. 권리 미확인 항목은 대상과 사용 범위를 보존해 운영진에 확인한다. |
| 필수 · 20분 | 인수자 역할의 팀원이 빈 폴더에서 실행하고 장소 카드 한 장의 확인일을 고친 뒤 사전보기 배포와 이전 버전 복귀를 연습한다. | 재단 담당 역할의 팀원이 수정한 카드, 사전보기 URL, 복귀 후 이전 값이 열리는지 직접 확인한다. 실패 단계와 오류를 인계 문서에 적는다. |
| 여유 · 15분 | WebKit 대표 흐름을 추가 실행한다. 접근성 자동 검사를 적용한 경우 위반과 미확정 결과를 따로 검토한다. | 브라우저·언어·과제·잔여 수동 검사를 남긴다. 언어와 화면 폭을 모두 조합한 다중 엔진 시험은 후속 운영 과제로 둔다. |
