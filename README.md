# ezXSave

> **X(Twitter)의 영상 및 움짤(GIF)을 원본 화질(MP4)로 쉽고 빠르게 다운로드할 수 있는 Chrome 확장 프로그램입니다.**

## 1. 소개 (Introduction)

이 프로젝트는 X(구 Twitter)에서 재생되는 미디어를 외부 사이트 경유 없이 즉시 다운로드할 수 있도록 돕는 확장 프로그램입니다. 
트윗 컨테이너를 탐색하여 다운로드 버튼을 오버레이로 자동 삽입하며, 숨겨진 Twitter Syndication API를 호출하여 별도의 인증 없이도 HLS(m3u8) 변환 과정 없이 직접 최고 화질의 MP4 영상 경로를 추출합니다.

**주요 기능**
- **다운로드 버튼 자동 주입**: 동영상 및 GIF가 포함된 트윗에 전용 다운로드 버튼 자동 생성
- **최고 화질(Best Quality) 고정**: 여러 해상도의 미디어 중 가장 비트레이트가 높은 원본 MP4 자동 선택
- **GIF 다운로드 지원**: 움직이는 이미지(animated_gif)도 자동으로 MP4 형태로 변환하여 다운로드
- **파일명 자동 지정**: `유저명_트윗ID.mp4` 형식으로 파일명을 자동 저장하여 관리 용이

**기능별 작동 메커니즘 요약**
| 기능 | 작동 스크립트 | 기술 방식 |
|------|-------------|----------|
| 미디어 감지 및 버튼 주입 | Content Script | `MutationObserver`를 활용한 트윗 `article` 내 `video` 요소 탐지 |
| 토큰 생성 및 데이터 요청 | Background | 트윗 ID 기반 자체 연산 알고리즘으로 토큰 생성 후 Syndication API 호출 |
| 영상 URL 파싱 및 다운로드 | Background | 응답 JSON에서 `video/mp4` 포맷 중 최고 `bitrate` 선별 후 `chrome.downloads` 실행 |

## 2. 기술 스택 (Tech Stack)

- **Platform**: Chrome Extension (Manifest V3)
- **Language**: Vanilla JavaScript
- **API Integration**: Twitter Syndication API (`cdn.syndication.twimg.com/tweet-result`)
- **DOM Manipulation**: `MutationObserver`, CSS Selector Querying
- **Background Task**: `chrome.runtime.onMessage`, `chrome.downloads`

## 3. 기술 아키텍처 (Architecture)

```text
Isolated World (content.js)                          Background (background.js)
┌─────────────────────────────┐                    ┌────────────────────────────┐
│ 부트스트랩 (상태 뱃지 주입)     │                    │ 메시지 리스너 대기           │
│ MutationObserver 시작       │                    │ (fetchVideo, downloadMp4)  │
│ 트윗 article 및 video 탐지    │                    └────────────────────────────┘
│ 트윗 ID 추출                 │                                 ▲
│ 버튼(Download) DOM 삽입      │──sendMessage(fetchVideo)───┐    │
│ 클릭 이벤트 리스너 등록        │◀─응답(mp4Url, 유저명, 등)────┘    │
│ 버튼 상태 변경(Fetching...)   │                                 │
│ 파일 다운로드 요청            │──sendMessage(downloadMp4)──────┘
└─────────────────────────────┘                    ┌────────────────────────────┐
                                                   │ 1. 토큰 생성 알고리즘 실행    │
                                                   │ 2. Syndication API Fetch   │
                                                   │ 3. JSON에서 Best MP4 추출   │
                                                   │ 4. chrome.downloads 실행   │
                                                   └────────────────────────────┘
```

### 프로세스 상세 플로우

**Layer 1 — DOM 조작 및 이벤트 트리거 (content.js)**

1. 페이지가 렌더링되면 `MutationObserver`가 동작하여 동적으로 로드되는 `<article>` 내부의 `<video>` 요소를 지속적으로 탐색합니다.
2. 비디오 요소를 발견하면 부모 요소 중 `[data-testid="videoPlayer"]` (일반 영상) 또는 `[data-testid="tweetPhoto"]` (GIF)를 확인하여 알맞은 다운로드 버튼(Download)을 주입합니다.
3. 사용자 클릭 시, 해당 트윗의 ID를 추출하여 `background.js`로 전달합니다.

**Layer 2 — API 통신 및 파일 시스템 접근 (background.js)**

1. 트윗 ID를 이용해 인증 우회용 토큰을 생성합니다. (수식: `((tweetId / 1e15) * Math.PI).toString(36)`)
2. `cdn.syndication.twimg.com` API를 호출하여 트윗의 원본 메타데이터(JSON)를 가져옵니다.
3. 메타데이터 내 `video_info.variants` 배열을 순회하며 `content_type`이 `video/mp4`인 소스 중 `bitrate`가 가장 높은 URL을 찾아냅니다.
4. 추출된 URL을 `chrome.downloads.download` API를 사용하여 사용자의 로컬 환경에 직접 저장합니다.

## 4. 설치 및 실행 (Quick Start)

**요구 사항**: Chrome, Edge, Whale 등 Chromium 기반 브라우저

1. **다운로드**
   - 이 저장소(폴더)를 다운로드하거나 압축을 해제합니다.
2. **확장 프로그램 페이지 접속**
   ```text
   chrome://extensions (Chrome)
   edge://extensions   (Edge)
   whale://extensions  (Whale)
   ```
3. **로드**
   - 우상단 **"개발자 모드(Developer mode)"** 켜기
   - **"압축해제된 확장 프로그램을 로드합니다(Load unpacked)"** 클릭 후 현재 폴더 선택

## 5. 폴더 구조 (Structure)

```text
ezXSave/
├── manifest.json      # MV3 매니페스트 — 권한(downloads) 및 호스트 설정, 스크립트 연결
├── background.js      # Service Worker — API 호출, MP4 URL 추출, 다운로드 처리
├── content.js         # Isolated World — DOM 관찰, 버튼 오버레이 생성, 이벤트 핸들링
├── style.css          # 다운로드 버튼 및 상태 뱃지 스타일시트
├── README.md          # 프로젝트 안내 및 아키텍처 문서
├── privacy-policy.html# 개인정보 처리방침
└── icons/             # 확장 프로그램 아이콘 (16/48/128 PNG)
```

## 6. 제한사항 (Limitations)

- **비공개 계정 및 민감한 콘텐츠**: 계정이 잠겨있거나 연령 제한이 걸린 민감한 트윗의 경우 Syndication API가 데이터 접근을 거부하여 다운로드가 불가할 수 있습니다.
- **비공식 API 의존성**: X(Twitter)의 내부 API를 활용하므로, 향후 엔드포인트 변경이나 토큰 생성 방식이 변경될 경우 작동이 중단될 수 있습니다. 향후 관련 코드 변경 시 업데이트 예정.
- **GIF 형식 변환**: Twitter의 원본 처리 방식에 따라, GIF 콘텐츠도 최종적으로는 `.mp4` 확장자로 다운로드됩니다.

## 7. 정보 (Info)

- **License**: MIT
- **Version**: 2.0.0
- **Privacy Policy**: [개인정보 처리방침 안내](privacy-policy.html)