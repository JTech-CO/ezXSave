/* ──────────────────────────────────────────────
   ezXSave v2 – Content Script
   트윗 ID 추출 + 다운로드 버튼 + 우클릭 메뉴 연동
   ────────────────────────────────────────────── */

// ── Tweet ID 추출 ──────────────────────────────

/**
 * URL에서 트윗(status) ID를 추출
 * 형식: x.com/user/status/123456789...
 */
function getTweetIdFromUrl(url) {
  const m = url.match(/\/status\/(\d+)/);
  return m ? m[1] : null;
}

/**
 * 비디오 요소에서 가장 가까운 트윗의 ID를 찾기
 * 1) 부모 article → 내부 status 링크
 * 2) 현재 페이지 URL (단일 트윗 페이지)
 */
function findTweetIdForVideo(video) {
  // article 내부의 status 링크 탐색
  const article = video.closest('article');
  if (article) {
    // 타임스탬프 링크가 /status/ID 를 포함
    const links = article.querySelectorAll('a[href*="/status/"]');
    for (const link of links) {
      const id = getTweetIdFromUrl(link.href);
      if (id) return id;
    }
  }

  // fallback: 현재 페이지 URL
  return getTweetIdFromUrl(location.href);
}

// ── 다운로드 로직 ──────────────────────────────

async function downloadVideo(tweetId, statusEl) {
  if (!tweetId) {
    showStatus(statusEl, '❌ 트윗 ID를 찾을 수 없습니다', true);
    return;
  }

  showStatus(statusEl, '⏳ 영상 정보 가져오는 중...');

  try {
    const res = await chrome.runtime.sendMessage({ action: 'fetchVideo', tweetId });

    if (res?.error === 'no_video') {
      showStatus(statusEl, '❌ 이 트윗에 동영상이 없습니다', true);
      return;
    }
    if (res?.error) {
      showStatus(statusEl, `❌ ${res.error}`, true);
      return;
    }

    const filename = `${res.screenName}_${res.tweetId}.mp4`;
    chrome.runtime.sendMessage({
      action: 'downloadMp4',
      url: res.url,
      filename
    });

    showStatus(statusEl, '✅ 다운로드 시작!');
  } catch (err) {
    console.error('[ezXSave]', err);
    showStatus(statusEl, '❌ 오류 발생 — 콘솔 확인', true);
  }
}

function showStatus(el, text, isError = false) {
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? '#ff6b6b' : '#1d9bf0';
  // 3초 후 리셋
  clearTimeout(el._timer);
  el._timer = setTimeout(() => {
    if (el) el.textContent = '';
  }, 3000);
}

// ── 다운로드 버튼 주입 ─────────────────────────

function injectButtonOnArticle(article) {
  if (article.dataset.ezxsave) return;
  article.dataset.ezxsave = 'true';

  // article 안에 video 가 있을 때만
  const video = article.querySelector('video');
  if (!video) return;

  const tweetId = findTweetIdForVideo(video);
  if (!tweetId) return;

  // 버튼 컨테이너
  const container = document.createElement('div');
  container.className = 'ezxsave-container';

  const btn = document.createElement('button');
  btn.className = 'ezxsave-btn';
  btn.textContent = '⬇ Save Video';

  const status = document.createElement('span');
  status.className = 'ezxsave-status';

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    downloadVideo(tweetId, status);
  });

  container.appendChild(btn);
  container.appendChild(status);

  // article 내부, 동영상 아래쪽에 삽입
  // 동영상을 감싸는 div 바로 뒤
  const mediaContainer = video.closest('[data-testid="videoPlayer"]')
                      || video.closest('[data-testid="tweetPhoto"]')
                      || video.parentElement;
  if (mediaContainer?.parentElement) {
    mediaContainer.parentElement.insertBefore(container, mediaContainer.nextSibling);
  } else {
    article.appendChild(container);
  }
}

// ── MutationObserver: 새 트윗 감지 ─────────────

function scanArticles() {
  document.querySelectorAll('article').forEach(article => {
    // video 가 존재하는 article 만 처리
    if (article.querySelector('video')) {
      injectButtonOnArticle(article);
    }
  });
}

const observer = new MutationObserver(() => scanArticles());
observer.observe(document.body, { childList: true, subtree: true });

// 초기 스캔 (지연)
setTimeout(scanArticles, 2000);

// ── 우클릭 메뉴 연동 ──────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'open-x-video') {
    const tweetId = getTweetIdFromUrl(location.href) || findClosestTweetId();
    if (tweetId) {
      chrome.runtime.sendMessage({ action: 'fetchVideo', tweetId }, (res) => {
        if (res?.url) {
          window.open(res.url, '_blank');
        } else {
          // fallback: 트윗 페이지 열기
          window.open(location.href, '_blank');
        }
      });
    }
  }

  if (msg.action === 'download-x-video') {
    const tweetId = getTweetIdFromUrl(location.href) || findClosestTweetId();
    if (tweetId) {
      downloadVideo(tweetId, null);
    }
  }
});

/**
 * 페이지에서 첫 번째 article의 트윗 ID를 찾기 (우클릭 fallback)
 */
function findClosestTweetId() {
  const articles = document.querySelectorAll('article');
  for (const article of articles) {
    if (!article.querySelector('video')) continue;
    const link = article.querySelector('a[href*="/status/"]');
    if (link) return getTweetIdFromUrl(link.href);
  }
  return null;
}