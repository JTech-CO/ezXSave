# ezXSave

> X(트위터) 동영상을 우클릭 한 번으로 새 탭 열기 & 저장하는 초경량 Chrome 확장 프로그램

## 1. 소개 (Introduction)

이 프로젝트는 X(트위터)에서 동영상을 마우스 우클릭으로 쉽게 저장하거나 새 탭에서 여는 기능을 제공하는 Chrome/Edge 확장 프로그램입니다. X 플랫폼의 기본 제한을 해결하며, **초경량** 설계와 직관적인 우클릭 메뉴로 사용자에게 빠르고 편리한 동영상 경험을 제공합니다.

**주요 기능**
- **동영상 새 탭 열기**: 우클릭 메뉴로 즉시 새 탭에서 동영상 열기
- **동영상 저장하기**: 우클릭으로 저장 위치 선택 창과 함께 MP4 파일 다운로드

## 2. 기술 스택 (Tech Stack)

- **Platform**: Chrome Extension (Manifest V3)
- **Language**: Vanilla JavaScript
- **APIs**: chrome.contextMenus, chrome.downloads, chrome.tabs, chrome.runtime

## 3. 설치 및 실행 (Quick Start)

**요구 사항**: Google Chrome 또는 Microsoft Edge 브라우저

1. **설치 (Install)**
   ```bash
   # GitHub에서 클론한 경우
   git clone [레포지토리 URL]
   cd ezXSave
   ```

   또는 직접 3개 파일(manifest.json, background.js, content.js)을 만들어 사용

2. **확장 프로그램 로드**
   - Chrome/Edge에서 `chrome://extensions/` 또는 `edge://extensions/` 열기
   - 오른쪽 상단 **Developer mode** 켜기
   - **Load unpacked** 클릭 후 ezXSave 폴더 선택

3. **사용 (Run)**
   - x.com 또는 twitter.com에서 동영상 위에 마우스 **우클릭**
   - “Open Video in New Tab” 또는 “Save Video” 메뉴 선택

## 4. 폴더 구조 (Structure)

```text
ezXSave/
├── manifest.json          # 확장 프로그램 설정 및 권한
├── background.js          # 컨텍스트 메뉴 생성 및 다운로드 처리
├── content.js             # X 페이지에서 동영상 URL 감지
└── README.md
```

## 5. 정보 (Info)

- **License**: MIT
- **Version**: 1.0
```

---
