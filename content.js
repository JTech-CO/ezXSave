let lastVideoUrl = null;
let lastTweetUrl = null;   // 새 탭 열기용 트윗 주소

function getVideoElement(e) {
  let video = e.target.closest('video');
  if (!video) {
    const article = e.target.closest('article');
    if (article) video = article.querySelector('video');
  }
  if (!video) {
    let el = e.target;
    while (el && el !== document.body) {
      if (el.tagName === 'VIDEO') break;
      const v = el.querySelector && el.querySelector('video');
      if (v) { video = v; break; }
      el = el.parentElement;
    }
  }
  return video;
}

document.addEventListener('contextmenu', (e) => {
  const video = getVideoElement(e);
  if (video) {
    lastVideoUrl = video.currentSrc || video.src;
    // 현재 트윗 주소 저장 (새 탭 열기 fallback)
    const article = e.target.closest('article');
    lastTweetUrl = article ? article.querySelector('a[href^="/"][href*="/status/"]')?.href : window.location.href;
  } else {
    lastVideoUrl = null;
    lastTweetUrl = null;
  }
}, true);

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getVideoUrl') {
    sendResponse({ url: lastVideoUrl, tweetUrl: lastTweetUrl });
  } else if (msg.action === 'downloadVideo' && lastVideoUrl) {
    downloadVideo(lastVideoUrl);
    sendResponse({ success: true });
  }
});

async function downloadVideo(url) {
  try {
    console.log('[ezXSave] 다운로드 시작:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Referer': 'https://x.com/',
        'Origin': 'https://x.com'
      },
      credentials: 'include'
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `x-video-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);

    console.log('[ezXSave] ✅ 다운로드 성공');
  } catch (err) {
    console.error('[ezXSave] ❌ 다운로드 실패:', err);
    alert('다운로드 실패\n\n동영상이 재생 중인지 확인 후 다시 우클릭해주세요.');
  }
}