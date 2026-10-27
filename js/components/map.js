import { CONFIG } from '../config.js';
import { copyText, escapeHtml, isIOS, isMobile, loadScript, toast } from '../utils/dom.js';
import { loadKakao } from '../utils/kakao.js';

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
      `https://map.naver.com/p/search/${encodeURIComponent(address)}`,
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
  // 탭 전환 등으로 크기가 바뀌면 중심 재조정
  new ResizeObserver(() => {
    map.relayout();
    map.setCenter(coords);
  }).observe(container);
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
      <p class="venue__addr">
        ${escapeHtml(v.address)}
        <button type="button" class="text-btn" data-action="copy">주소 복사</button>
      </p>
      ${v.tel ? `<a class="venue__tel" href="tel:${escapeHtml(v.tel)}">${escapeHtml(v.tel)}</a>` : ''}
    </div>

    <div class="map" id="map" aria-label="웨딩홀 위치 지도"><p class="map__loading">지도를 불러오는 중…</p></div>

    <div class="nav-buttons">
      <button type="button" class="nav-btn" data-nav="naver"><i class="nav-btn__logo nav-btn__logo--naver" aria-hidden="true">N</i>네이버 지도</button>
      <button type="button" class="nav-btn" data-nav="kakaonavi"><i class="nav-btn__logo nav-btn__logo--kakao" aria-hidden="true">K</i>카카오내비</button>
      <button type="button" class="nav-btn" data-nav="tmap"><i class="nav-btn__logo nav-btn__logo--tmap" aria-hidden="true">T</i>티맵</button>
    </div>

    <dl class="transport">
      ${v.transport.map((t) => `
        <div class="transport__item"><dt>${escapeHtml(t.title)}</dt><dd>${escapeHtml(t.body)}</dd></div>`).join('')}
    </dl>`;

  mount.querySelector('[data-action=copy]').addEventListener('click', () => copyText(v.address, '주소가 복사되었습니다.'));
  mount.querySelectorAll('[data-nav]').forEach((btn) => btn.addEventListener('click', () => NAV[btn.dataset.nav]()));

  const container = mount.querySelector('#map');
  if (CONFIG.kakaoJsKey) {
    renderKakaoMap(container).catch(() => renderEmbedMap(container));
  } else {
    renderEmbedMap(container);
  }
}
