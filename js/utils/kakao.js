import { CONFIG } from '../config.js?v=202610271551';
import { loadScript } from './dom.js?v=202610271551';

const KAKAO_SDK = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js';

/** 카카오 JS SDK(공유, 내비) 로드 + 초기화. 키가 없으면 reject */
export async function loadKakao() {
  if (!CONFIG.kakaoJsKey) throw new Error('카카오 JavaScript 키가 설정되지 않았습니다.');
  await loadScript(KAKAO_SDK);
  if (!window.Kakao.isInitialized()) window.Kakao.init(CONFIG.kakaoJsKey);
  return window.Kakao;
}
