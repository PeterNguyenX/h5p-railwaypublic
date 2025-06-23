// Script to check HLS assets for all videos in uploads/hls
const fs = require('fs');
const path = require('path');

const hlsRoot = path.join(__dirname, '../uploads/hls');

function checkHLSDir(dir) {
  const manifest = path.join(dir, 'stream.m3u8');
  const exists = fs.existsSync(manifest);
  if (!exists) {
    return { ok: false, reason: 'Missing stream.m3u8' };
  }
  const content = fs.readFileSync(manifest, 'utf8');
  if (!content.includes('#EXTM3U')) {
    return { ok: false, reason: 'Invalid m3u8 content' };
  }
  const segments = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));
  if (segments.length === 0) {
    return { ok: false, reason: 'No .ts segments found' };
  }
  return { ok: true, segments: segments.length };
}

function main() {
  if (!fs.existsSync(hlsRoot)) {
    console.error('No HLS directory found.');
    process.exit(1);
  }
  const videoDirs = fs.readdirSync(hlsRoot).filter(f => fs.statSync(path.join(hlsRoot, f)).isDirectory());
  let allOk = true;
  for (const dir of videoDirs) {
    const fullDir = path.join(hlsRoot, dir);
    const result = checkHLSDir(fullDir);
    if (result.ok) {
      console.log(`[OK] ${dir}: ${result.segments} segments`);
    } else {
      allOk = false;
      console.error(`[ERROR] ${dir}: ${result.reason}`);
    }
  }
  if (allOk) {
    console.log('All HLS assets are healthy!');
  } else {
    process.exit(2);
  }
}

main();
