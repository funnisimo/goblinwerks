

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

module.exports = {
  always,
  alwaysAsync,
};
