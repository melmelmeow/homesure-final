// ─────────────────────────────────────────────────────────────────────────────
//  Kasafide – Topbar Component
//  Usage:
//    <div id="hs-topbar"></div>
//    <script src="../components/topbar.js"></script>
//    <script>KasafideTopbar.init({ placeholder: 'Search properties...' })</script>
// ─────────────────────────────────────────────────────────────────────────────
(function (global) {
  'use strict';

  const CSS = `
    .hs-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 26px;
      background: var(--surface-soft);
      border-bottom: 1px solid rgb(var(--shade-rgb) / 0.2);
      gap: 14px;
      position: relative;
      z-index: 200;
    }

    /* ── Search ── */
    .hs-topbar-search {
      flex: 1;
      min-width: 0;
      max-width: 400px;
      position: relative;
    }
    .hs-topbar-search svg {
      position: absolute; left: 13px; top: 50%;
      transform: translateY(-50%);
      color: rgb(var(--wash-rgb) / 0.35);
      width: 14px; height: 14px;
      pointer-events: none;
      transition: color 0.2s;
    }
    .hs-topbar-search:focus-within svg { color: var(--primary); }

    .hs-topbar-input {
      width: 100%;
      background: rgb(var(--shade-rgb) / 0.2);
      border: 1px solid rgb(var(--wash-rgb) / 0.1);
      border-radius: 10px;
      padding: 9px 13px 9px 37px;
      color: var(--text);
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s, background 0.2s;
    }
    .hs-topbar-input::placeholder { color: rgb(var(--wash-rgb) / 0.35); }
    .hs-topbar-input::-webkit-search-cancel-button { -webkit-appearance: none; display: none; }
    .hs-topbar-input:-webkit-autofill,
    .hs-topbar-input:-webkit-autofill:hover,
    .hs-topbar-input:-webkit-autofill:focus {
      -webkit-box-shadow: 0 0 0 1000px var(--surface) inset !important;
      -webkit-text-fill-color: var(--text) !important;
      caret-color: var(--text);
    }
    [data-theme="light"] .hs-topbar-input:-webkit-autofill,
    [data-theme="light"] .hs-topbar-input:-webkit-autofill:hover,
    [data-theme="light"] .hs-topbar-input:-webkit-autofill:focus {
      -webkit-box-shadow: 0 0 0 1000px var(--surface) inset !important;
      -webkit-text-fill-color: var(--text) !important;
      caret-color: var(--text);
    }
    .hs-topbar-input:focus {
      border-color: rgb(var(--primary-rgb) / 0.55);
      background: rgb(var(--shade-rgb) / 0.3);
    }

    /* ── Right side ── */
    .hs-topbar-right {
      /* margin-left: auto pins this to the right regardless of how many siblings are actually
         rendered. Relying on .hs-topbar's justify-content: space-between alone breaks once the
         hamburger is hidden (mobile) and the search box is absent (no onSearch) — with only one
         visible flex child, space-between places it at the START of the row instead of the end. */
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* ── Notification bell ── */
    .hs-notif-btn {
      position: relative;
      width: 36px; height: 36px;
      border-radius: 50%;
      background: rgb(var(--wash-rgb) / 0.07);
      border: 1px solid rgb(var(--wash-rgb) / 0.1);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: background 0.2s, transform 0.18s;
      flex-shrink: 0;
    }
    .hs-notif-btn:hover {
      background: rgb(var(--wash-rgb) / 0.13);
      transform: scale(1.07);
    }
    .hs-notif-btn svg {
      width: 16px; height: 16px;
      color: rgb(var(--wash-rgb) / 0.7);
      transition: color 0.2s;
    }
    .hs-notif-btn:hover svg { color: var(--text); }

    .hs-notif-dot {
      position: absolute;
      top: 6px; right: 6px;
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--primary);
      border: 2px solid var(--surface-soft);
      animation: hs-notif-pulse 2s ease-in-out infinite;
    }
    @keyframes hs-notif-pulse {
      0%, 100% { transform: scale(1);   opacity: 1; }
      50%       { transform: scale(1.3); opacity: 0.7; }
    }

    /* ── Notification panel ── */
    .hs-notif-wrap {
      position: relative; flex-shrink: 0;
    }
    .hs-notif-panel {
      display: none; position: absolute; top: calc(100% + 10px); right: 0; z-index: 9999;
      width: 330px; background: var(--surface-soft); border: 1px solid rgb(var(--wash-rgb) / 0.08);
      border-radius: 16px; box-shadow: 0 16px 48px rgb(var(--shade-rgb) / min(0.5, var(--shadow-cap, 1)));
      overflow: hidden;
      animation: hs-panel-in 0.18s ease both;
    }
    @keyframes hs-panel-in {
      from { opacity: 0; transform: translateY(-6px) scale(0.98); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    .hs-notif-panel.open { display: block; }

    .hs-notif-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px 10px;
    }
    .hs-notif-title { font-size: 15px; font-weight: 800; color: var(--text); font-family: 'Plus Jakarta Sans', sans-serif; }
    .hs-notif-mark-read {
      font-size: 11.5px; font-weight: 600; color: var(--primary);
      background: none; border: none; cursor: pointer;
      font-family: 'Plus Jakarta Sans', sans-serif; padding: 0;
      transition: opacity 0.15s;
    }
    .hs-notif-mark-read:hover { opacity: 0.7; }

    .hs-notif-tabs {
      display: flex; gap: 4px; padding: 0 16px 10px;
    }
    .hs-notif-tab {
      padding: 5px 14px; border-radius: 20px; font-size: 12.5px; font-weight: 600;
      font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; border: none;
      background: transparent; color: rgb(var(--wash-rgb) / 0.45);
      transition: background 0.15s, color 0.15s;
    }
    .hs-notif-tab.active { background: var(--primary); color: var(--on-primary); }
    .hs-notif-tab:not(.active):hover { background: rgb(var(--wash-rgb) / 0.07); color: rgb(var(--wash-rgb) / 0.8); }

    .hs-notif-body { max-height: 300px; overflow-y: auto; }
    .hs-notif-body::-webkit-scrollbar { width: 3px; }
    .hs-notif-body::-webkit-scrollbar-thumb { background: rgb(var(--wash-rgb) / 0.1); border-radius: 99px; }

    .hs-notif-section-label {
      padding: 8px 16px 4px;
      font-size: 11px; font-weight: 700; color: rgb(var(--wash-rgb) / 0.35);
      text-transform: uppercase; letter-spacing: 0.06em;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .hs-notif-item {
      display: flex; align-items: flex-start; gap: 11px;
      padding: 11px 16px; cursor: pointer;
      transition: background 0.15s;
      position: relative;
    }
    .hs-notif-item:hover { background: rgb(var(--wash-rgb) / 0.05); }
    .hs-notif-item.unread { background: rgb(var(--primary-rgb) / 0.06); }
    .hs-notif-item.unread::before {
      content: ''; position: absolute; left: 6px; top: 50%; transform: translateY(-50%);
      width: 5px; height: 5px; border-radius: 50%; background: var(--primary);
    }
    .hs-notif-avatar {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      background: rgb(var(--primary-rgb) / 0.15); display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: var(--primary);
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .hs-notif-avatar.system { background: rgb(var(--wash-rgb) / 0.07); color: rgb(var(--wash-rgb) / 0.5); }
    .hs-notif-avatar svg { width: 16px; height: 16px; }
    .hs-notif-content { flex: 1; min-width: 0; }
    .hs-notif-msg {
      font-size: 12.5px; color: var(--text-muted); line-height: 1.45;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .hs-notif-msg strong { color: var(--text); font-weight: 600; }
    .hs-notif-time {
      font-size: 11px; color: rgb(var(--wash-rgb) / 0.3); margin-top: 3px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .hs-notif-divider { height: 1px; background: rgb(var(--wash-rgb) / 0.06); margin: 2px 0; }

    .hs-notif-footer {
      padding: 10px 16px 14px;
      border-top: 1px solid rgb(var(--wash-rgb) / 0.06);
    }
    .hs-notif-see-all-btn {
      width: 100%; padding: 10px; border-radius: 9px;
      background: rgb(var(--primary-rgb) / 0.1); border: 1px solid rgb(var(--primary-rgb) / 0.2);
      color: var(--primary); font-size: 13px; font-weight: 700;
      font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
      display: flex; align-items: center; justify-content: center; gap: 6px;
    }
    .hs-notif-see-all-btn:hover { background: rgb(var(--primary-rgb) / 0.18); border-color: rgb(var(--primary-rgb) / 0.4); }
    .hs-notif-see-all-btn svg { width: 14px; height: 14px; }

    /* ── Profile dropdown ── */
    .hs-profile-wrap {
      position: relative; flex-shrink: 0;
    }
    .hs-topbar-avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: rgb(var(--primary-rgb) / 0.15);
      color: var(--primary);
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
      cursor: pointer;
      border: 2px solid rgb(var(--primary-rgb) / 0.4);
      font-family: 'Plus Jakarta Sans', sans-serif;
      transition: border-color 0.2s, transform 0.18s;
      user-select: none;
    }
    .hs-topbar-avatar:hover {
      border-color: var(--primary);
      transform: scale(1.07);
    }

    .hs-profile-dropdown {
      display: none; position: absolute; top: calc(100% + 10px); right: 0; z-index: 9999;
      width: 220px; background: var(--surface-soft); border: 1px solid rgb(var(--wash-rgb) / 0.08);
      border-radius: 14px; box-shadow: 0 16px 48px rgb(var(--shade-rgb) / min(0.5, var(--shadow-cap, 1)));
      overflow: hidden;
      animation: hs-panel-in 0.18s ease both;
    }
    .hs-profile-dropdown.open { display: block; }

    .hs-profile-head {
      padding: 14px 16px 12px;
      border-bottom: 1px solid rgb(var(--wash-rgb) / 0.06);
    }
    .hs-profile-head-name {
      font-size: 13.5px; font-weight: 700; color: var(--text);
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .hs-profile-head-role {
      font-size: 11px; color: var(--primary); font-weight: 600; margin-top: 2px;
      font-family: 'Plus Jakarta Sans', sans-serif; text-transform: capitalize;
    }

    .hs-profile-menu { padding: 6px 0; }
    .hs-profile-menu-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 16px; cursor: pointer;
      font-size: 13px; font-weight: 500; color: rgb(var(--wash-rgb) / 0.7);
      font-family: 'Plus Jakarta Sans', sans-serif;
      border: none; background: none; width: 100%; text-align: left;
      transition: background 0.15s, color 0.15s;
    }
    .hs-profile-menu-item svg { width: 14px; height: 14px; flex-shrink: 0; }
    .hs-profile-menu-item:hover { background: rgb(var(--wash-rgb) / 0.06); color: var(--text); }
    .hs-profile-menu-item.danger { color: rgb(var(--danger-rgb) / 0.8); }
    .hs-profile-menu-item.danger:hover { background: rgb(var(--danger-rgb) / 0.1); color: var(--danger); }
    .hs-profile-menu-item.reverify { color: var(--primary); }
    .hs-profile-menu-item.reverify:hover { background: rgb(var(--primary-rgb) / 0.08); }
    .hs-profile-divider { height: 1px; background: rgb(var(--wash-rgb) / 0.06); margin: 4px 0; }

    /* ── Reverification Modal ── */
    .hs-reverify-backdrop {
      display: none; position: fixed; inset: 0;
      background: rgb(var(--shade-rgb) / var(--overlay-a, 0.65)); z-index: 10000;
      align-items: flex-start; justify-content: center;
      backdrop-filter: blur(4px);
      overflow-y: auto; padding: 40px 20px;
    }
    .hs-reverify-backdrop.open { display: flex; }

    .hs-reverify-modal {
      background: var(--surface); border: 1px solid rgb(var(--wash-rgb) / 0.08);
      border-radius: 20px; width: 100%; max-width: 460px;
      margin: auto;
      box-shadow: 0 24px 64px rgb(var(--shade-rgb) / min(0.6, var(--shadow-cap, 1)));
      animation: hs-panel-in 0.22s ease both;
      position: relative;
    }

    .hs-rv-header {
      padding: 22px 24px 0;
      display: flex; align-items: flex-start; justify-content: space-between;
    }
    .hs-rv-icon {
      width: 52px; height: 52px; border-radius: 14px;
      background: rgb(var(--primary-rgb) / 0.12); border: 1px solid rgb(var(--primary-rgb) / 0.25);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .hs-rv-icon svg { width: 26px; height: 26px; color: var(--primary); }
    .hs-rv-close {
      width: 30px; height: 30px; border-radius: 8px; border: none;
      background: rgb(var(--wash-rgb) / 0.06); color: rgb(var(--wash-rgb) / 0.5);
      cursor: pointer; font-size: 18px; line-height: 1;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .hs-rv-close:hover { background: rgb(var(--wash-rgb) / 0.12); color: var(--text); }

    .hs-rv-body { padding: 16px 24px 24px; }
    .hs-rv-title { font-size: 18px; font-weight: 800; color: var(--text); margin-bottom: 6px; font-family: 'Plus Jakarta Sans', sans-serif; }
    .hs-rv-sub { font-size: 13px; color: rgb(var(--wash-rgb) / 0.5); line-height: 1.6; margin-bottom: 22px; font-family: 'Plus Jakarta Sans', sans-serif; }

    .hs-rv-steps {
      display: flex; gap: 6px; margin-bottom: 6px; align-items: center;
    }
    .hs-rv-step-dot {
      flex: 1; height: 4px; border-radius: 99px; background: rgb(var(--wash-rgb) / 0.1);
      transition: background 0.3s;
    }
    .hs-rv-step-dot.done { background: var(--primary); }

    .hs-rv-step-label {
      font-size: 10.5px; font-weight: 700; color: rgb(var(--wash-rgb) / 0.35);
      text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .hs-rv-upload {
      border: 1.5px dashed rgb(var(--wash-rgb) / 0.14); border-radius: 14px;
      padding: 32px 20px; text-align: center; margin-bottom: 14px;
      cursor: pointer; transition: border-color 0.2s, background 0.2s;
      background: rgb(var(--wash-rgb) / 0.02); display: block;
    }
    .hs-rv-upload:hover { border-color: rgb(var(--primary-rgb) / 0.5); background: rgb(var(--primary-rgb) / 0.05); }
    .hs-rv-upload.has-file { border-color: var(--primary); background: rgb(var(--primary-rgb) / 0.07); }
    .hs-rv-upload input { display: none; }
    .hs-rv-upload-icon {
      width: 52px; height: 52px; border-radius: 14px;
      background: rgb(var(--wash-rgb) / 0.07); margin: 0 auto 14px;
      display: flex; align-items: center; justify-content: center;
    }
    .hs-rv-upload-icon svg { width: 24px; height: 24px; color: rgb(var(--wash-rgb) / 0.45); }
    .hs-rv-upload.has-file .hs-rv-upload-icon { background: rgb(var(--primary-rgb) / 0.12); }
    .hs-rv-upload.has-file .hs-rv-upload-icon svg { color: var(--primary); }
    .hs-rv-upload-label { font-size: 13.5px; font-weight: 700; color: rgb(var(--wash-rgb) / 0.8); font-family: 'Plus Jakarta Sans', sans-serif; margin-bottom: 4px; }
    .hs-rv-upload-hint { font-size: 11.5px; color: rgb(var(--wash-rgb) / 0.3); font-family: 'Plus Jakarta Sans', sans-serif; line-height: 1.5; }
    .hs-rv-upload-filename {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 12px; color: var(--primary); font-weight: 600; margin-top: 10px;
      background: rgb(var(--primary-rgb) / 0.1); padding: 4px 10px; border-radius: 20px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .hs-rv-btn {
      width: 100%; padding: 13px; border-radius: 10px;
      background: var(--primary); border: none; color: var(--on-primary);
      font-size: 14px; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif;
      cursor: pointer; margin-top: 6px; transition: background 0.2s, opacity 0.2s;
      letter-spacing: 0.01em;
    }
    .hs-rv-btn:hover:not(:disabled) { background: var(--primary-hover); }
    .hs-rv-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Success state */
    .hs-rv-success { display: none; padding: 36px 24px; text-align: center; }
    .hs-rv-success.show { display: block; }
    .hs-rv-success-icon {
      width: 72px; height: 72px; border-radius: 50%;
      background: rgb(var(--primary-rgb) / 0.12); border: 2px solid rgb(var(--primary-rgb) / 0.3);
      display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
    }
    .hs-rv-success-icon svg { width: 36px; height: 36px; color: var(--primary); }
    .hs-rv-success-title { font-size: 20px; font-weight: 800; color: var(--text); margin-bottom: 8px; font-family: 'Plus Jakarta Sans', sans-serif; }
    .hs-rv-success-msg { font-size: 13px; color: rgb(var(--wash-rgb) / 0.5); line-height: 1.6; font-family: 'Plus Jakarta Sans', sans-serif; }
    .hs-rv-success-close {
      margin-top: 24px; padding: 11px 32px; border-radius: 10px;
      background: rgb(var(--wash-rgb) / 0.06); border: 1px solid rgb(var(--wash-rgb) / 0.1);
      color: rgb(var(--wash-rgb) / 0.7); font-size: 13.5px; font-weight: 600;
      font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .hs-rv-success-close:hover { background: rgb(var(--wash-rgb) / 0.1); color: var(--text); }

    /* ── Hamburger (mobile only) ── */
    .hs-hamburger {
      display: none;
      align-items: center; justify-content: center;
      width: 36px; height: 36px;
      background: rgb(var(--wash-rgb) / 0.07);
      border: 1px solid rgb(var(--wash-rgb) / 0.1);
      border-radius: 9px;
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.2s;
    }
    .hs-hamburger:hover { background: rgb(var(--wash-rgb) / 0.14); }
    .hs-hamburger svg { width: 17px; height: 17px; color: rgb(var(--wash-rgb) / 0.8); display: block; }
    @media (max-width: 768px) {
      .hs-hamburger { display: none; }
      /* These used to cap the search box at 200px (then 130px below 400px) to leave room for
         the hamburger — but the hamburger is display:none right above this, so nothing was
         actually competing for that space, and 130px clipped the placeholder text down to
         "Search by pr...". flex: 1 + min-width: 0 on .hs-topbar-search already shares the row
         correctly with the bell/avatar; it doesn't need a hardcoded ceiling here at all. */
    }
    [data-theme="light"] .hs-hamburger {
      background: rgb(var(--k-ink-rgb) / 0.05);
      border-color: var(--border);
    }
    [data-theme="light"] .hs-hamburger svg { color: var(--text-muted); }

    /* ── Light mode ── */
    [data-theme="light"] .hs-topbar {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
    }
    [data-theme="light"] .hs-topbar-input {
      background: var(--surface-soft);
      border-color: var(--border);
      color: var(--text);
    }
    [data-theme="light"] .hs-topbar-input::placeholder { color: var(--text-muted); }
    [data-theme="light"] .hs-topbar-input:focus {
      background: var(--surface);
      border-color: rgb(var(--primary-rgb) / 0.55);
    }
    [data-theme="light"] .hs-topbar-search svg { color: var(--text-muted); }
    [data-theme="light"] .hs-topbar-search:focus-within svg { color: var(--primary); }
    [data-theme="light"] .hs-notif-btn {
      background: var(--surface-soft);
      border-color: var(--border);
    }
    [data-theme="light"] .hs-notif-btn:hover { background: var(--border); }
    [data-theme="light"] .hs-notif-btn svg { color: var(--text-muted); }
    [data-theme="light"] .hs-notif-btn:hover svg { color: var(--text); }
    [data-theme="light"] .hs-notif-dot { border-color: var(--surface); }
    [data-theme="light"] .hs-topbar-avatar {
      background: rgb(var(--primary-rgb) / 0.12);
      color: var(--primary);
      border-color: rgb(var(--primary-rgb) / 0.4);
    }
    [data-theme="light"] .hs-notif-panel,
    [data-theme="light"] .hs-profile-dropdown {
      background: var(--surface); border-color: var(--border);
      box-shadow: 0 12px 40px rgb(var(--k-ink-rgb) / 0.12);
    }
    [data-theme="light"] .hs-notif-title,
    [data-theme="light"] .hs-profile-head-name { color: var(--text); }
    [data-theme="light"] .hs-notif-tab:not(.active) { color: var(--text-muted); }
    [data-theme="light"] .hs-notif-tab:not(.active):hover { background: rgb(var(--k-ink-rgb) / 0.05); }
    [data-theme="light"] .hs-notif-section-label { color: var(--text-muted); }
    [data-theme="light"] .hs-notif-item:hover { background: rgb(var(--k-ink-rgb) / 0.03); }
    [data-theme="light"] .hs-notif-item.unread { background: rgb(var(--primary-rgb) / 0.05); }
    [data-theme="light"] .hs-notif-msg { color: var(--text-soft); }
    [data-theme="light"] .hs-notif-msg strong { color: var(--text); }
    [data-theme="light"] .hs-notif-time { color: var(--text-muted); }
    [data-theme="light"] .hs-notif-divider,
    [data-theme="light"] .hs-profile-divider { background: rgb(var(--k-ink-rgb) / 0.06); }
    [data-theme="light"] .hs-notif-footer { border-color: var(--border); }
    [data-theme="light"] .hs-notif-see-all-btn { color: var(--primary); }
    [data-theme="light"] .hs-profile-menu-item { color: var(--text-muted); }
    [data-theme="light"] .hs-profile-menu-item:hover { background: rgb(var(--k-ink-rgb) / 0.04); color: var(--text); }
    [data-theme="light"] .hs-profile-head { border-color: var(--border); }
    [data-theme="light"] .hs-profile-menu { border-color: var(--border); }
    [data-theme="light"] .hs-reverify-modal { background: var(--surface); border-color: var(--border); }
    [data-theme="light"] .hs-rv-title { color: var(--text); }
    [data-theme="light"] .hs-rv-sub { color: var(--text-muted); }
    [data-theme="light"] .hs-rv-upload { border-color: var(--border); background: rgb(var(--k-ink-rgb) / 0.02); }
    [data-theme="light"] .hs-rv-upload:hover { border-color: rgb(var(--primary-rgb) / 0.5); background: rgb(var(--primary-rgb) / 0.04); }
    [data-theme="light"] .hs-rv-upload-icon { background: rgb(var(--k-ink-rgb) / 0.06); }
    [data-theme="light"] .hs-rv-upload-icon svg { color: var(--text-muted); }
    [data-theme="light"] .hs-rv-upload-label { color: var(--text); }
    [data-theme="light"] .hs-rv-upload-hint { color: var(--text-muted); }
    [data-theme="light"] .hs-rv-step-dot { background: rgb(var(--k-ink-rgb) / 0.1); }
    [data-theme="light"] .hs-rv-step-label { color: var(--text-muted); }
    [data-theme="light"] .hs-rv-success-title { color: var(--text); }
    [data-theme="light"] .hs-rv-success-msg { color: var(--text-muted); }
  `;

  function injectCSS() {
    if (document.getElementById('hs-topbar-style')) return;
    const style = document.createElement('style');
    style.id = 'hs-topbar-style';
    style.textContent = CSS;
    document.head.appendChild(style);
  }

  function init({ placeholder = 'Search...', onSearch = null } = {}) {
    injectCSS();

    const el = document.getElementById('hs-topbar');
    if (!el) { console.warn('KasafideTopbar: #hs-topbar not found.'); return; }

    const user = typeof getSession === 'function' ? getSession() : null;
    const initials  = user ? hsInitials(user.firstName, user.lastName, user.email) : 'U';
    const fullName  = hsDisplayName(user);
    const role      = user ? user.role : 'buyer';
    const avatarContent = user && user.avatar
      ? `<img src="${user.avatar}" alt="${fullName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" />`
      : initials;

    // A search box that does nothing when typed into is worse than no search box — most pages
    // never pass onSearch (it's dead UI left over from before the front end was wired to real
    // data), so only render it where there's an actual handler for it.
    const searchHTML = typeof onSearch === 'function' ? `
      <div class="hs-topbar-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          class="hs-topbar-input"
          id="hsSearch"
          type="text"
          placeholder="${placeholder}"
          autocomplete="off"
          autocorrect="off"
          spellcheck="false"
          readonly
          onfocus="this.removeAttribute('readonly')"
          onblur="if(!this.value)this.setAttribute('readonly','')"
        />
      </div>
    ` : '';

    el.className = 'hs-topbar';
    el.innerHTML = `
      <button class="hs-hamburger" id="hsHamburger" aria-label="Open menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
      ${searchHTML}
      <div class="hs-topbar-right">

        <!-- Notification Bell -->
        <div class="hs-notif-wrap">
          <div class="hs-notif-btn" id="hsNotifBtn" title="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span class="hs-notif-dot" id="hsNotifDot"></span>
          </div>

          <div class="hs-notif-panel" id="hsNotifPanel">
            <div class="hs-notif-header">
              <span class="hs-notif-title">Notifications</span>
              <button class="hs-notif-mark-read" id="hsMarkRead">Mark all as read</button>
            </div>
            <div class="hs-notif-tabs">
              <button class="hs-notif-tab active" data-tab="all">All</button>
              <button class="hs-notif-tab" data-tab="unread">Unread</button>
            </div>
            <div class="hs-notif-body" id="hsNotifBody"></div>
            <div class="hs-notif-footer">
              <button class="hs-notif-see-all-btn" id="hsNotifSeeAll">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><polyline points="15 6 21 12 15 18"/></svg>
                See All Notifications
              </button>
            </div>
          </div>
        </div>

        <!-- Profile Avatar -->
        <div class="hs-profile-wrap">
          <div class="hs-topbar-avatar" id="hsAvatarBtn" title="${fullName}">${avatarContent}</div>

          <div class="hs-profile-dropdown" id="hsProfileDropdown">
            <div class="hs-profile-head">
              <div class="hs-profile-head-name">${fullName}</div>
              <div class="hs-profile-head-role">${role === 'super_duper_admin' ? 'Super Duper Admin' : role === 'superadmin' ? 'Super Admin' : role}</div>
            </div>
            <div class="hs-profile-menu" id="hsProfileMenu">
              <button class="hs-profile-menu-item" data-action="profile">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                View Profile
              </button>
              <button class="hs-profile-menu-item" data-action="settings">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                Settings
              </button>
              ${(role === 'buyer' || role === 'seller') ? `
              <button class="hs-profile-menu-item" data-action="help">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Help & Support
              </button>` : ''}
              ${(role === 'buyer' || role === 'seller') ? `
              <div class="hs-profile-divider"></div>
              <button class="hs-profile-menu-item reverify" data-action="reverify">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                Re-verify Account
              </button>
              ` : ''}
              <div class="hs-profile-divider"></div>
              <button class="hs-profile-menu-item danger" data-action="logout">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                Logout
              </button>
            </div>
          </div>
        </div>

      </div>
    `;

    if (role === 'buyer' || role === 'seller') {
      global._hsOpenReverify = function() {
        const p = window.location.pathname;
        const verifyPath = p.includes('/module/') ? 'verification.html' : `module/${role}/verification.html`;
        window.location.href = verifyPath;
      };
    }

    // ── Hamburger → open sidebar ────────────────────────────────────────────
    const hamburger = el.querySelector('#hsHamburger');
    if (hamburger) {
      hamburger.addEventListener('click', () => {
        if (typeof KasafideSidebar !== 'undefined' && KasafideSidebar.toggleMobile) {
          KasafideSidebar.toggleMobile();
        }
      });
    }

    // ── Search callback ─────────────────────────────────────────────────────
    if (typeof onSearch === 'function') {
      const input = el.querySelector('#hsSearch');
      if (input) input.addEventListener('input', onSearch);
    }

    // ── Notification panel ──────────────────────────────────────────────────
    // Reads the real `notifications` table (HS.notifications) instead of fabricated per-role
    // messages — nothing currently inserts rows into that table, so most accounts will honestly
    // show "No notifications" here rather than invented activity that never happened.
    let NOTIFS = [];

    function timeAgo(iso) {
      const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days === 1) return 'Yesterday';
      if (days < 7) return `${days}d ago`;
      return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
    }

    const ICONS = {
      listing: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      message: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
      price:   `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`,
      system:  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    };

    let activeTab = 'all';

    function renderNotifs(tab) {
      const body = document.getElementById('hsNotifBody');
      if (!body) return;
      const list = tab === 'unread' ? NOTIFS.filter(n => n.unread) : NOTIFS;
      const newItems     = list.filter(n => n.unread);
      const earlierItems = list.filter(n => !n.unread);

      let html = '';
      if (newItems.length) {
        html += `<div class="hs-notif-section-label">New</div>`;
        html += newItems.map(n => notifItem(n)).join('');
        if (earlierItems.length) html += `<div class="hs-notif-divider"></div>`;
      }
      if (earlierItems.length) {
        html += `<div class="hs-notif-section-label">Earlier</div>`;
        html += earlierItems.map(n => notifItem(n)).join('');
      }
      if (!list.length) {
        html = `<div style="padding:28px 16px;text-align:center;font-size:13px;color:rgb(var(--wash-rgb) / 0.35);font-family:'Plus Jakarta Sans',sans-serif;">No notifications</div>`;
      }
      body.innerHTML = html;
    }

    function notifItem(n) {
      return `
        <div class="hs-notif-item ${n.unread ? 'unread' : ''}" data-id="${n.id}">
          <div class="hs-notif-avatar ${n.type === 'system' ? 'system' : ''}">${ICONS[n.type] || ICONS.system}</div>
          <div class="hs-notif-content">
            <div class="hs-notif-msg">${n.title ? `<strong>${n.title}</strong> ` : ''}${n.body}</div>
            <div class="hs-notif-time">${timeAgo(n.createdAt)}</div>
          </div>
        </div>`;
    }

    // Clicking an item marks just that one read (and follows its link, if it has one).
    const notifBody = el.querySelector('#hsNotifBody');
    if (notifBody) {
      notifBody.addEventListener('click', async (e) => {
        const item = e.target.closest('.hs-notif-item');
        if (!item) return;
        const id = item.dataset.id;
        const n = NOTIFS.find((x) => String(x.id) === id);
        if (n && n.unread) {
          n.unread = false;
          renderNotifs(activeTab);
          try { await HS.notifications.markRead(id); } catch (err) { console.error('Could not mark notification read:', err); }
        }
        if (n && n.link) window.location.href = n.link;
      });
    }

    async function loadNotifs() {
      if (typeof HS === 'undefined' || !HS.notifications) return;
      try {
        NOTIFS = await HS.notifications.list();
      } catch (err) {
        console.error('Could not load notifications:', err);
        return;
      }
      renderNotifs(activeTab);
      const dot = el.querySelector('#hsNotifDot');
      if (dot) dot.style.display = NOTIFS.some((n) => n.unread) ? '' : 'none';
    }

    renderNotifs('all');
    loadNotifs();

    // Tab switching
    el.querySelectorAll('.hs-notif-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        el.querySelectorAll('.hs-notif-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeTab = tab.dataset.tab;
        renderNotifs(activeTab);
      });
    });

    // Mark all as read
    const markRead = el.querySelector('#hsMarkRead');
    if (markRead) {
      markRead.addEventListener('click', async () => {
        NOTIFS.forEach(n => n.unread = false);
        renderNotifs(activeTab);
        const dot = el.querySelector('#hsNotifDot');
        if (dot) dot.style.display = 'none';
        try { await HS.notifications.markAllRead(); } catch (err) { console.error('Could not mark notifications read:', err); }
      });
    }

    // Navigate to full notifications page
    function goToNotifPage() {
      const p = window.location.pathname;
      // '../<folder>/' rather than a bare filename: module/buyer/listing.html is shared by buyers
      // and sellers, and from there a bare name opened the buyer's page for a seller too.
      const folder = (role === 'superadmin' || role === 'super_duper_admin') ? 'super-admin' : role;
      let path;
      if (p.includes('/module/'))    path = '../' + folder + '/notifications.html';
      else if (p.includes('/auth/')) path = '../module/' + folder + '/notifications.html';
      else                           path = 'module/' + folder + '/notifications.html';
      window.location.href = path;
    }

    const seeAllBtn = el.querySelector('#hsNotifSeeAll');
    if (seeAllBtn) seeAllBtn.addEventListener('click', goToNotifPage);

    // Toggle notification panel — same popup behavior as the profile button, at every width.
    // This used to redirect to the full notifications page on mobile instead of opening the
    // panel, which was inconsistent with how the profile button always just opens its dropdown.
    const notifBtn   = el.querySelector('#hsNotifBtn');
    const notifPanel = el.querySelector('#hsNotifPanel');
    if (notifBtn && notifPanel) {
      notifBtn.addEventListener('click', e => {
        e.stopPropagation();
        notifPanel.classList.toggle('open');
        const profileDropdown = el.querySelector('#hsProfileDropdown');
        if (profileDropdown) profileDropdown.classList.remove('open');
      });
    }

    // ── Profile dropdown ────────────────────────────────────────────────────
    const avatarBtn       = el.querySelector('#hsAvatarBtn');
    const profileDropdown = el.querySelector('#hsProfileDropdown');

    if (avatarBtn && profileDropdown) {
      avatarBtn.addEventListener('click', e => {
        e.stopPropagation();
        profileDropdown.classList.toggle('open');
        if (notifPanel) notifPanel.classList.remove('open');
      });
    }

    // Profile menu actions
    const profileMenu = el.querySelector('#hsProfileMenu');
    if (profileMenu) {
      profileMenu.addEventListener('click', e => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        profileDropdown.classList.remove('open');
        const action = btn.dataset.action;
        const p = window.location.pathname;
        // The roles 'superadmin' and 'super_duper_admin' both live in module/super-admin/ — using
        // the role name as the folder sent them to a nonexistent path (404). The pages there are
        // profile.html / settings.html, same names as every other role's.
        const folder = (role === 'superadmin' || role === 'super_duper_admin') ? 'super-admin' : role;
        const basePath = p.includes('/module/') ? '../' + folder + '/' : 'module/' + folder + '/';

        if (action === 'profile') {
          window.location.href = basePath + 'profile.html';
        } else if (action === 'settings') {
          window.location.href = basePath + 'settings.html';
        } else if (action === 'help') {
          window.location.href = basePath + 'help.html';
        } else if (action === 'reverify') {
          if (typeof global._hsOpenReverify === 'function') global._hsOpenReverify();
        } else if (action === 'logout') {
          // Was auth/signin.html — logging out should land on the public landing page, not
          // straight back at a sign-in form.
          const logoutPath = p.includes('/module/') ? '../../index.html'
            : p.includes('/auth/') ? '../index.html'
            : 'index.html';
          // Sign out of Supabase too (not just the cached copy), then leave.
          const done = () => { window.location.href = logoutPath; };
          if (typeof hsSignOut === 'function') hsSignOut().then(done, done);
          else { if (typeof clearSession === 'function') clearSession(); done(); }
        }
      });
    }

    // Close both dropdowns on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('.hs-notif-wrap'))   notifPanel   && notifPanel.classList.remove('open');
      if (!e.target.closest('.hs-profile-wrap')) profileDropdown && profileDropdown.classList.remove('open');
    });
  }

  global.KasafideTopbar = { init };

})(window);
