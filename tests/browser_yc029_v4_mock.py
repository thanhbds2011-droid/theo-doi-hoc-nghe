"""YC-HN-029 V4: UI-only check with production renderer and CSS, without backend."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import re

root = Path(__file__).resolve().parents[1]
app = (root / 'public/app.js').read_text()
css = (root / 'public/styles.css').read_text()
start = app.index('function renderCurrentUser(){')
end = app.index('function activateSession(', start)
actual_renderer = app[start:end]
assert 'allowed(' not in actual_renderer and 'fetch(' not in actual_renderer

html = f'''<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8"><style>{css}</style></head>
<body><div class="layout"><aside class="sidebar" id="sidebar"><div class="brand">Theo dõi học nghề</div></aside>
<div class="main-shell"><header class="topbar"><button id="menu-toggle" class="btn icon-button menu-button">☰</button>
<div class="topbar-brand"><b>Theo dõi học nghề</b></div>
<div class="topbar-right"><div id="current-user" class="user-box"></div><button id="logout" class="btn btn-light">Đăng xuất</button></div>
</header></div></div></body></html>'''

cases = [
 ('ADMIN', '', 'admin', 'Quản trị viên'),
 ('NHAN_VIEN', 'Trưởng phòng Đào tạo', 'manager', 'Trưởng phòng Đào tạo'),
 ('NHAN_VIEN', 'Phó Phòng DVVL-HTĐT', 'deputy', 'Phó Phòng DVVL-HTĐT'),
 ('NHAN_VIEN', 'Phó Trưởng phòng Đào tạo', 'deputy', 'Phó Trưởng phòng Đào tạo'),
 ('NHAN_VIEN', 'Nhân viên Phòng A', 'staff', 'Nhân viên Phòng A'),
 ('NHAN_VIEN', '', 'staff', 'Nhân viên'),
 ('CO_SO_DAO_TAO', '', 'school', 'Cơ sở đào tạo: Trường C'),
]
with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path='/usr/bin/chromium', args=['--no-sandbox', '--disable-dev-shm-usage'])
    page = browser.new_page(viewport={'width': 1765, 'height': 880}, device_scale_factor=1)
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.set_content(html)
    page.evaluate('''src => {
      window.state = {user: null};
      window.$ = s => document.querySelector(s);
      window.esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      window.lookup = () => 'Trường C';
      const script = document.createElement('script');script.textContent = src;document.body.appendChild(script);
    }''', actual_renderer)

    for role, title, css_role, expected in cases:
        page.evaluate('''({role, title}) => {
          state.user = {VAI_TRO: role, HO_TEN: 'Nguyễn Văn A', EMAIL: 'a@example.test', TRUONG_ID: 'S1', CHUC_DANH_HIEN_THI: title};
          renderCurrentUser();
        }''', {'role': role, 'title': title})
        badge = page.locator('#current-user .user-role-badge')
        assert badge.inner_text() == expected, (role, title, badge.inner_text())
        assert 'user-role-badge--' + css_role in badge.get_attribute('class')
        assert page.locator('#current-user .user-display-name').inner_text() == 'Nguyễn Văn A'
        assert page.locator('#logout').inner_text() == 'Đăng xuất'
        if role == 'NHAN_VIEN' and title.startswith('Trưởng phòng'):
            page.screenshot(path='/mnt/data/YC-HN-029_V4_xem_truoc.png', clip={'x':1200,'y':0,'width':565,'height':90})
    # Dữ liệu tùy nhập phải không thể chèn thẻ vào header.
    page.evaluate('''() => {state.user.VAI_TRO = 'NHAN_VIEN'; state.user.CHUC_DANH_HIEN_THI = '<img src=x onerror=alert(1)> Trưởng phòng'; renderCurrentUser()}''')
    assert page.locator('#current-user img').count() == 0
    assert page.locator('#current-user .user-role-badge').inner_text().startswith('<img')
    assert not errors, errors

    # Chức danh dài không đè lên nút Đăng xuất, kể cả trên laptop hẹp.
    page.evaluate('''() => {state.user.CHUC_DANH_HIEN_THI = 'Phó Phòng ' + 'Đào tạo và hướng nghiệp '.repeat(5); renderCurrentUser()}''')
    for width in [1765, 1024, 768, 650]:
        page.set_viewport_size({'width': width, 'height': 900})
        metric = page.evaluate('''() => {
          const badge=document.querySelector('#current-user .user-role-badge').getBoundingClientRect();
          const logout=document.querySelector('#logout').getBoundingClientRect();
          const header=document.querySelector('.topbar').getBoundingClientRect();
          return {badgeRight:badge.right, logoutLeft:logout.left, headerRight:header.right,
             docWidth:document.documentElement.scrollWidth, windowWidth:innerWidth, badgeHeight:badge.height};
        }''')
        assert metric['badgeRight'] <= metric['logoutLeft'] + 1, (width, metric)
        assert metric['logoutLeft'] >= 0 and metric['headerRight'] <= width + 1, (width, metric)
        assert metric['docWidth'] <= metric['windowWidth'] + 1, (width, metric)
    for width in [600, 390]:
        page.set_viewport_size({'width': width, 'height': 900})
        assert page.locator('#current-user').is_hidden(), width  # giữ hành vi mobile gốc
        assert page.locator('#logout').is_visible(), width
    browser.close()
print('YC-HN-029_V4_BROWSER_OK: 7 chức danh, dữ liệu nhập an toàn, không tràn 4 cỡ màn hình, giữ hành vi mobile')
