const CFG = {
  SPREADSHEET_ID: '1DkBN_xNCQ6yPAJk89sSj27OOYgthNUXrZeVTFJjIsng',
  SHEET_NAME: 'Events',
  MAX_BATCH: 25
};

const HEADERS = [
  'timestamp','event','funnel_stage','session_id','path','landing_path','source',
  'product_slug','cta_location','label','referrer','utm_source','utm_medium',
  'utm_campaign','received_at','user_agent','event_id'
];

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({ok:true,service:'digital-execution-funnel-collector'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const events = Array.isArray(payload.events) ? payload.events.slice(0, CFG.MAX_BATCH) : [payload];
    const sheet = SpreadsheetApp.openById(CFG.SPREADSHEET_ID).getSheetByName(CFG.SHEET_NAME);
    if (!sheet) throw new Error('Events sheet not found');

    const existingIds = getRecentEventIds_(sheet, 500);
    const now = new Date().toISOString();
    const rows = [];

    events.forEach(ev => {
      if (!ev || typeof ev !== 'object') return;
      const eventId = safe_(ev.event_id, 100);
      const eventName = safe_(ev.event, 80);
      if (!eventId || !eventName || existingIds.has(eventId)) return;

      rows.push([
        safe_(ev.timestamp, 50),
        eventName,
        safe_(ev.funnel_stage, 80),
        safe_(ev.session_id, 100),
        safe_(ev.path, 300),
        safe_(ev.landing_path, 300),
        safe_(ev.source, 120),
        safe_(ev.product_slug, 120),
        safe_(ev.cta_location, 120),
        safe_(ev.label, 200),
        safe_(ev.referrer, 500),
        safe_(ev.utm_source, 120),
        safe_(ev.utm_medium, 120),
        safe_(ev.utm_campaign, 160),
        now,
        safe_(ev.user_agent, 300),
        eventId
      ]);
      existingIds.add(eventId);
    });

    if (rows.length) {
      sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, HEADERS.length).setValues(rows);
    }

    return ContentService.createTextOutput(JSON.stringify({ok:true,accepted:rows.length}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ok:false,error:String(err && err.message || err)}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function safe_(value, max) {
  return String(value == null ? '' : value).replace(/[\u0000-\u001F\u007F]/g, ' ').slice(0, max);
}

function getRecentEventIds_(sheet, limit) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return new Set();
  const start = Math.max(2, lastRow - limit + 1);
  const values = sheet.getRange(start, 17, lastRow - start + 1, 1).getValues();
  return new Set(values.flat().map(String).filter(Boolean));
}
