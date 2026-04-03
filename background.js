/* ──────────────────────────────────────────────
   ezXSave v2 – Background Service Worker
   Twitter Syndication API → direct MP4 download
   ────────────────────────────────────────────── */

// ── Context Menus ──────────────────────────────

function createMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'open-x-video',
      title: 'Open Video in New Tab',
      contexts: ['all'],
      documentUrlPatterns: ['*://*.x.com/*', '*://x.com/*', '*://*.twitter.com/*', '*://twitter.com/*']
    });
    chrome.contextMenus.create({
      id: 'download-x-video',
      title: 'Save Video (Best Quality)',
      contexts: ['all'],
      documentUrlPatterns: ['*://*.x.com/*', '*://x.com/*', '*://*.twitter.com/*', '*://twitter.com/*']
    });
  });
}

chrome.runtime.onInstalled.addListener(createMenus);
chrome.runtime.onStartup.addListener(createMenus);

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!tab?.id) return;
  chrome.tabs.sendMessage(tab.id, { action: info.menuItemId });
});

// ── Syndication API helpers ────────────────────

/**
 * react-tweet 방식의 토큰 생성
 * @see https://github.com/vercel/react-tweet
 */
function generateToken(tweetId) {
  return ((Number(tweetId) / 1e15) * Math.PI)
    .toString(36)
    .replace(/(0+|\.)/g, '');
}

/**
 * Syndication API로 트윗 데이터를 가져옴
 */
async function fetchTweetData(tweetId) {
  const token = generateToken(tweetId);
  const url = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=${token}`;

  const res = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });

  if (!res.ok) throw new Error(`Syndication API ${res.status}`);
  const data = await res.json();
  if (!data || data.error) throw new Error(data?.error || 'Empty response');
  return data;
}

/**
 * 트윗 데이터에서 최고 화질 MP4 URL을 추출
 */
function extractBestMp4(tweetData) {
  // mediaDetails 안에 video_info.variants 가 있음
  const media = tweetData.mediaDetails || [];
  let bestUrl = null;
  let bestBitrate = -1;

  for (const item of media) {
    if (item.type !== 'video' && item.type !== 'animated_gif') continue;
    const variants = item.video_info?.variants || [];
    for (const v of variants) {
      if (v.content_type !== 'video/mp4') continue;
      const bitrate = v.bitrate ?? 0;
      if (bitrate > bestBitrate) {
        bestBitrate = bitrate;
        bestUrl = v.url;
      }
    }
  }

  // 인용 트윗(quoted_tweet)에 영상이 있을 수도 있음
  if (!bestUrl && tweetData.quoted_tweet) {
    return extractBestMp4(tweetData.quoted_tweet);
  }

  return bestUrl;
}

// ── Message handler (content script ↔ background) ──

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'fetchVideo') {
    handleFetchVideo(msg.tweetId)
      .then(sendResponse)
      .catch(err => sendResponse({ error: err.message }));
    return true; // async response
  }

  if (msg.action === 'downloadMp4') {
    chrome.downloads.download({
      url: msg.url,
      filename: msg.filename || `x-video-${Date.now()}.mp4`,
      saveAs: true
    });
  }
});

async function handleFetchVideo(tweetId) {
  const data = await fetchTweetData(tweetId);
  const mp4Url = extractBestMp4(data);
  if (!mp4Url) return { error: 'no_video' };

  // 유저명 추출 (파일명용)
  const screenName = data.user?.screen_name || 'unknown';
  return { url: mp4Url, screenName, tweetId };
}