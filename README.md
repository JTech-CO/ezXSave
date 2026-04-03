# ezXSave v2

> X(트위터) 동영상을 최고 화질 MP4로 다운로드하는 Chrome 확장 프로그램

## 동작 원리

Twitter Syndication API (`cdn.syndication.twimg.com/tweet-result`)를 사용하여 트윗에 포함된 동영상의 직접 MP4 URL을 가져옵니다. 별도의 API 키가 필요 없으며, HLS(m3u8) 스트리밍을 변환할 필요 없이 직접 MP4 파일을 다운로드합니다.

## 주요 기능

- **Save Video 버튼**: 동영상이 있는 트윗에 자동으로 다운로드 버튼 표시
- **우클릭 메뉴**: "Open Video in New Tab" / "Save Video (Best Quality)"
- **최고 화질 자동 선택**: 사용 가능한 variant 중 최고 bitrate의 MP4를 선택
- **파일명 자동 생성**: `유저명_트윗ID.mp4` 형식

## 설치

1. `chrome://extensions/` (또는 `edge://extensions/`) 열기
2. **Developer mode** 켜기
3. **Load unpacked** 클릭 후 이 폴더 선택

## 사용법

1. x.com 또는 twitter.com에서 동영상이 포함된 트윗 방문
2. 동영상 아래에 나타나는 **⬇ Save Video** 버튼 클릭
3. 또는 동영상 위에서 **우클릭** → "Save Video (Best Quality)"

## 제한사항

- **비공개 계정 / 민감한 콘텐츠**: Syndication API가 접근하지 못할 수 있음
- **비공식 API**: Twitter가 언제든 엔드포인트를 변경할 수 있음
- **GIF**: animated_gif 타입도 MP4로 다운로드 가능

## 파일 구조

```
ezXSave/
├── manifest.json   # 확장 프로그램 설정 및 권한
├── background.js   # Syndication API 호출 + 다운로드 처리
├── content.js      # 트윗 ID 추출 + 버튼 주입
├── style.css       # 버튼 스타일
└── README.md
```

## License

MIT