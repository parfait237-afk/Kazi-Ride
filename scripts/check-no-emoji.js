const fs = require('fs');
const path = require('path');

const sourceRoot = path.resolve(__dirname, '..', 'src');
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.css']);
const emojiPattern = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u;
const violations = [];

function inspect(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) inspect(target);
    else if (extensions.has(path.extname(entry.name))) {
      const lines = fs.readFileSync(target, 'utf8').split(/\r?\n/);
      lines.forEach((line, index) => {
        if (emojiPattern.test(line)) violations.push(`${path.relative(sourceRoot, target)}:${index + 1}`);
      });
    }
  }
}

inspect(sourceRoot);
if (violations.length) {
  console.error(`Emoji interdits détectés :\n${violations.join('\n')}`);
  process.exit(1);
}
console.log('Vérification réussie : aucun emoji dans src.');
