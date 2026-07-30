// ─────────────────────────────────────────────────────────────────────────────
//  HomeSure – Topbar Component
//  Usage:
//    <div id="hs-topbar"></div>
//    <script src="../components/topbar.js"></script>
//    <script>HomeSureTopbar.init({ placeholder: 'Search properties...' })</script>
// ─────────────────────────────────────────────────────────────────────────────
(function (global) {
  'use strict';

  const CSS = `
    .hs-topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 26px;
      background: #364153;
      border-bottom: 1px solid rgba(0,0,0,0.2);
      gap: 14px;
      position: relative;
      z-index: 200;
    }

    /* ── Search ── */
    .hs-topbar-search {
      flex: 1;
      max-width: 400px;
      position: relative;
    }
    .hs-topbar-search svg {
      position: absolute; left: 13px; top: 50%;
      transform: translateY(-50%);
      color: rgba(255,255,255,0.35);
      width: 14px; height: 14px;
      pointer-events: none;
      transition: color 0.2s;
    }
    .hs-topbar-search:focus-within svg { color: #00c9a7; }

    .hs-topbar-input {
      width: 100%;
      background: rgba(0,0,0,0.2);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      padding: 9px 13px 9px 37px;
      color: #ffffff;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13px;
      outline: none;
      transition: border-color 0.2s, background 0.2s;
    }
    .hs-topbar-input::placeholder { color: rgba(255,255,255,0.35); }
    .hs-topbar-input::-webkit-search-cancel-button { -webkit-appearance: none; display: none; }
    .hs-topbar-input:-webkit-autofill,
    .hs-topbar-input:-webkit-autofill:hover,
    .hs-topbar-input:-webkit-autofill:focus {
      -webkit-box-shadow: 0 0 0 1000px #2d3f55 inset !important;
      -webkit-text-fill-color: #f1f5f9 !important;
      caret-color: #f1f5f9;
    }
    [data-theme="light"] .hs-topbar-input:-webkit-autofill,
    [data-theme="light"] .hs-topbar-input:-webkit-autofill:hover,
    [data-theme="light"] .hs-topbar-input:-webkit-autofill:focus {
      -webkit-box-shadow: 0 0 0 1000px #f1f5f9 inset !important;
      -webkit-text-fill-color: #1e293b !important;
      caret-color: #1e293b;
    }
    .hs-topbar-input:focus {
      border-color: rgba(0,201,167,0.55);
      background: rgba(0,0,0,0.3);
    }

    /* ── Right side ── */
    .hs-topbar-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* ── Notification bell ── */
    .hs-notif-btn {
      position: relative;
      width: 36px; height: 36px;
      border-radius: 50%;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.1);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      transition: background 0.2s, transform 0.18s;
      flex-shrink: 0;
    }
    .hs-notif-btn:hover {
      background: rgba(255,255,255,0.13);
      transform: scale(1.07);
    }
    .hs-notif-btn svg {
      width: 16px; height: 16px;
      color: rgba(255,255,255,0.7);
      transition: color 0.2s;
    }
    .hs-notif-btn:hover svg { color: #ffffff; }

    .hs-notif-dot {
      position: absolute;
      top: 6px; right: 6px;
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #00c9a7;
      border: 2px solid #364153;
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
      width: 330px; background: #253347; border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px; box-shadow: 0 16px 48px rgba(0,0,0,0.5);
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
    .hs-notif-title { font-size: 15px; font-weight: 800; color: #f1f5f9; font-family: 'Plus Jakarta Sans', sans-serif; }
    .hs-notif-mark-read {
      font-size: 11.5px; font-weight: 600; color: #00c9a7;
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
      background: transparent; color: rgba(255,255,255,0.45);
      transition: background 0.15s, color 0.15s;
    }
    .hs-notif-tab.active { background: #00c9a7; color: #ffffff; }
    .hs-notif-tab:not(.active):hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.8); }

    .hs-notif-body { max-height: 300px; overflow-y: auto; }
    .hs-notif-body::-webkit-scrollbar { width: 3px; }
    .hs-notif-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }

    .hs-notif-section-label {
      padding: 8px 16px 4px;
      font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.35);
      text-transform: uppercase; letter-spacing: 0.06em;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .hs-notif-item {
      display: flex; align-items: flex-start; gap: 11px;
      padding: 11px 16px; cursor: pointer;
      transition: background 0.15s;
      position: relative;
    }
    .hs-notif-item:hover { background: rgba(255,255,255,0.05); }
    .hs-notif-item.unread { background: rgba(0,201,167,0.06); }
    .hs-notif-item.unread::before {
      content: ''; position: absolute; left: 6px; top: 50%; transform: translateY(-50%);
      width: 5px; height: 5px; border-radius: 50%; background: #00c9a7;
    }
    .hs-notif-avatar {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      background: rgba(0,201,167,0.15); display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: #00c9a7;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .hs-notif-avatar.system { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.5); }
    .hs-notif-avatar svg { width: 16px; height: 16px; }
    .hs-notif-content { flex: 1; min-width: 0; }
    .hs-notif-msg {
      font-size: 12.5px; color: #cbd5e1; line-height: 1.45;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .hs-notif-msg strong { color: #f1f5f9; font-weight: 600; }
    .hs-notif-time {
      font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 3px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .hs-notif-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 2px 0; }

    .hs-notif-footer {
      padding: 10px 16px 14px;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .hs-notif-see-all-btn {
      width: 100%; padding: 10px; border-radius: 9px;
      background: rgba(0,201,167,0.1); border: 1px solid rgba(0,201,167,0.2);
      color: #00c9a7; font-size: 13px; font-weight: 700;
      font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
      display: flex; align-items: center; justify-content: center; gap: 6px;
    }
    .hs-notif-see-all-btn:hover { background: rgba(0,201,167,0.18); border-color: rgba(0,201,167,0.4); }
    .hs-notif-see-all-btn svg { width: 14px; height: 14px; }

    /* ── Profile dropdown ── */
    .hs-profile-wrap {
      position: relative; flex-shrink: 0;
    }
    .hs-topbar-avatar {
      width: 36px; height: 36px;
      border-radius: 50%;
      background: rgba(0,201,167,0.15);
      color: #00c9a7;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
      cursor: pointer;
      border: 2px solid rgba(0,201,167,0.4);
      font-family: 'Plus Jakarta Sans', sans-serif;
      transition: border-color 0.2s, transform 0.18s;
      user-select: none;
    }
    .hs-topbar-avatar:hover {
      border-color: #00c9a7;
      transform: scale(1.07);
    }

    .hs-profile-dropdown {
      display: none; position: absolute; top: calc(100% + 10px); right: 0; z-index: 9999;
      width: 220px; background: #253347; border: 1px solid rgba(255,255,255,0.08);
      border-radius: 14px; box-shadow: 0 16px 48px rgba(0,0,0,0.5);
      overflow: hidden;
      animation: hs-panel-in 0.18s ease both;
    }
    .hs-profile-dropdown.open { display: block; }

    .hs-profile-head {
      padding: 14px 16px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .hs-profile-head-name {
      font-size: 13.5px; font-weight: 700; color: #f1f5f9;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .hs-profile-head-role {
      font-size: 11px; color: #00c9a7; font-weight: 600; margin-top: 2px;
      font-family: 'Plus Jakarta Sans', sans-serif; text-transform: capitalize;
    }

    .hs-profile-menu { padding: 6px 0; }
    .hs-profile-menu-item {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 16px; cursor: pointer;
      font-size: 13px; font-weight: 500; color: rgba(255,255,255,0.7);
      font-family: 'Plus Jakarta Sans', sans-serif;
      border: none; background: none; width: 100%; text-align: left;
      transition: background 0.15s, color 0.15s;
    }
    .hs-profile-menu-item svg { width: 14px; height: 14px; flex-shrink: 0; }
    .hs-profile-menu-item:hover { background: rgba(255,255,255,0.06); color: #f1f5f9; }
    .hs-profile-menu-item.danger { color: rgba(248,113,113,0.8); }
    .hs-profile-menu-item.danger:hover { background: rgba(239,68,68,0.1); color: #f87171; }
    .hs-profile-menu-item.reverify { color: #00c9a7; }
    .hs-profile-menu-item.reverify:hover { background: rgba(0,201,167,0.08); }
    .hs-profile-divider { height: 1px; background: rgba(255,255,255,0.06); margin: 4px 0; }

    /* ── Reverification Modal ── */
    .hs-reverify-backdrop {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,0.65); z-index: 10000;
      align-items: flex-start; justify-content: center;
      backdrop-filter: blur(4px);
      overflow-y: auto; padding: 40px 20px;
    }
    .hs-reverify-backdrop.open { display: flex; }

    .hs-reverify-modal {
      background: #1e2f42; border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px; width: 100%; max-width: 460px;
      margin: auto;
      box-shadow: 0 24px 64px rgba(0,0,0,0.6);
      animation: hs-panel-in 0.22s ease both;
      position: relative;
    }

    .hs-rv-header {
      padding: 22px 24px 0;
      display: flex; align-items: flex-start; justify-content: space-between;
    }
    .hs-rv-icon {
      width: 52px; height: 52px; border-radius: 14px;
      background: rgba(0,201,167,0.12); border: 1px solid rgba(0,201,167,0.25);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .hs-rv-icon svg { width: 26px; height: 26px; color: #00c9a7; }
    .hs-rv-close {
      width: 30px; height: 30px; border-radius: 8px; border: none;
      background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5);
      cursor: pointer; font-size: 18px; line-height: 1;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, color 0.15s;
    }
    .hs-rv-close:hover { background: rgba(255,255,255,0.12); color: #f1f5f9; }

    .hs-rv-body { padding: 16px 24px 24px; }
    .hs-rv-title { font-size: 18px; font-weight: 800; color: #f1f5f9; margin-bottom: 6px; font-family: 'Plus Jakarta Sans', sans-serif; }
    .hs-rv-sub { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; margin-bottom: 22px; font-family: 'Plus Jakarta Sans', sans-serif; }

    .hs-rv-steps {
      display: flex; gap: 6px; margin-bottom: 6px; align-items: center;
    }
    .hs-rv-step-dot {
      flex: 1; height: 4px; border-radius: 99px; background: rgba(255,255,255,0.1);
      transition: background 0.3s;
    }
    .hs-rv-step-dot.done { background: #00c9a7; }

    .hs-rv-step-label {
      font-size: 10.5px; font-weight: 700; color: rgba(255,255,255,0.35);
      text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .hs-rv-upload {
      border: 1.5px dashed rgba(255,255,255,0.14); border-radius: 14px;
      padding: 32px 20px; text-align: center; margin-bottom: 14px;
      cursor: pointer; transition: border-color 0.2s, background 0.2s;
      background: rgba(255,255,255,0.02); display: block;
    }
    .hs-rv-upload:hover { border-color: rgba(0,201,167,0.5); background: rgba(0,201,167,0.05); }
    .hs-rv-upload.has-file { border-color: #00c9a7; background: rgba(0,201,167,0.07); }
    .hs-rv-upload input { display: none; }
    .hs-rv-upload-icon {
      width: 52px; height: 52px; border-radius: 14px;
      background: rgba(255,255,255,0.07); margin: 0 auto 14px;
      display: flex; align-items: center; justify-content: center;
    }
    .hs-rv-upload-icon svg { width: 24px; height: 24px; color: rgba(255,255,255,0.45); }
    .hs-rv-upload.has-file .hs-rv-upload-icon { background: rgba(0,201,167,0.12); }
    .hs-rv-upload.has-file .hs-rv-upload-icon svg { color: #00c9a7; }
    .hs-rv-upload-label { font-size: 13.5px; font-weight: 700; color: rgba(255,255,255,0.8); font-family: 'Plus Jakarta Sans', sans-serif; margin-bottom: 4px; }
    .hs-rv-upload-hint { font-size: 11.5px; color: rgba(255,255,255,0.3); font-family: 'Plus Jakarta Sans', sans-serif; line-height: 1.5; }
    .hs-rv-upload-filename {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 12px; color: #00c9a7; font-weight: 600; margin-top: 10px;
      background: rgba(0,201,167,0.1); padding: 4px 10px; border-radius: 20px;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .hs-rv-btn {
      width: 100%; padding: 13px; border-radius: 10px;
      background: #00c9a7; border: none; color: #fff;
      font-size: 14px; font-weight: 700; font-family: 'Plus Jakarta Sans', sans-serif;
      cursor: pointer; margin-top: 6px; transition: background 0.2s, opacity 0.2s;
      letter-spacing: 0.01em;
    }
    .hs-rv-btn:hover:not(:disabled) { background: #00b396; }
    .hs-rv-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    /* Success state */
    .hs-rv-success { display: none; padding: 36px 24px; text-align: center; }
    .hs-rv-success.show { display: block; }
    .hs-rv-success-icon {
      width: 72px; height: 72px; border-radius: 50%;
      background: rgba(0,201,167,0.12); border: 2px solid rgba(0,201,167,0.3);
      display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;
    }
    .hs-rv-success-icon svg { width: 36px; height: 36px; color: #00c9a7; }
    .hs-rv-success-title { font-size: 20px; font-weight: 800; color: #f1f5f9; margin-bottom: 8px; font-family: 'Plus Jakarta Sans', sans-serif; }
    .hs-rv-success-msg { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; font-family: 'Plus Jakarta Sans', sans-serif; }
    .hs-rv-success-close {
      margin-top: 24px; padding: 11px 32px; border-radius: 10px;
      background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
      color: rgba(255,255,255,0.7); font-size: 13.5px; font-weight: 600;
      font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer;
      transition: background 0.15s, color 0.15s;
    }
    .hs-rv-success-close:hover { background: rgba(255,255,255,0.1); color: #f1f5f9; }

    /* ── Hamburger (mobile only) ── */
    .hs-hamburger {
      display: none;
      align-items: center; justify-content: center;
      width: 36px; height: 36px;
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 9px;
      cursor: pointer;
      flex-shrink: 0;
      transition: background 0.2s;
    }
    .hs-hamburger:hover { background: rgba(255,255,255,0.14); }
    .hs-hamburger svg { width: 17px; height: 17px; color: rgba(255,255,255,0.8); display: block; }
    @media (max-width: 768px) {
      .hs-hamburger { display: none; }
      .hs-topbar-search { max-width: 200px; }
    }
    @media (max-width: 400px) {
      .hs-topbar-search { max-width: 130px; }
    }
    [data-theme="light"] .hs-hamburger {
      background: rgba(0,0,0,0.05);
      border-color: rgba(0,0,0,0.1);
    }
    [data-theme="light"] .hs-hamburger svg { color: rgba(0,0,0,0.6); }

    /* ── Light mode ── */
    [data-theme="light"] .hs-topbar {
      background: #ffffff;
      border-bottom: 1px solid rgba(0,0,0,0.08);
    }
    [data-theme="light"] .hs-topbar-input {
      background: #f1f5f9;
      border-color: rgba(0,0,0,0.1);
      color: #1e293b;
    }
    [data-theme="light"] .hs-topbar-input::placeholder { color: rgba(0,0,0,0.35); }
    [data-theme="light"] .hs-topbar-input:focus {
      background: #ffffff;
      border-color: rgba(0,201,167,0.55);
    }
    [data-theme="light"] .hs-topbar-search svg { color: rgba(0,0,0,0.35); }
    [data-theme="light"] .hs-topbar-search:focus-within svg { color: #00c9a7; }
    [data-theme="light"] .hs-notif-btn {
      background: #f1f5f9;
      border-color: rgba(0,0,0,0.1);
    }
    [data-theme="light"] .hs-notif-btn:hover { background: #e2e8f0; }
    [data-theme="light"] .hs-notif-btn svg { color: rgba(0,0,0,0.5); }
    [data-theme="light"] .hs-notif-btn:hover svg { color: #1e293b; }
    [data-theme="light"] .hs-notif-dot { border-color: #ffffff; }
    [data-theme="light"] .hs-topbar-avatar {
      background: rgba(0,201,167,0.12);
      color: #00a88c;
      border-color: rgba(0,201,167,0.4);
    }
    [data-theme="light"] .hs-notif-panel,
    [data-theme="light"] .hs-profile-dropdown {
      background: #ffffff; border-color: rgba(0,0,0,0.09);
      box-shadow: 0 12px 40px rgba(0,0,0,0.12);
    }
    [data-theme="light"] .hs-notif-title,
    [data-theme="light"] .hs-profile-head-name { color: #1e293b; }
    [data-theme="light"] .hs-notif-tab:not(.active) { color: rgba(0,0,0,0.45); }
    [data-theme="light"] .hs-notif-tab:not(.active):hover { background: rgba(0,0,0,0.05); }
    [data-theme="light"] .hs-notif-section-label { color: rgba(0,0,0,0.35); }
    [data-theme="light"] .hs-notif-item:hover { background: rgba(0,0,0,0.03); }
    [data-theme="light"] .hs-notif-item.unread { background: rgba(0,201,167,0.05); }
    [data-theme="light"] .hs-notif-msg { color: #475569; }
    [data-theme="light"] .hs-notif-msg strong { color: #1e293b; }
    [data-theme="light"] .hs-notif-time { color: rgba(0,0,0,0.3); }
    [data-theme="light"] .hs-notif-divider,
    [data-theme="light"] .hs-profile-divider { background: rgba(0,0,0,0.06); }
    [data-theme="light"] .hs-notif-footer { border-color: rgba(0,0,0,0.06); }
    [data-theme="light"] .hs-notif-see-all-btn { color: #00a88c; }
    [data-theme="light"] .hs-profile-menu-item { color: rgba(0,0,0,0.6); }
    [data-theme="light"] .hs-profile-menu-item:hover { background: rgba(0,0,0,0.04); color: #1e293b; }
    [data-theme="light"] .hs-profile-head { border-color: rgba(0,0,0,0.06); }
    [data-theme="light"] .hs-profile-menu { border-color: rgba(0,0,0,0.06); }
    [data-theme="light"] .hs-reverify-modal { background: #ffffff; border-color: rgba(0,0,0,0.09); }
    [data-theme="light"] .hs-rv-title { color: #1e293b; }
    [data-theme="light"] .hs-rv-sub { color: rgba(0,0,0,0.45); }
    [data-theme="light"] .hs-rv-upload { border-color: rgba(0,0,0,0.13); background: rgba(0,0,0,0.02); }
    [data-theme="light"] .hs-rv-upload:hover { border-color: rgba(0,201,167,0.5); background: rgba(0,201,167,0.04); }
    [data-theme="light"] .hs-rv-upload-icon { background: rgba(0,0,0,0.06); }
    [data-theme="light"] .hs-rv-upload-icon svg { color: rgba(0,0,0,0.35); }
    [data-theme="light"] .hs-rv-upload-label { color: rgba(0,0,0,0.75); }
    [data-theme="light"] .hs-rv-upload-hint { color: rgba(0,0,0,0.35); }
    [data-theme="light"] .hs-rv-step-dot { background: rgba(0,0,0,0.1); }
    [data-theme="light"] .hs-rv-step-label { color: rgba(0,0,0,0.35); }
    [data-theme="light"] .hs-rv-success-title { color: #1e293b; }
    [data-theme="light"] .hs-rv-success-msg { color: rgba(0,0,0,0.45); }
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
    if (!el) { console.warn('HomeSureTopbar: #hs-topbar not found.'); return; }

    const user = typeof getSession === 'function' ? getSession() : null;
    const initials  = user ? (user.firstName[0] + user.lastName[0]).toUpperCase() : 'U';
    const fullName  = user ? user.firstName + ' ' + user.lastName : 'User';
    const role      = user ? user.role : 'buyer';
    const avatarContent = user && user.avatar
      ? `<img src="${user.avatar}" alt="${fullName}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;display:block;" />`
      : initials;

    el.className = 'hs-topbar';
    el.innerHTML = `
      <button class="hs-hamburger" id="hsHamburger" aria-label="Open menu">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>
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
              <div class="hs-profile-head-role">${role}</div>
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
              <button class="hs-profile-menu-item" data-action="help">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Help & Support
              </button>
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
        if (typeof HomeSureSidebar !== 'undefined' && HomeSureSidebar.toggleMobile) {
          HomeSureSidebar.toggleMobile();
        }
      });
    }

    // ── Search callback ─────────────────────────────────────────────────────
    if (typeof onSearch === 'function') {
      const input = el.querySelector('#hsSearch');
      if (input) input.addEventListener('input', onSearch);
    }

    // ── Notification panel ──────────────────────────────────────────────────
    const NOTIFS_BY_ROLE = {
      buyer: [
        { id: 1, type: 'message', unread: true,  time: '2m ago',    msg: '<strong>Ramon Cruz</strong> sent you a message about a property.' },
        { id: 2, type: 'listing', unread: true,  time: '18m ago',   msg: '<strong>New listing</strong> in Poblacion matches your saved preferences.' },
        { id: 3, type: 'price',   unread: false, time: '2h ago',    msg: 'Price dropped on a saved listing — <strong>1-Bedroom Apartment near Town Proper</strong>.' },
        { id: 4, type: 'system',  unread: false, time: 'Yesterday', msg: 'Your account was successfully verified.' },
      ],
      seller: [
        { id: 1, type: 'message', unread: true,  time: '5m ago',    msg: '<strong>Maria Santos</strong> sent an inquiry about your listing in Poblacion.' },
        { id: 2, type: 'listing', unread: true,  time: '1h ago',    msg: 'Your listing <strong>2-Bedroom Unit in Sta. Maria</strong> has been approved.' },
        { id: 3, type: 'price',   unread: false, time: '3h ago',    msg: '3 buyers viewed your listing in Pulong Yantok today.' },
        { id: 4, type: 'system',  unread: false, time: 'Yesterday', msg: 'Your seller account has been successfully verified.' },
      ],
      admin: [
        { id: 1, type: 'listing', unread: true,  time: '10m ago',   msg: '<strong>New listing</strong> submitted by Juan Dela Cruz — pending approval.' },
        { id: 2, type: 'message', unread: true,  time: '45m ago',   msg: 'User <strong>Maria Santos</strong> filed a report against a listing.' },
        { id: 3, type: 'system',  unread: false, time: '4h ago',    msg: '2 listings flagged for review by the content filter.' },
        { id: 4, type: 'system',  unread: false, time: 'Yesterday', msg: 'System backup completed successfully.' },
      ],
      superadmin: [
        { id: 1, type: 'system',  unread: true,  time: '15m ago',   msg: 'Admin <strong>Jose Reyes</strong> approved 5 new listings.' },
        { id: 2, type: 'message', unread: true,  time: '2h ago',    msg: 'New admin account registered — pending super admin approval.' },
        { id: 3, type: 'system',  unread: false, time: 'Yesterday', msg: 'Monthly report generated for March 2026.' },
        { id: 4, type: 'system',  unread: false, time: '2 days ago', msg: 'Platform usage hit 500 active users this week.' },
      ],
    };
    let NOTIFS = (NOTIFS_BY_ROLE[role] || NOTIFS_BY_ROLE.buyer).map(n => Object.assign({}, n));

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
        html = `<div style="padding:28px 16px;text-align:center;font-size:13px;color:rgba(255,255,255,0.35);font-family:'Plus Jakarta Sans',sans-serif;">No notifications</div>`;
      }
      body.innerHTML = html;
    }

    function notifItem(n) {
      return `
        <div class="hs-notif-item ${n.unread ? 'unread' : ''}">
          <div class="hs-notif-avatar ${n.type === 'system' ? 'system' : ''}">${ICONS[n.type] || ''}</div>
          <div class="hs-notif-content">
            <div class="hs-notif-msg">${n.msg}</div>
            <div class="hs-notif-time">${n.time}</div>
          </div>
        </div>`;
    }

    renderNotifs('all');

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
      markRead.addEventListener('click', () => {
        NOTIFS.forEach(n => n.unread = false);
        renderNotifs(activeTab);
        const dot = el.querySelector('#hsNotifDot');
        if (dot) dot.style.display = 'none';
      });
    }

    // Navigate to full notifications page
    function goToNotifPage() {
      const p = window.location.pathname;
      let path;
      if (p.includes('/module/'))    path = 'notifications.html';
      else if (p.includes('/auth/')) path = '../module/' + role + '/notifications.html';
      else                           path = 'module/' + role + '/notifications.html';
      window.location.href = path;
    }

    const seeAllBtn = el.querySelector('#hsNotifSeeAll');
    if (seeAllBtn) seeAllBtn.addEventListener('click', goToNotifPage);

    // Toggle notification panel (desktop) or navigate to page (mobile)
    const notifBtn   = el.querySelector('#hsNotifBtn');
    const notifPanel = el.querySelector('#hsNotifPanel');
    if (notifBtn && notifPanel) {
      notifBtn.addEventListener('click', e => {
        e.stopPropagation();

        // On mobile (< 768px), go to notifications page instead
        if (window.innerWidth < 768) {
          // Determine the correct path based on current role
          const currentPath = window.location.pathname;
          let notifPath = 'notifications.html';

          if (currentPath.includes('/buyer/')) {
            notifPath = 'notifications.html';
          } else if (currentPath.includes('/seller/')) {
            notifPath = 'notifications.html';
          } else if (currentPath.includes('/admin/')) {
            notifPath = 'notifications.html';
          }

          window.location.href = notifPath;
          return;
        }

        // Desktop: Toggle dropdown
        notifPanel.classList.toggle('open');
        const profileDropdown = el.querySelector('#hsProfileDropdown');
        if (profileDropdown) profileDropdown.classList.remove('open');
        const dot = el.querySelector('#hsNotifDot');
        if (dot) dot.style.display = 'none';
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

        if (action === 'profile') {
          const basePath = p.includes('/module/') ? '../' + role + '/' : 'module/' + role + '/';
          window.location.href = basePath + 'profile.html';
        } else if (action === 'settings') {
          const basePath = p.includes('/module/') ? '../' + role + '/' : 'module/' + role + '/';
          window.location.href = basePath + 'settings.html';
        } else if (action === 'help') {
          const basePath = p.includes('/module/') ? '../' + role + '/' : 'module/' + role + '/';
          window.location.href = basePath + 'help.html';
        } else if (action === 'reverify') {
          if (typeof global._hsOpenReverify === 'function') global._hsOpenReverify();
        } else if (action === 'logout') {
          if (typeof clearSession === 'function') clearSession();
          const logoutPath = p.includes('/module/') ? '../../auth/signin.html'
            : p.includes('/auth/') ? '../auth/signin.html'
            : 'auth/signin.html';
          window.location.href = logoutPath;
        }
      });
    }

    // Close both dropdowns on outside click
    document.addEventListener('click', e => {
      if (!e.target.closest('.hs-notif-wrap'))   notifPanel   && notifPanel.classList.remove('open');
      if (!e.target.closest('.hs-profile-wrap')) profileDropdown && profileDropdown.classList.remove('open');
    });
  }

  global.HomeSureTopbar = { init };

})(window);
