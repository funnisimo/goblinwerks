

function always(fn, n=1000) {
  for(let i = 0; i < n; ++i) {
    fn();
  }
}

async function alwaysAsync(fn, n=1000) {
  for(let i = 0; i < n; ++i) {
    await fn();
  }
}

function extractBufferText(buffer, x, y, width) {
  let text = '';
  const right = Math.min(x + (width || buffer.width), buffer.width);
  for(let i = x; i < right; ++i) {
    const ch = buffer[i][y].ch;
    text += ch;
  }
  return text.trim();
}

module.exports = {
  always,
  alwaysAsync,
  extractBufferText,
};
