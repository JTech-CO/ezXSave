/* ezXSave v3 – Background Service Worker */

function generateToken(tweetId) {
  return ((Number(tweetId) / 1e15) * Math.PI)
    .toString(36)
    .replace(/(0+|\.)/g, '');
}

async function fetchTweetData(tweetId) {
  const token = generateToken(tweetId);
  const url = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&token=${token}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Syndication API ${res.status}`);
  const data = await res.json();
  if (!data || data.error) throw new Error(data?.error || 'Empty response');
  return data;
}

function extractBestMp4(tweetData) {
  const media = tweetData.mediaDetails || [];
  let bestUrl = null;
  let bestBitrate = -1;

  for (const item of media) {
    if (item.type !== 'video' && item.type !== 'animated_gif') continue;
    for (const v of item.video_info?.variants || []) {
      if (v.content_type !== 'video/mp4') continue;
      const bitrate = v.bitrate ?? 0;
      if (bitrate > bestBitrate) {
        bestBitrate = bitrate;
        bestUrl = v.url;
      }
    }
  }

  if (!bestUrl && tweetData.quoted_tweet) {
    return extractBestMp4(tweetData.quoted_tweet);
  }

  return bestUrl;
}

async function handleFetchVideo(tweetId) {
  const data = await fetchTweetData(tweetId);
  const mp4Url = extractBestMp4(data);
  if (!mp4Url) return { error: 'no_video' };
  const screenName = data.user?.screen_name || 'unknown';
  return { url: mp4Url, screenName, tweetId };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'fetchVideo') {
    handleFetchVideo(msg.tweetId)
      .then(sendResponse)
      .catch(err => sendResponse({ error: err.message }));
    return true;
  }

  if (msg.action === 'downloadMp4') {
    chrome.downloads.download({
      url: msg.url,
      filename: msg.filename || `x-video-${Date.now()}.mp4`,
      saveAs: true
    });
  }
});
