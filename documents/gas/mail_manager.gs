/**
 * Gmail 未返信・CCメール管理ツール
 * スプレッドシートにGmailの未返信メールとCCメールを自動出力します。
 */

// ===== 定数 =====
const SHEET_SETTINGS   = 'メール管理';
const SHEET_UNREPLIED  = '未返信一覧';
const SHEET_CC         = 'CC整理一覧';
const MAX_THREADS      = 200;
const HEADER_COLOR     = '#c8e6c9';
const ALERT_COLOR      = '#FFEBEE';

// ===== onOpen：カスタムメニュー =====

function onOpen() {
  SpreadsheetApp.getActiveSpreadsheet()
    .addMenu('メール管理ツール', [
      { name: '未返信メールを検索',  functionName: 'checkUnreplied'  },
      { name: 'CCメールを整理',      functionName: 'organizeCCMails' },
      { name: '両方実行',            functionName: 'runAll'          },
    ]);
}

// ===== 設定シートの初期化 =====

function initSettingsSheet() {
  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  let sheet  = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SETTINGS);
  }

  // 説明文・設定値が未入力の場合のみ初期値をセット
  if (!sheet.getRange('A1').getValue()) {
    sheet.getRange('A1').setValue('【設定】各値を変更してから実行してください');
    sheet.getRange('A1').setFontWeight('bold');
  }
  if (!sheet.getRange('A2').getValue()) sheet.getRange('A2').setValue('未返信とみなす日数（デフォルト：3）');
  if (!sheet.getRange('A3').getValue()) sheet.getRange('A3').setValue('検索対象期間（過去何日分、デフォルト：30）');
  if (!sheet.getRange('A4').getValue()) sheet.getRange('A4').setValue('除外メールアドレス（B4〜横方向に複数入力可）');
  if (!sheet.getRange('B2').getValue()) sheet.getRange('B2').setValue(3);
  if (!sheet.getRange('B3').getValue()) sheet.getRange('B3').setValue(30);

  return sheet;
}

// ===== 設定値の読み取り =====

function getSettings() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_SETTINGS) || initSettingsSheet();

  const unrepliedDays = Number(sheet.getRange('B2').getValue()) || 3;
  const searchDays    = Number(sheet.getRange('B3').getValue()) || 30;

  // B4〜横方向に並んだ除外アドレスを収集
  const excludeRow      = sheet.getRange(4, 2, 1, sheet.getLastColumn()).getValues()[0];
  const excludeAddresses = excludeRow
    .map(v => String(v).trim().toLowerCase())
    .filter(v => v !== '');

  return { unrepliedDays, searchDays, excludeAddresses };
}

// ===== ヘルパー：noreply / 自動送信アドレスかどうかを判定 =====

function isAutoAddress(address) {
  const auto = [
    'noreply', 'no-reply', 'donotreply', 'do-not-reply',
    'mailer-daemon', 'postmaster', 'notifications@', 'notification@',
    'support@', 'info@', 'newsletter@', 'subscribe@', 'automated@',
  ];
  const lower = address.toLowerCase();
  return auto.some(p => lower.includes(p));
}

// ===== ヘルパー：スレッドURLを生成 =====

function threadUrl(threadId) {
  return 'https://mail.google.com/mail/u/0/#inbox/' + threadId;
}

// ===== ヘルパー：シートの見出し行を設定 =====

function setHeaders(sheet, headers) {
  const range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  range.setBackground(HEADER_COLOR);
  range.setFontWeight('bold');
  range.setHorizontalAlignment('center');
  sheet.setFrozenRows(1);
}

// ===== ヘルパー：対象シートを取得（なければ作成）してクリア =====

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  } else {
    // ヘッダー行を残して2行目以降をクリア
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent().clearFormat();
    }
    // 1行目もクリア（ヘッダーは後で再設定）
    sheet.getRange(1, 1, 1, sheet.getMaxColumns()).clearContent().clearFormat();
  }
  return sheet;
}

// ===== 未返信メール検索 =====

function checkUnreplied() {
  try {
    const settings = getSettings();
    const ss       = SpreadsheetApp.getActiveSpreadsheet();
    const sheet    = getOrCreateSheet(ss, SHEET_UNREPLIED);

    setHeaders(sheet, ['送信日', '件名', '宛先（To）', '経過日数', 'スレッドURL', 'フォロー要否']);

    const myEmail    = Session.getActiveUser().getEmail();
    const now        = new Date();
    const cutoffDate = new Date(now.getTime() - settings.searchDays * 24 * 60 * 60 * 1000);

    // 自分が送信したスレッドを取得
    const query   = 'from:me after:' + Utilities.formatDate(cutoffDate, Session.getScriptTimeZone(), 'yyyy/MM/dd');
    const threads = GmailApp.search(query, 0, MAX_THREADS);

    const rows = [];

    for (const thread of threads) {
      const messages = thread.getMessages();
      if (messages.length === 0) continue;

      // スレッドの最後のメッセージを確認
      const lastMsg       = messages[messages.length - 1];
      const lastFrom      = lastMsg.getFrom();
      const lastFromEmail = extractEmail(lastFrom);

      // 最後のメッセージが自分の送信でなければスキップ（相手が返信済み）
      if (!isSameEmail(lastFromEmail, myEmail)) continue;

      // 最初の自分の送信メールを特定（送信日・宛先の基準）
      const firstSentMsg = messages.find(m => isSameEmail(extractEmail(m.getFrom()), myEmail));
      if (!firstSentMsg) continue;

      const sentDate = firstSentMsg.getDate();
      if (sentDate < cutoffDate) continue;

      const toField = firstSentMsg.getTo();

      // 除外アドレスチェック
      const toAddresses = toField.split(',').map(a => extractEmail(a).toLowerCase());
      const shouldExclude = toAddresses.some(addr =>
        settings.excludeAddresses.includes(addr) || isAutoAddress(addr)
      );
      if (shouldExclude) continue;

      const elapsedDays = Math.floor((now - lastMsg.getDate()) / (24 * 60 * 60 * 1000));
      if (elapsedDays < settings.unrepliedDays) continue;

      const followUp = elapsedDays >= settings.unrepliedDays ? '要フォロー' : '';

      rows.push([
        Utilities.formatDate(sentDate, Session.getScriptTimeZone(), 'yyyy/MM/dd'),
        firstSentMsg.getSubject(),
        toField,
        elapsedDays,
        threadUrl(thread.getId()),
        followUp,
      ]);
    }

    if (rows.length === 0) {
      sheet.getRange(2, 1).setValue('該当するメールが見つかりませんでした');
    } else {
      sheet.getRange(2, 1, rows.length, 6).setValues(rows);

      // 「要フォロー」行を赤背景で強調
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][5] === '要フォロー') {
          sheet.getRange(i + 2, 6).setBackground(ALERT_COLOR);
        }
      }
    }

    // 列幅を自動調整
    sheet.autoResizeColumns(1, 6);

    return rows.length;

  } catch (e) {
    handleError(e, '未返信メール検索');
    return 0;
  }
}

// ===== CCメール整理 =====

function organizeCCMails() {
  try {
    const settings = getSettings();
    const ss       = SpreadsheetApp.getActiveSpreadsheet();
    const sheet    = getOrCreateSheet(ss, SHEET_CC);

    setHeaders(sheet, ['受信日', '件名', '送信者', '自分の役割', 'スレッドURL', 'アクション分類']);

    const myEmail    = Session.getActiveUser().getEmail();
    const now        = new Date();
    const cutoffDate = new Date(now.getTime() - settings.searchDays * 24 * 60 * 60 * 1000);

    // CCまたはBCCに自分が入っているメールを取得
    const query   = '(cc:me OR bcc:me) after:' + Utilities.formatDate(cutoffDate, Session.getScriptTimeZone(), 'yyyy/MM/dd');
    const threads = GmailApp.search(query, 0, MAX_THREADS);

    const rows = [];

    for (const thread of threads) {
      const messages = thread.getMessages();
      if (messages.length === 0) continue;

      // スレッド内の代表メッセージ（最初のメッセージ）を基準にする
      const msg     = messages[0];
      const msgDate = msg.getDate();
      if (msgDate < cutoffDate) continue;

      const fromAddr = msg.getFrom();
      const subject  = msg.getSubject();
      const toField  = msg.getTo()  || '';
      const ccField  = msg.getCc()  || '';
      const bccField = msg.getBcc() || '';

      // 自分の役割を判定
      const role = determineRole(myEmail, toField, ccField, bccField);
      if (role === 'To') continue; // To のみは対象外（CCまたはBCCのみを対象）

      // アクション分類
      const action = classifyAction(subject);

      rows.push([
        Utilities.formatDate(msgDate, Session.getScriptTimeZone(), 'yyyy/MM/dd'),
        subject,
        fromAddr,
        role,
        threadUrl(thread.getId()),
        action,
      ]);
    }

    if (rows.length === 0) {
      sheet.getRange(2, 1).setValue('該当するメールが見つかりませんでした');
    } else {
      sheet.getRange(2, 1, rows.length, 6).setValues(rows);

      // 「要返信」行を赤背景で強調
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][5] === '要返信') {
          sheet.getRange(i + 2, 6).setBackground(ALERT_COLOR);
        }
      }
    }

    // 列幅を自動調整
    sheet.autoResizeColumns(1, 6);

    return rows.length;

  } catch (e) {
    handleError(e, 'CCメール整理');
    return 0;
  }
}

// ===== 両方実行 =====

function runAll() {
  const unrepliedCount = checkUnreplied();
  const ccCount        = organizeCCMails();
  SpreadsheetApp.getUi().alert(
    `✅ 完了しました\n\n` +
    `・未返信メール：${unrepliedCount} 件\n` +
    `・CCメール：${ccCount} 件\n\n` +
    `各シートをご確認ください。`
  );
}

// ===== ヘルパー：メールアドレスを抽出（"名前 <addr>" 形式に対応）=====

function extractEmail(str) {
  if (!str) return '';
  const match = str.match(/<([^>]+)>/);
  return match ? match[1].trim() : str.trim();
}

// ===== ヘルパー：メールアドレスの一致判定（大文字小文字を無視）=====

function isSameEmail(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}

// ===== ヘルパー：自分の役割を判定 =====

function determineRole(myEmail, toField, ccField, bccField) {
  const toAddrs  = splitAddresses(toField);
  const ccAddrs  = splitAddresses(ccField);
  const bccAddrs = splitAddresses(bccField);

  const inTo  = toAddrs.some(a  => isSameEmail(extractEmail(a), myEmail));
  const inCc  = ccAddrs.some(a  => isSameEmail(extractEmail(a), myEmail));
  const inBcc = bccAddrs.some(a => isSameEmail(extractEmail(a), myEmail));

  if (inBcc) return 'BCC';
  if (inCc)  return 'CC';
  if (inTo)  return 'To';
  return 'CC'; // GmailのCC/BCC検索でヒットした場合のフォールバック
}

// ===== ヘルパー：アドレス文字列をカンマ区切りで分割 =====

function splitAddresses(str) {
  if (!str) return [];
  return str.split(',').map(s => s.trim()).filter(s => s !== '');
}

// ===== ヘルパー：アクション分類 =====

function classifyAction(subject) {
  const s = subject.toLowerCase();

  const reviewKeywords  = ['確認', 'ご確認', 'please review'];
  const actionKeywords  = ['対応', '依頼', 'お願い', 'request', 'action required'];

  if (reviewKeywords.some(k => subject.includes(k) || s.includes(k))) return '確認のみ';
  if (actionKeywords.some(k => subject.includes(k) || s.includes(k))) return '要返信';
  return '対応不要';
}

// ===== ヘルパー：エラーハンドリング =====

function handleError(e, context) {
  let message = `【エラー】${context} 中にエラーが発生しました。\n\n`;

  if (e.message && e.message.includes('Gmail')) {
    message += 'Gmailへのアクセス権限がありません。\n';
    message += 'スクリプトエディタから「承認」を行ってください。';
  } else if (e.message && e.message.includes('authorization')) {
    message += 'スクリプトの承認が必要です。\n';
    message += 'スクリプトエディタ → 実行 → 承認を行ってください。';
  } else {
    message += `詳細：${e.message}`;
  }

  SpreadsheetApp.getUi().alert(message);
  console.error(`[${context}] ${e.message}\n${e.stack}`);
}

// ===== 初回セットアップ（手動実行用）=====

/**
 * 初回セットアップ：設定シートを初期化します。
 * スクリプトエディタから手動で一度実行してください。
 */
function setup() {
  initSettingsSheet();
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 未返信一覧・CC整理一覧シートも作成
  if (!ss.getSheetByName(SHEET_UNREPLIED)) ss.insertSheet(SHEET_UNREPLIED);
  if (!ss.getSheetByName(SHEET_CC))        ss.insertSheet(SHEET_CC);

  SpreadsheetApp.getUi().alert(
    '✅ セットアップ完了\n\n' +
    '「メール管理」シートの設定値を確認し、\n' +
    '「メール管理ツール」メニューから実行してください。'
  );
}
