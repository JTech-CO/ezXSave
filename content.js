/* ezXSave v3 – Content Script */

// ── Tweet ID helpers ───────────────────────────

function getTweetIdFromUrl(url) {
  const m = url.match(/\/status\/(\d+)/);
  return m ? m[1] : null;
}

function findTweetIdForVideo(video) {
  const article = video.closest('article');
  if (article) {
    const links = article.querySelectorAll('a[href*="/status/"]');
    for (const link of links) {
      const id = getTweetIdFromUrl(link.href);
      if (id) return id;
    }
  }
  return getTweetIdFromUrl(location.href);
}

// ── Download logic ─────────────────────────────

async function downloadVideo(tweetId, btn) {
  if (!tweetId) return;

  const originalText = btn.textContent;
  btn.textContent = 'Fetching...';
  btn.disabled = true;

  const reset = (label) => {
    btn.textContent = label;
    setTimeout(() => {
      btn.textContent = originalText;
      btn.disabled = false;
    }, 2000);
  };

  try {
    const res = await chrome.runtime.sendMessage({ action: 'fetchVideo', tweetId });
    if (res?.error) { reset('No video'); return; }

    chrome.runtime.sendMessage({
      action: 'downloadMp4',
      url: res.url,
      filename: `${res.screenName}_${res.tweetId}.mp4`
    });
    reset('Downloading!');
  } catch (err) {
    console.error('[ezXSave]', err);
    reset('Error');
  }
}

// ── Bottom-left status badge ───────────────────

function injectStatusBadge() {
  if (document.getElementById('ezxsave-badge')) return;
  const badge = document.createElement('div');
  badge.id = 'ezxsave-badge';
  badge.textContent = 'ezXSave is working';
  document.body.appendChild(badge);
}

// ── Download button overlay on video ──────────

function injectButtonOnArticle(article) {
  if (article.dataset.ezxsave) return;
  article.dataset.ezxsave = 'true';

  const video = article.querySelector('video');
  if (!video) return;

  const tweetId = findTweetIdForVideo(video);
  if (!tweetId) return;

  // Walk up from the video to find a suitable overlay container.
  // Prefer [data-testid="videoPlayer"], then [data-testid="tweetPhoto"],
  // then the direct parent of the video element.
  const playerEl = video.closest('[data-testid="videoPlayer"]')
                || video.closest('[data-testid="tweetPhoto"]')
                || video.parentElement;
  if (!playerEl) return;

  // Ensure the container can host absolutely-positioned children.
  if (window.getComputedStyle(playerEl).position === 'static') {
    playerEl.style.position = 'relative';
  }

  const btn = document.createElement('button');
  btn.className = 'ezxsave-dl-btn';
  btn.textContent = 'Download';
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    downloadVideo(tweetId, btn);
  });

  playerEl.appendChild(btn);
}

// ── MutationObserver ───────────────────────────

function scanArticles() {
  document.querySelectorAll('article').forEach(article => {
    if (article.querySelector('video')) injectButtonOnArticle(article);
  });
}

const observer = new MutationObserver(() => scanArticles());
observer.observe(document.body, { childList: true, subtree: true });

injectStatusBadge();
setTimeout(scanArticles, 1500);
