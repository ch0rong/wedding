import { CONFIG } from '../config.js?v=202610271551';
import { copyText, escapeHtml, isIOS, isMobile, loadScript, toast } from '../utils/dom.js?v=202610271551';
import { loadKakao } from '../utils/kakao.js?v=202610271551';

const STORE = {
  tmap: isIOS ? 'https://apps.apple.com/kr/app/id431589174' : 'https://play.google.com/store/apps/details?id=com.skt.tmap.ku',
};

// 좌표는 카카오 지오코딩 결과로 갱신될 수 있으므로 복사본을 사용
const place = { ...CONFIG.venue };

/**
 * 모바일: 앱 스킴 실행 → 1.5초 안에 화면이 안 넘어가면(앱 미설치) fallback으로 이동
 * PC: fallback(웹 지도)을 새 창으로 연다
 */
function launch(scheme, fallback) {
  if (!isMobile) {
    if (fallback) window.open(fallback, '_blank', 'noopener');
    else toast('휴대폰에서 이용할 수 있습니다.');
    return;
  }
  const timer = setTimeout(() => {
    if (!document.hidden && fallback) location.href = fallback;
  }, 1500);
  document.addEventListener('visibilitychange', () => document.hidden && clearTimeout(timer), { once: true });
  location.href = scheme;
}

const NAV = {
  naver() {
    const { lat, lng, name, address } = place;
    launch(
      `nmap://route/car?dlat=${lat}&dlng=${lng}&dname=${encodeURIComponent(name)}&appname=${encodeURIComponent(location.hostname || 'wedding')}`,
      place.naverPlaceUrl || `https://map.naver.com/p/search/${encodeURIComponent(address)}`,
    );
  },
  kakaomap() {
    const { lat, lng, name } = place;
    launch(
      `kakaomap://route?ep=${lat},${lng}&by=CAR`,
      `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`,
    );
  },
  tmap() {
    const { lat, lng, name } = place;
    launch(`tmap://route?goalname=${encodeURIComponent(name)}&goalx=${lng}&goaly=${lat}`, isMobile ? STORE.tmap : null);
  },
  async kakaonavi() {
    if (!isMobile) return toast('카카오내비는 휴대폰에서 이용할 수 있습니다.');
    // 카카오 키가 없으면 카카오맵 자동차 길찾기로 대체
    if (!CONFIG.kakaoJsKey) return NAV.kakaomap();
    try {
      const Kakao = await loadKakao();
      Kakao.Navi.start({ name: place.name, x: place.lng, y: place.lat, coordType: 'wgs84' });
    } catch {
      NAV.kakaomap();
    }
  },
};

async function renderKakaoMap(container) {
  await loadScript(`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${CONFIG.kakaoJsKey}&autoload=false&libraries=services`);
  const { maps } = window.kakao;
  await new Promise((resolve) => maps.load(resolve));

  // 주소로 정확한 좌표를 다시 찾아 길안내 버튼에도 반영
  const coords = await new Promise((resolve) => {
    new maps.services.Geocoder().addressSearch(place.address, (result, status) => {
      if (status === maps.services.Status.OK) {
        place.lat = Number(result[0].y);
        place.lng = Number(result[0].x);
      }
      resolve(new maps.LatLng(place.lat, place.lng));
    });
  });

  container.innerHTML = '';
  const map = new maps.Map(container, { center: coords, level: 4 });
  map.addControl(new maps.ZoomControl(), maps.ControlPosition.RIGHT);
  new maps.Marker({ map, position: coords });
  new maps.CustomOverlay({
    map,
    position: coords,
    yAnchor: 2.6,
    content: `<div class="map-label">${escapeHtml(place.name)}</div>`,
  });
  // 화면 크기가 바뀌면 중심 재조정
  new ResizeObserver(() => {
    map.relayout();
    map.setCenter(coords);
  }).observe(container);
}

/** 카카오맵 '지도 퍼가기' (키 발급 불필요). 로더는 index.html에서 미리 불러온다 */
function renderRoughmap(container) {
  const { timestamp, key } = CONFIG.kakaoRoughmap;
  const width = Math.round(container.clientWidth);
  const height = Math.round(width * 0.75);
  container.classList.add('is-roughmap');
  container.innerHTML = `<div id="daumRoughmapContainer${timestamp}" class="root_daum_roughmap root_daum_roughmap_landing"></div>`;
  new window.daum.roughmap.Lander({ timestamp, key, mapWidth: String(width), mapHeight: String(height) }).render();
  return height; // 아래 '길찾기 · 지도 크게 보기' 줄은 잠금 막이 덮지 않도록 지도 높이만 돌려줌
}

const COPY_PILL = '<button type="button" class="copy-pill" data-copy-address>복사하기</button>';

/** 카카오 지도 퍼가기 아래의 '주소' 줄 옆에 복사 버튼을 붙인다 (해당 줄은 비동기로 그려짐) */
function addCopyButtonToRoughmap(container) {
  const attach = () => {
    // 주소 글자(span.txt) 바로 뒤에 붙여야 같은 줄에 나란히 놓인다
    const addr = container.querySelector('.section_address .address .txt');
    if (!addr || addr.querySelector('[data-copy-address]')) return Boolean(addr);
    addr.insertAdjacentHTML('beforeend', COPY_PILL);
    return true;
  };
  if (attach()) return;
  const observer = new MutationObserver(() => attach() && observer.disconnect());
  observer.observe(container, { childList: true, subtree: true });
  setTimeout(() => observer.disconnect(), 10000);
}

/** 카카오 지도 퍼가기를 못 쓸 때 지도 아래에 보여 줄 주소·전화 */
function addressInfoHtml() {
  const v = place;
  return `
    <dl class="map-info">
      <div><dt>주소</dt><dd>${escapeHtml(v.address)} ${COPY_PILL}</dd></div>
      ${v.tel ? `<div><dt>전화</dt><dd><a href="tel:${escapeHtml(v.tel)}">${escapeHtml(v.tel)}</a></dd></div>` : ''}
    </dl>`;
}

/**
 * 스크롤하다가 지도가 손가락에 끌려가지 않도록 기본은 잠금.
 * 투명한 막으로 지도를 덮고, 자물쇠 버튼을 누르면 막을 걷는다.
 */
function setupMapLock(container, shieldHeight) {
  const shield = document.createElement('div');
  shield.className = 'map-shield';
  if (shieldHeight) shield.style.height = `${shieldHeight}px`;
  shield.innerHTML = '<p class="map-shield__msg">자물쇠 버튼을 눌러 잠금을 풀면<br>지도를 움직일 수 있어요</p>';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'map-lock';
  btn.textContent = '🔒';
  btn.setAttribute('aria-label', '지도 잠금 해제');

  let timer;
  shield.addEventListener('click', () => {
    shield.classList.add('show-msg');
    clearTimeout(timer);
    timer = setTimeout(() => shield.classList.remove('show-msg'), 2200);
  });
  btn.addEventListener('click', () => {
    const locked = shield.hidden;
    shield.hidden = !locked;
    btn.textContent = locked ? '🔒' : '🔓';
    btn.setAttribute('aria-label', locked ? '지도 잠금 해제' : '지도 잠그기');
  });
  container.append(shield, btn);
}

function renderEmbedMap(container) {
  // API 키 없이 쓸 수 있는 구글 지도 임베드 (카카오 키 설정 전 임시용)
  container.innerHTML = `
    <iframe title="${escapeHtml(place.name)} 지도" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
      src="https://maps.google.com/maps?q=${encodeURIComponent(place.address)}&z=16&output=embed"></iframe>`;
}

/** Section 4: 오시는 길 */
export function initMap(mount) {
  const v = place;
  mount.innerHTML = `
    <div class="venue">
      <p class="venue__name">${escapeHtml(v.name)}${v.hall ? ` <span>${escapeHtml(v.hall)}</span>` : ''}</p>
    </div>

    <div class="map" id="map" aria-label="웨딩홀 위치 지도"><p class="map__loading">지도를 불러오는 중…</p></div>

    <div class="nav-buttons">
      <button type="button" class="nav-btn" data-nav="naver"><i class="nav-btn__logo nav-btn__logo--naver" aria-hidden="true">N</i>네이버 지도</button>
      <button type="button" class="nav-btn" data-nav="kakaonavi"><i class="nav-btn__logo nav-btn__logo--kakao" aria-hidden="true">K</i>카카오내비</button>
      <button type="button" class="nav-btn" data-nav="tmap"><i class="nav-btn__logo nav-btn__logo--tmap" aria-hidden="true">T</i>티맵</button>
    </div>

    <dl class="transport">
      ${v.transport.map((t) => `
        <div class="transport__item"><dt>${escapeHtml(t.title)}</dt><dd>${(t.lines || [t.body]).map(escapeHtml).join('<br>')}</dd></div>`).join('')}
    </dl>`;

  // 주소 복사 버튼 (지도 아래 주소 옆, 지도 종류와 상관없이 위임으로 처리)
  mount.addEventListener('click', (e) => {
    if (e.target.closest('[data-copy-address]')) copyText(v.address, '주소가 복사되었습니다.');
  });
  mount.querySelectorAll('[data-nav]').forEach((btn) => btn.addEventListener('click', () => NAV[btn.dataset.nav]()));

  // 지도 우선순위: 카카오 지도 퍼가기 → 카카오 JS 지도 → 구글 지도 임베드
  const container = mount.querySelector('#map');
  const rough = CONFIG.kakaoRoughmap || {};
  if (rough.timestamp && rough.key && window.daum?.roughmap?.Lander) {
    setupMapLock(container, renderRoughmap(container));
    addCopyButtonToRoughmap(container);
  } else {
    // 카카오 지도 퍼가기가 아니면 주소·전화 줄이 없으므로 지도 아래에 직접 표시
    container.insertAdjacentHTML('afterend', addressInfoHtml());
    if (CONFIG.kakaoJsKey) {
      renderKakaoMap(container)
        .catch(() => renderEmbedMap(container))
        .finally(() => setupMapLock(container));
    } else {
      renderEmbedMap(container);
      setupMapLock(container);
    }
  }
}
