/**
 * 캐시 무효화: 배포할 때마다 실행하면 JS/CSS 주소 뒤의 ?v= 값을 새로 바꾼다.
 * 브라우저(특히 카카오톡 인앱, 웨일)가 예전 파일을 붙잡고 있어도 새 파일을 받게 하기 위함.
 *
 *   node tools/bump-version.mjs
 *
 * 같은 모듈이 서로 다른 ?v= 로 두 번 로드되지 않도록 모든 import를 한꺼번에 같은 값으로 바꾼다.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const version = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12); // 예: 202610281530

function jsFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? jsFiles(p) : p.endsWith('.js') ? [p] : [];
  });
}

function rewrite(file, pattern, replacer) {
  const before = readFileSync(file, 'utf8');
  const after = before.replace(pattern, replacer);
  if (after !== before) writeFileSync(file, after);
}

// 1) 모듈 안의 상대 경로 import: from './x.js' → from './x.js?v=…'
const IMPORT = /(from\s+['"])(\.{1,2}\/[^'"?]+\.js)(\?v=[^'"]*)?(['"])/g;
for (const file of jsFiles(join(root, 'js'))) {
  rewrite(file, IMPORT, (_, a, path, __, b) => `${a}${path}?v=${version}${b}`);
}

// 2) index.html의 진입 스크립트와 스타일시트
const ASSET = /((?:src|href)=")((?:js\/app\.js)|(?:css\/style\.css))(\?v=[^"]*)?(")/g;
rewrite(join(root, 'index.html'), ASSET, (_, a, path, __, b) => `${a}${path}?v=${version}${b}`);

console.log(`version → ${version}`);
