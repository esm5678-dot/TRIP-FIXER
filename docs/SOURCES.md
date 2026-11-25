# 제품 결정과 근거

## 실제 서비스에서 가져온 판단

| 확인한 서비스 | 공개 자료에서 확인한 내용 | 리허설에서 적용하고 시험할 것 |
|---|---|---|
| Klook | N서울타워 Fast Track 상품은 전망대와 케이블카의 줄을 구분한다. 개별 후기도 매표·엘리베이터 대기를 따로 언급한다. [상품 안내와 후기](https://www.klook.com/activity/412-n-seoul-tower-seoul/) | 사용자가 말한 45분은 선택한 체험에만 붙인다. 2층 촬영 중단과 건물 전체 휴관의 결과가 달라야 한다. Klook 사례의 대기시간을 하이커 데이터로 전용하지 않는다. |
| Wanderlog | 일정 항목과 지도를 한 화면에서 보고 순서를 조정할 수 있다. [서비스 소개](https://wanderlog.com/) | 목표와 정문 복귀 약속을 결과 화면에도 함께 둔다. 계획을 다시 작성하는 조작을 줄였는지는 사용자 시험 대상이다. |
| Viator | 자체 파트너 자료는 목적지 도착 후 발생하는 예약이 약 3분의 1이라고 안내한다. [파트너 자료](https://partnerresources.viator.com/uncategorized/10564/) | 현장에서 모바일로 한 가지 다음 행동을 확인하는 흐름을 채택했다. 서울 방문자의 일정 실패율·구매의사는 미확인이다. |
| Visit Seoul | 다국어 공식 관광 안내에서 장소와 체험을 찾아볼 수 있다. [공식 영문 안내](https://english.visitseoul.net/) | 영어 화면에 운영 주체 출처와 현장용 한국어 문장을 제공한다. 어느 제품이 같은 조건에서 더 정확한지는 비교 사용자 시험 전이다. |

## 세 활동과 데이터 관리

| 활동 또는 조건 | 확인한 사실 | 현장에서 확인해야 하는 값 |
|---|---|---|
| 하이커 2층 | 한국관광공사는 K-pop 체험·촬영 공간을 안내한다. [층별 공식 안내](https://english.visitkorea.or.kr/svc/sp/hikr) | 선택한 세트의 촬영 가능 여부, 개별 대기, 이동과 체험 시간 |
| 하이커 3층 | 서울시 내 손안에 서울의 시민기자 현장 기록에 하이커 스트리트의 버스 정류장 포토존 사진이 있다. [현장 기록](https://mediahub.seoul.go.kr/archives/2018903) · [한국관광공사 시설 설명](https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=13118897-962b-4fe3-b8fb-7550f1ae182d) | 현재 세트 구성, 촬영 허용, 대기와 복귀 동선 |
| 하이커 운영 | 관광공사 안내의 2~4층 영업은 화~일 10:00~20:00, 마지막 입장 19:40이다. [운영 정보](https://english.visitkorea.or.kr/svc/whereToGo/locIntrdn/rgnContentsView.do?vcontsId=31124) | 임시 휴관, 층별 장비 중단과 접근성. 이용자가 같은 건물 안인지 구분한다. |
| 광교 청계천 | 서울시설공단이 광교를 계단 진입로로 분류한다. [진출입로](https://www.sisul.or.kr/open_content/cheonggye/enjoy/way.jsp) · [현재 공지](https://www.sisul.or.kr/open_content/cheonggye/) | 지금 통행 가능한지, 날씨·구간 통제와 복귀 시간. 이 입구의 조건만 판정한다. |

운영 담당자는 각 카드의 사실·층·출처·확인일을 함께 검수한다. 운영시간이 바뀌면 시간 규칙과 경계 테스트를 같이 수정한다. 출처 소멸 또는 사실 충돌 시 해당 항목을 공개 목록에서 내려 검토한다. 공식 페이지 내용을 대량 복제하거나 개인 후기를 실시간 데이터로 집계하는 기능은 없다.

## 오픈소스와 외부 서비스

| 선택 | 사용처와 채택 이유 | 검토한 대안과 선택하지 않은 이유 | 라이선스·운영 |
|---|---|---|---|
| [TypeScript](https://github.com/microsoft/TypeScript) | 화면·서버·규칙·테스트가 같은 여행 목표 타입을 쓴다. | Java/Spring은 이 규모에서 별도 서버와 타입 동기화가 추가된다. C는 폼·웹 데이터 처리를 직접 관리해야 한다. | Apache-2.0 |
| [React](https://github.com/react/react) · [Next.js](https://github.com/vercel/next.js) | 화면과 POST 경로를 하나로 배포한다. | React+별도 API 서버는 배포 단위가 두 개다. | 둘 다 MIT. Next 선택 의존성은 아래 별도 기재 |
| [Zod](https://github.com/colinhacks/zod) | 외부 입력·모델 답의 허용 형태를 제한한다. | 손으로 타입 조건을 반복하면 런타임 검증과 TS 정의가 어긋날 수 있다. | MIT |
| [Lucide](https://github.com/lucide-icons/lucide) · 기본 CSS | 같은 아이콘에 글자 레이블을 붙인다. 모서리·색·간격은 CSS 한 파일로 수정한다. | Tailwind와 shadcn/ui를 추가하면 두 화면에서 배울 추상화·의존성이 늘어난다. | Lucide는 ISC, 일부 Feather 파생 아이콘은 MIT. [고지 전문](../public/third-party.txt) |
| 저장소 내 JSON · 브라우저 탭 보관 | 세 곳의 출처를 사람이 검수할 수 있고 접속자 계정을 만들 필요가 없다. | 범용 장소 검색, 실시간 대기 크롤링, 계정 DB는 관측값의 신뢰와 운영 비용을 새로 검증해야 한다. | 직접 작성 데이터, 연결된 공공 페이지의 조건은 각 운영자 기준 |
| [OpenAI Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create) · [GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna) | 영어 문장 하나를 정해진 목표·선호·접근 조건으로 읽는다. 한 번의 요청, 서버 키, 사용량 기반 비용이다. | 큰 모델과 에이전트 여러 개는 대기 계산의 정확성을 더하지 않는다. 다른 모델은 같은 시험 문장으로 비교한 뒤 사용자가 선택한다. | 상용 서비스. [요금](https://openai.com/api/pricing/) · [데이터 처리](https://developers.openai.com/api/docs/guides/your-data) |
| [Node 내장 테스트](https://nodejs.org/api/test.html) · [Playwright](https://github.com/microsoft/playwright) | 시간 계산은 빠른 순수함수 테스트, 화면 변화는 실제 Chromium에서 확인한다. | Vitest를 추가하지 않아도 정해진 시간·입력 주입이 가능하다. | Node.js는 MIT와 배포본 고지, Playwright는 Apache-2.0 |
| [Codex](https://github.com/openai/codex) · [Paseo](https://github.com/getpaseo/paseo) | 개발 지시는 Codex에 한 작업씩 전달한다. Paseo는 사용자가 세션을 다른 기기에서 보고 싶을 때 선택할 수 있다. | 병렬 자율 에이전트와 자동 병합은 1인이 판단 과정을 배우는 용도에 맞지 않는다. | Codex CLI는 Apache-2.0. [Paseo 자체 코드도 Apache-2.0](https://github.com/getpaseo/paseo/blob/main/LICENSE)이고 제3자 부품은 각 라이선스를 따른다. 리허설 배포는 Paseo 없이 실행된다. 요금과 모델 권한은 각 계정 기준. |
| [GitHub Actions](https://github.com/features/actions) · [Vercel](https://vercel.com/docs/deployments) | 변경마다 테스트하고 한 앱의 빌드를 배포한다. | 커스텀 컨테이너·직접 운영은 이 범위에서 관리 작업이 늘어난다. | 호스팅 서비스 약관·플랜. checkout/setup-node/upload-artifact 액션은 MIT. DB 비용 없음. |
| [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started) | 후보가 없을 때 약속 건물 또는 다리의 외부 위치 검색을 연다. | 지도 SDK, GPS, 길찾기 유료 API는 결과 화면에서 요구하지 않는다. | 외부 링크. API 키가 필요하지 않으며 층·도보 시간을 보증하지 않는다. |

SBOM은 npm lockfile에서 생성한 CycloneDX 문서이며 **65개 구성요소**를 열거한다. 주요 소스가 MIT여도 설치 트리는 별도로 검토해야 한다. 14개 플랫폼별 sharp/libvips 관련 항목의 표시 라이선스에 LGPL-3.0-or-later가 들어 있다. 사진은 정적 JPEG로 제공하고 이미지 최적화는 껐다. 선택 패키지가 잠금파일에 남으므로 본선 제출 전 실제 배포물과 주최 측의 LGPL 취급 기준을 확인해야 한다. [SBOM](sbom.cdx.json) · [sharp-libvips](https://github.com/lovell/sharp-libvips) · [대회 FAQ](https://prompt2026.sto.or.kr/)

청계천 사진은 Salalucio가 촬영한 2009년 자료다. 저자가 WORLDWIDE public domain으로 공개했다. 당시 지역 풍경용으로만 표시한다. [원본 및 권리 표시](https://commons.wikimedia.org/wiki/File:Cheonggyecheonview.jpg)
