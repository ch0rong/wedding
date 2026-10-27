import { CONFIG } from '../config.js?v=202610271533';
import { copyText, escapeHtml } from '../utils/dom.js?v=202610271533';
import { loadKakao } from '../utils/kakao.js?v=202610271533';

/** 공유 링크에서 #해시는 빼고, 계좌용 ?key= 는 유지 */
const shareUrl = () => location.href.split('#')[0];

async function shareKakao() {
  const { title, description, image } = CONFIG.share;
  const url = shareUrl();
  try {
    const Kakao = await loadKakao();
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: { title, description, imageUrl: image, link: { mobileWebUrl: url, webUrl: url } },
      buttons: [{ title: '청첩장 보기', link: { mobileWebUrl: url, webUrl: url } }],
    });
  } catch {
    // 카카오 키가 없거나 실패하면 기기 기본 공유창 → 그것도 없으면 링크 복사
    if (navigator.share) {
      navigator.share({ title, text: description, url }).catch(() => {});
    } else {
      copyText(url, '링크가 복사되었습니다. 카카오톡에 붙여넣어 공유해 주세요.');
    }
  }
}

/** Section 8: 카카오톡 공유 + 링크 복사 + 저작권 문구 */
export function initFooter(mount) {
  mount.innerHTML = `
    <div class="share">
      <button type="button" class="btn btn--kakao" data-share="kakao">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4C7 4 3 7.1 3 11c0 2.5 1.7 4.7 4.2 5.9l-.9 3.3c-.1.3.3.6.6.4l3.9-2.6c.4 0 .8.1 1.2.1 5 0 9-3.1 9-7s-4-7.1-9-7.1z" fill="currentColor"/></svg>
        카카오톡으로 공유하기
      </button>
      <button type="button" class="btn btn--line" data-share="link">링크 주소 복사</button>
    </div>
    <p class="copyright">${escapeHtml(CONFIG.copyright)}</p>`;

  mount.querySelector('[data-share=kakao]').addEventListener('click', shareKakao);
  mount.querySelector('[data-share=link]').addEventListener('click', () => copyText(shareUrl(), '청첩장 링크가 복사되었습니다.'));
}
