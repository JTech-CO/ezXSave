let lastVideoUrl = null;
let lastTweetUrl = null;

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

function downloadVideo(url) {
  if (!url) {
    alert('동영상을 찾을 수 없습니다. 동영상이 재생 중인지 확인해주세요.');
    return;
  }

  console.log('[ezXSave] 다운로드 시작:', url);

  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = `x-video-${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    console.log('[ezXSave] ✅ 다운로드 성공 (blob URL 직접 처리)');
  } catch (err) {
    console.error('[ezXSave] ❌ 다운로드 실패:', err);
    alert('다운로드 실패\n\n동영상이 완전히 로드된 후 다시 우클릭해주세요.');
  }
}
