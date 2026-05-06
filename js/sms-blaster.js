/**
 * Online Tournament Management
 * sms-blaster.js — SMS integration helpers
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

  // ── Send via PhilSMS backend ─────────────────
  async function sendViaPhilSMS({ message, apiUrl = '', apiToken = '', senderId = '', recipients = [], recipientDetails = [] }) {
    if (!message || !message.trim()) {
      return { ok: false, error: 'Message cannot be empty.' };
    }

    try {
      const payload = {
        message: message.trim(),
        api_url: apiUrl.trim(),
        api_token: apiToken.trim(),
        sender_id: senderId.trim(),
        recipients,
        recipient_details: recipientDetails
      };

      const res = await fetch('../api/sms/philsms-blast.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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

      // Log request and response for debugging
      console.log('[SMS-DEBUG] Request Payload:', JSON.stringify(payload, null, 2));
      console.log('[SMS-DEBUG] Response:', JSON.stringify(data, null, 2));

      if (!res.ok || !data.success) {
        let details = '';
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          const first = data.errors[0];
          const codePart = first.http_code ? `HTTP ${first.http_code}` : '';
          const errPart = first.error || first.response || '';
          details = [codePart, errPart].filter(Boolean).join(' - ');
        }
        return { ok: false, error: details ? `${data.message || 'PhilSMS request failed.'} (${details})` : (data.message || 'PhilSMS request failed.') };
      }

      logSMS({
        recipients: data.recipients || recipients,
        message: message.trim(),
        status: `Sent (PhilSMS: ${data.sent || 0})`,
        date: new Date().toISOString()
      });

      return {
        ok: true,
        sent: data.sent || 0,
        failed: data.failed || 0,
        blastId: data.blast_id || 0,
        message: data.message || `SMS sent to ${data.sent || 0} recipient(s).`,
        debug: data.debug || null
      };
    } catch (err) {
      return { ok: false, error: err.message || 'PhilSMS request failed.' };
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

  return { send, sendViaPhilSMS, blastToParticipants, blastToEvent, getLogs, clearLogs };
})();

/* =============================================
   SMS BLASTER FORM HANDLER (admin pages)
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  const form    = document.getElementById('smsForm');
  const charEl  = document.getElementById('smsCharCount');
  const msgArea = document.getElementById('smsMessage');
  const logList = document.getElementById('smsLogList');
  const isAdminAnnouncements = !!document.getElementById('adminAnnouncements');
  const recipientsChecklist = document.getElementById('smsRecipientsChecklist');
  const selectAllCheckbox = document.getElementById('smsSelectAllRecipients');
  const settingsBtn = document.getElementById('smsSettingsBtn');
  const saveSettingsBtn = document.getElementById('saveSmsSettingsBtn');
  const selectedCountEl = document.getElementById('smsSelectedCount');
  const totalCountEl = document.getElementById('smsTotalCount');
  const settingsModalId = 'smsSettingsModal';

  let recipientCache = [];

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

  // ── Admin announcements integrations ──────────
  if (isAdminAnnouncements) {
    loadSMSSettings();
    loadRecipients();

    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => {
        if (typeof openModal === 'function') {
          openModal(settingsModalId);
        }
      });
    }

    if (saveSettingsBtn) {
      saveSettingsBtn.addEventListener('click', async () => {
        const apiUrlInput = document.getElementById('smsGatewayUrl');
        const apiTokenInput = document.getElementById('smsGatewayToken');
        const senderIdInput = document.getElementById('smsSenderId');

        const apiUrl = (apiUrlInput?.value || '').trim();
        const apiToken = (apiTokenInput?.value || '').trim();
        const senderId = (senderIdInput?.value || '').trim();

        if (!apiUrl) {
          alert('PhilSMS API URL is required.');
          return;
        }
        if (!apiToken) {
          alert('PhilSMS API token is required.');
          return;
        }

        saveSettingsBtn.disabled = true;
        const oldText = saveSettingsBtn.textContent;
        saveSettingsBtn.textContent = 'Saving...';

        try {
          const res = await fetch('../api/sms/settings.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              api_url: apiUrl,
              api_token: apiToken,
              sender_id: senderId
            })
          });

          const data = await res.json();
          if (!res.ok || !data.success) {
            alert(data.message || 'Failed to save SMS settings.');
            return;
          }

          if (typeof closeModal === 'function') closeModal(settingsModalId);
          showSMSResult(document.getElementById('smsResult'), true, 'SMS settings saved successfully.');
        } catch (err) {
          alert(err.message || 'Failed to save SMS settings.');
        } finally {
          saveSettingsBtn.disabled = false;
          saveSettingsBtn.textContent = oldText;
        }
      });
    }

    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener('change', () => {
        const allChecks = document.querySelectorAll('.sms-recipient-check');
        allChecks.forEach((cb) => {
          cb.checked = selectAllCheckbox.checked;
        });
        syncSelectAllState();
      });
    }
  }

  // ── Form submit ───────────────────────────────
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const message    = (form.querySelector('#smsMessage')?.value    || '').trim();
    const apiUrl = (document.getElementById('smsGatewayUrl')?.value || '').trim();
    const apiToken = (document.getElementById('smsGatewayToken')?.value || '').trim();
    const senderId = (document.getElementById('smsSenderId')?.value || '').trim();
    const resultBox  = document.getElementById('smsResult');
    const btn        = form.querySelector('[type="submit"]');

    let recipients = [];
    let recipientDetails = [];
    if (isAdminAnnouncements) {
      const selectedPhones = new Set();
      document.querySelectorAll('.sms-recipient-check:checked').forEach((cb) => {
        selectedPhones.add((cb.value || '').trim());
      });

      recipientDetails = recipientCache.filter((r) => selectedPhones.has(r.phone));
      recipients = recipientDetails.map((r) => r.phone);
    }

    if (!message) { showSMSResult(resultBox, false, 'Message is required.'); return; }
    if (isAdminAnnouncements && recipients.length === 0) {
      showSMSResult(resultBox, false, 'Please select at least one recipient.');
      return;
    }
    if (isAdminAnnouncements && !apiUrl) {
      showSMSResult(resultBox, false, 'PhilSMS API URL is required.');
      return;
    }
    if (isAdminAnnouncements && !apiToken) {
      showSMSResult(resultBox, false, 'PhilSMS API token is required.');
      return;
    }

    btn.disabled    = true;
    btn.textContent = 'Sending...';

    const result = isAdminAnnouncements
      ? await SMSBlaster.sendViaPhilSMS({
          message,
          apiUrl,
          apiToken,
          senderId,
          recipients,
          recipientDetails
        })
      : await SMSBlaster.send({ recipients, message });

    showSMSResult(resultBox, result.ok, result.ok ? result.message : result.error);

    if (result.ok) {
      form.querySelector('#smsMessage').value  = '';
      if (charEl) charEl.innerHTML = '<span>0</span> / 160';
      if (logList) renderSMSLog(logList);
    }

    btn.disabled    = false;
    if (isAdminAnnouncements) {
      updateRecipientCountUI();
      
      // Display detailed debug info if available
      if (result.debug) {
        const normalizationHtml = result.debug.normalization_details && result.debug.normalization_details.length > 0
          ? `<strong>Phone Normalization Details:</strong><br/>${result.debug.normalization_details.map(n => 
              `${n.input} → ${n.normalized || 'INVALID'} ${n.valid ? '✓' : '✗'}`
            ).join('<br/>')}<br/><br/>`
          : '';
          
        const debugHtml = `
          <div style="background:#f5f5f5;border:1px solid #ddd;border-radius:6px;padding:10px;margin-top:10px;font-size:.8rem;font-family:monospace;max-height:300px;overflow-y:auto;">
            <details open>
              <summary style="cursor:pointer;font-weight:bold;margin-bottom:8px;">📊 Request/Response Debug Info</summary>
              <div style="margin-top:8px;padding-top:8px;border-top:1px solid #ddd;">
                <strong style="color:#d32f2f;">⚠️ Recipient Processing:</strong><br/>
                Frontend Sent: <strong>${result.debug.recipients_input_count || 0}</strong> recipient(s)<br/>
                Successfully Normalized: <strong>${result.debug.recipients_normalized_count || 0}</strong> recipient(s)<br/>
                <br/>${normalizationHtml}
                <strong>PhilSMS Endpoint:</strong><br/>${escapeHtml(result.debug.endpoint || 'N/A')}<br/><br/>
                <strong>First Request Payload:</strong><br/>
                <pre style="background:#fff;padding:6px;border-radius:3px;overflow-x:auto;">${escapeHtml(result.debug.request_payload || '{}')}</pre><br/>
                <strong>PhilSMS Response (HTTP ${result.debug.http_code || 'N/A'}):</strong><br/>
                <pre style="background:#fff;padding:6px;border-radius:3px;overflow-x:auto;">${escapeHtml(result.debug.response_body || '(empty)')}</pre>
              </div>
            </details>
          </div>
        `;
        const existingResult = document.getElementById('smsResult');
        if (existingResult) {
          existingResult.innerHTML += debugHtml;
        }
      }
    } else {
      btn.textContent = '📤 Send SMS';
    }
  });

  async function loadSMSSettings() {
    const apiUrlInput = document.getElementById('smsGatewayUrl');
    const apiTokenInput = document.getElementById('smsGatewayToken');
    const senderIdInput = document.getElementById('smsSenderId');
    if (!apiUrlInput || !apiTokenInput || !senderIdInput) return;

    try {
      const res = await fetch('../api/sms/settings.php');
      const data = await res.json();
      if (!res.ok || !data.success || !data.data) return;

      apiUrlInput.value = data.data.api_url || '';
      apiTokenInput.value = data.data.api_token || '';
      senderIdInput.value = data.data.sender_id || '';
    } catch {
      // Do nothing; admin can still fill settings manually.
    }
  }

  async function loadRecipients() {
    if (!recipientsChecklist) return;

    recipientsChecklist.innerHTML = '<div class="sms-recipients-state">Loading recipients...</div>';
    try {
      const res = await fetch('../api/sms/recipients.php');
      const data = await res.json();

      if (!res.ok || !data.success || !Array.isArray(data.data)) {
        recipientsChecklist.innerHTML = '<div class="sms-recipients-state error">Unable to load recipients.</div>';
        recipientCache = [];
        updateRecipientCountUI();
        return;
      }

      recipientCache = data.data;
      if (!recipientCache.length) {
        recipientsChecklist.innerHTML = '<div class="sms-recipients-state">No recipients found.</div>';
        updateRecipientCountUI();
        return;
      }

      recipientsChecklist.innerHTML = recipientCache.map((r, idx) => {
        const sourceTag = r.source === 'users' ? 'User' : 'Registration';
        const displayName = escapeHtml(r.name || `Recipient ${idx + 1}`);
        const phone = escapeHtml(r.phone || '');
        const phoneDisplay = escapeHtml(r.phone_display || r.phone || '');
        return `
          <label class="sms-recipient-item">
            <input type="checkbox" class="sms-recipient-check" value="${phone}" checked />
            <span class="sms-recipient-meta">
              <strong class="sms-recipient-name">${displayName}</strong>
              <span class="sms-recipient-line">${phoneDisplay}<span class="sms-recipient-source">${sourceTag}</span></span>
            </span>
          </label>
        `;
      }).join('');

      const checks = recipientsChecklist.querySelectorAll('.sms-recipient-check');
      checks.forEach((cb) => {
        cb.addEventListener('change', syncSelectAllState);
      });
      syncSelectAllState();
    } catch {
      recipientsChecklist.innerHTML = '<div class="sms-recipients-state error">Unable to load recipients.</div>';
      recipientCache = [];
      updateRecipientCountUI();
    }
  }

  function syncSelectAllState() {
    if (!selectAllCheckbox) return;
    const checks = document.querySelectorAll('.sms-recipient-check');
    if (!checks.length) {
      selectAllCheckbox.checked = false;
      return;
    }
    const checked = document.querySelectorAll('.sms-recipient-check:checked');
    selectAllCheckbox.checked = checked.length === checks.length;
    updateRecipientCountUI();
  }

  function updateRecipientCountUI() {
    const checks = document.querySelectorAll('.sms-recipient-check');
    const checked = document.querySelectorAll('.sms-recipient-check:checked');
    const total = checks.length;
    const selected = checked.length;

    if (selectedCountEl) selectedCountEl.textContent = String(selected);
    if (totalCountEl) totalCountEl.textContent = String(total);

    const submitBtn = form?.querySelector('[type="submit"]');
    if (submitBtn && isAdminAnnouncements) {
      submitBtn.textContent = `📤 Blast to ${selected} User${selected === 1 ? '' : 's'}`;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
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
