/**
 * Online Tournament Management
 * sms-blaster.js — SMS integration helpers
 *
 * iTexMo API Docs: https://www.itexmo.com/php-api/
 * Replace API credentials with your actual iTexMo account values.
 */

'use strict';

/* =============================================
   SMS BLASTER MODULE
   ============================================= */
const SMSBlaster = (() => {

  const LOG_KEY = 'otm_sms_logs';

  // ── Send SMS (demo/local) ─────────────────────
  async function send({ recipients, message, senderId = '' }) {

    if (!recipients || !recipients.length) {
      return { ok: false, error: 'No recipients specified.' };
    }

    if (!message || message.trim().length === 0) {
      return { ok: false, error: 'Message cannot be empty.' };
    }

    if (message.length > 160) {
      return { ok: false, error: 'Message exceeds 160 characters (1 SMS credit).' };
    }

    // Sanitize phone numbers: PH format 09XXXXXXXXX or +639XXXXXXXXX
    const sanitized = recipients
      .map(r => r.toString().replace(/\D/g, ''))
      .filter(r => /^(09\d{9}|639\d{9})$/.test(r))
      .map(r => r.startsWith('09') ? '63' + r.slice(1) : r);

    if (!sanitized.length) {
      return { ok: false, error: 'No valid PH phone numbers found.' };
    }

    try {
      // Demo mode: log locally and simulate success
      console.info('[SMSBlaster] Demo mode – would send to:', sanitized);
      console.info('[SMSBlaster] Message:', message);

      logSMS({ recipients: sanitized, message, status: 'Sent (Demo)', date: new Date().toISOString() });
      return { ok: true, sent: sanitized.length, message: `SMS queued for ${sanitized.length} recipient(s).` };

    } catch (err) {
      console.error('[SMSBlaster] Error:', err);
      logSMS({ recipients: sanitized, message, status: 'Failed', date: new Date().toISOString() });
      return { ok: false, error: 'SMS delivery failed. Check network or API configuration.' };
    }
  }

  // ── Send via Android Gateway backend ─────────
  async function sendViaAndroidGateway({ message, gatewayUrl, gatewayToken = '', recipients = [] }) {
    if (!message || !message.trim()) {
      return { ok: false, error: 'Message cannot be empty.' };
    }

    if (!gatewayUrl || !gatewayUrl.trim()) {
      return { ok: false, error: 'Gateway URL is required.' };
    }

    try {
      const res = await fetch('../api/sms/android-blast.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          gateway_url: gatewayUrl.trim(),
          gateway_token: gatewayToken.trim(),
          recipients
        })
      });

      const raw = await res.text();
      let data = null;
      try {
        data = JSON.parse(raw);
      } catch {
        const clean = raw
          .replace(/<br\s*\/?>/gi, ' ')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        return { ok: false, error: clean || 'Server returned a non-JSON response.' };
      }

      if (!res.ok || !data.success) {
        return { ok: false, error: data.message || 'Android gateway request failed.' };
      }

      logSMS({
        recipients: data.recipients || recipients,
        message: message.trim(),
        status: `Sent (Android Gateway: ${data.sent || 0})`,
        date: new Date().toISOString()
      });

      return {
        ok: true,
        sent: data.sent || 0,
        failed: data.failed || 0,
        message: data.message || `SMS sent to ${data.sent || 0} recipient(s).`
      };
    } catch (err) {
      return { ok: false, error: err.message || 'Android gateway request failed.' };
    }
  }

  // ── Blast to all registered participants ──────
  async function blastToParticipants(message) {
    const users = (JSON.parse(localStorage.getItem('otm_users')) || [])
      .filter(u => u.phone && u.status === 'Active')
      .map(u => u.phone);

    if (!users.length) return { ok: false, error: 'No active participants with phone numbers.' };
    return send({ recipients: users, message });
  }

  // ── Blast to specific event participants ───────
  async function blastToEvent(eventId, message) {
    const events = JSON.parse(localStorage.getItem('otm_events')) || [];
    const ev     = events.find(e => e.id === eventId);
    if (!ev || !ev.participants) return { ok: false, error: 'Event or participants not found.' };
    return send({ recipients: ev.participants.map(p => p.phone).filter(Boolean), message });
  }

  // ── Log SMS history ───────────────────────────
  function logSMS(entry) {
    const logs = getLogs();
    logs.unshift({ ...entry, id: Date.now() });
    if (logs.length > 200) logs.length = 200; // cap history
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  }

  function getLogs() {
    try { return JSON.parse(localStorage.getItem(LOG_KEY)) || []; }
    catch { return []; }
  }

  function clearLogs() { localStorage.removeItem(LOG_KEY); }

  return { send, sendViaAndroidGateway, blastToParticipants, blastToEvent, getLogs, clearLogs };
})();

/* =============================================
   SMS BLASTER FORM HANDLER (admin pages)
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  const form    = document.getElementById('smsForm');
  const charEl  = document.getElementById('smsCharCount');
  const msgArea = document.getElementById('smsMessage');
  const logList = document.getElementById('smsLogList');

  // ── Character counter ─────────────────────────
  if (msgArea && charEl) {
    msgArea.addEventListener('input', () => {
      const len     = msgArea.value.length;
      charEl.innerHTML = `<span>${len}</span> / 160`;
      charEl.style.color = len > 160 ? '#c62828' : '';
    });
  }

  // ── Render SMS log ────────────────────────────
  if (logList) renderSMSLog(logList);

  // ── Form submit ───────────────────────────────
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const rawNumbers = (form.querySelector('#smsRecipients')?.value || '').trim();
    const message    = (form.querySelector('#smsMessage')?.value    || '').trim();
    const mode       = (form.querySelector('#smsMode')?.value       || 'manual');
    const gatewayUrl = (form.querySelector('#smsGatewayUrl')?.value || '').trim();
    const gatewayToken = (form.querySelector('#smsGatewayToken')?.value || '').trim();
    const resultBox  = document.getElementById('smsResult');
    const btn        = form.querySelector('[type="submit"]');

    let recipients = [];

    if (mode === 'all') {
      const users = (JSON.parse(localStorage.getItem('otm_users')) || [])
        .filter(u => u.phone && u.status === 'Active')
        .map(u => u.phone);
      recipients = users;
    } else {
      recipients = rawNumbers.split(/[\n,;]+/).map(s => s.trim()).filter(Boolean);
    }

    if (!message) { showSMSResult(resultBox, false, 'Message is required.'); return; }
    if (document.getElementById('adminAnnouncements') && !gatewayUrl) {
      showSMSResult(resultBox, false, 'Gateway URL is required for Android gateway.');
      return;
    }

    btn.disabled    = true;
    btn.textContent = 'Sending…';

    const result = document.getElementById('adminAnnouncements')
      ? await SMSBlaster.sendViaAndroidGateway({
          message,
          gatewayUrl,
          gatewayToken,
          recipients: mode === 'all' ? [] : recipients
        })
      : await SMSBlaster.send({ recipients, message });

    showSMSResult(resultBox, result.ok, result.ok ? result.message : result.error);

    if (result.ok) {
      form.querySelector('#smsMessage').value  = '';
      if (charEl) charEl.innerHTML = '<span>0</span> / 160';
      if (logList) renderSMSLog(logList);
    }

    btn.disabled    = false;
    btn.textContent = document.getElementById('adminAnnouncements') ? '📤 Blast to All Users' : '📤 Send SMS';
  });
});

function showSMSResult(el, ok, msg) {
  if (!el) return;
  el.style.display    = 'block';
  el.textContent      = msg;
  el.style.background = ok ? '#e8f5e9' : '#ffebee';
  el.style.color      = ok ? '#2e7d32' : '#c62828';
  el.style.padding    = '12px 16px';
  el.style.borderRadius = '8px';
  el.style.marginTop  = '14px';
  el.style.fontSize   = '0.88rem';
  el.style.fontWeight = '600';
}

function renderSMSLog(container) {
  const logs = SMSBlaster.getLogs();
  if (!logs.length) {
    container.innerHTML = '<p style="color:#aaa;font-size:.85rem;padding:10px 0;">No SMS logs yet.</p>';
    return;
  }
  container.innerHTML = logs.slice(0, 20).map(l => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:.82rem;">
      <div>
        <strong style="color:#333;">${l.status}</strong>
        <span style="color:#aaa;margin:0 6px;">•</span>
        <span style="color:#666;">${l.recipients.length} recipient(s)</span>
        <div style="color:#888;margin-top:3px;">${l.message.slice(0, 60)}${l.message.length > 60 ? '…' : ''}</div>
      </div>
      <span style="color:#aaa;white-space:nowrap;margin-left:10px;">${new Date(l.date).toLocaleString()}</span>
    </div>
  `).join('');
}
