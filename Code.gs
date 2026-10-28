/**
 * 十鼓節奏大師 — Google 試算表後端 API
 * 試算表綁定腳本 (Spreadsheet-bound Apps Script)
 * 支援曲目清單讀取、自訂曲譜儲存、得分紀錄
 */

const SHEET_NAME_SONGS = '曲目列表';
const SHEET_NAME_SCORES = '學生練習成績';
const SHEET_NAME_CALIB = '鼓聲校準特徵庫';

// 初始預設曲目種子資料
const DEFAULT_SONGS = [
  {
    id: "s01",
    title: "十鼓迎賓練習曲",
    bpm: 92,
    offset_ms: 200,
    beats_per_bar: 4,
    grid: 16,
    stars: 2,
    theme: "castles",
    mascot: "assets/chars/panda.png",
    desc: "基礎四拍子「咚、咔」交替擊打，最適合全隊暖身對拍。",
    pattern: [
      "D...D...K...K...",
      "D...D...K...K...",
      "D.D.D...K.K.K...",
      "D.D.K.K.D...K...",
      "DDDD....KKKK....",
      "D.K.D.K.D.K.D...",
      "D...D.D.K...K.K.",
      "D.D.K.K.D...D..."
    ]
  },
  {
    id: "s02",
    title: "小蜜蜂十鼓快打",
    bpm: 108,
    offset_ms: 150,
    beats_per_bar: 4,
    grid: 16,
    stars: 3,
    theme: "grass",
    mascot: "assets/chars/chick.png",
    desc: "輕快十六分音符連擊，訓練鼓面與鼓邊快速切換反應。",
    pattern: [
      "D.D.D...K.K.K...",
      "D.K.D.K.D.D.D...",
      "K.K.K...D.D.D...",
      "K.D.K.D.K.K.K...",
      "DD..DD..KK..KK..",
      "D.D.K.K.D.D.K.K.",
      "DDDDDDDD........",
      "KKKKKKKKD...D..."
    ]
  },
  {
    id: "s03",
    title: "雷霆戰鼓齊奏曲",
    bpm: 120,
    offset_ms: 150,
    beats_per_bar: 4,
    grid: 16,
    stars: 4,
    theme: "fall",
    mascot: "assets/chars/bear.png",
    desc: "進階密集鼓點與切分節奏，挑戰全隊最高連擊默契！",
    pattern: [
      "D.D.K...D.D.K...",
      "D.K.D.K.D.D.K...",
      "DDDDK...KKKKD...",
      "D.K.D.K.DDDDK...",
      "D..D..D.K..K..K.",
      "D.D.K.K.D.K.D.K.",
      "DDDDKKKKDDDD....",
      "D.K.D.K.D...D..."
    ]
  }
];

/**
 * 試算表初始化工作表與欄位
 */
function initSheetsIfNeeded() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let songSheet = ss.getSheetByName(SHEET_NAME_SONGS);
  if (!songSheet) {
    songSheet = ss.insertSheet(SHEET_NAME_SONGS);
    // 寫入表頭
    songSheet.appendRow([
      '曲目ID (id)',
      '曲名 (title)',
      '節奏速度 (bpm)',
      '拍號 (beats_per_bar)',
      '每小節切分 (grid)',
      '難度星級 (stars)',
      '背景主題 (theme)',
      '角色吉祥物 (mascot)',
      '延遲補償 (offset_ms)',
      '說明簡介 (desc)',
      '鼓譜代碼 (pattern JSON)',
      '最後更新時間 (updated_at)'
    ]);
    songSheet.getRange(1, 1, 1, 12).setBackground('#2b3558').setFontColor('#ffffff').setFontWeight('bold');
    
    // 寫入預設曲目
    DEFAULT_SONGS.forEach(song => {
      songSheet.appendRow([
        song.id,
        song.title,
        song.bpm,
        song.beats_per_bar,
        song.grid,
        song.stars,
        song.theme,
        song.mascot,
        song.offset_ms,
        song.desc,
        JSON.stringify(song.pattern),
        new Date()
      ]);
    });
    songSheet.autoResizeColumns(1, 12);
  }

  let scoreSheet = ss.getSheetByName(SHEET_NAME_SCORES);
  if (!scoreSheet) {
    scoreSheet = ss.insertSheet(SHEET_NAME_SCORES);
    scoreSheet.appendRow(['時間', '曲目ID', '曲名', '模式', '得分', '最大連擊', '良', '可', '不可', '準確率%', '平均偏差ms']);
    scoreSheet.getRange(1, 1, 1, 11).setBackground('#1e243b').setFontColor('#ffd32a').setFontWeight('bold');
  }

  let calibSheet = ss.getSheetByName(SHEET_NAME_CALIB);
  if (!calibSheet) {
    calibSheet = ss.insertSheet(SHEET_NAME_CALIB);
    calibSheet.appendRow(['更新時間', '音量門檻', '延遲補償ms', '樣本數量', '校準特徵 JSON']);
    calibSheet.getRange(1, 1, 1, 5).setBackground('#2b3558').setFontColor('#ffd32a').setFontWeight('bold');
  }
}

/**
 * 處理 GET 請求
 */
function doGet(e) {
  initSheetsIfNeeded();
  const action = (e && e.parameter && e.parameter.action) || 'getSongs';

  if (action === 'getSongs') {
    const songs = getSongsFromSheet();
    return createJsonResponse({ status: 'success', data: songs });
  }

  if (action === 'getCalibration') {
    const calib = getCalibrationFromSheet();
    return createJsonResponse({ status: 'success', data: calib });
  }

  return createJsonResponse({ status: 'error', message: '未知操作' });
}

/**
 * 處理 POST 請求 (儲存曲目 / 記錄成績 / 儲存校準)
 */
function doPost(e) {
  initSheetsIfNeeded();
  try {
    let payload = {};
    if (e.postData && e.postData.contents) {
      payload = JSON.parse(e.postData.contents);
    } else if (e.parameter && e.parameter.data) {
      payload = JSON.parse(e.parameter.data);
    }

    const action = payload.action || (e.parameter && e.parameter.action);

    if (action === 'saveSong') {
      const savedSong = saveOrUpdateSong(payload.song);
      return createJsonResponse({ status: 'success', data: savedSong });
    }

    if (action === 'saveScore') {
      recordScore(payload.score);
      return createJsonResponse({ status: 'success' });
    }

    if (action === 'saveCalibration') {
      const savedCalib = saveCalibrationToSheet(payload.calibration);
      return createJsonResponse({ status: 'success', data: savedCalib });
    }

    return createJsonResponse({ status: 'error', message: '未知 action' });
  } catch (err) {
    return createJsonResponse({ status: 'error', message: err.toString() });
  }
}

function getSongsFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_SONGS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return DEFAULT_SONGS;

  const songs = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[0] || !row[1]) continue;
    let pattern = [];
    try {
      pattern = JSON.parse(row[10]);
    } catch (err) {
      pattern = String(row[10]).split('\n').filter(Boolean);
    }
    songs.push({
      id: String(row[0]),
      title: String(row[1]),
      bpm: Number(row[2]) || 100,
      beats_per_bar: Number(row[3]) || 4,
      grid: Number(row[4]) || 16,
      stars: Number(row[5]) || 3,
      theme: String(row[6]) || 'castles',
      mascot: String(row[7]) || 'assets/chars/panda.png',
      offset_ms: Number(row[8]) || 0,
      desc: String(row[9] || ''),
      pattern: pattern
    });
  }
  return songs;
}

function saveOrUpdateSong(song) {
  if (!song || !song.title) throw new Error('缺少曲目資訊');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_SONGS);
  const data = sheet.getDataRange().getValues();

  if (!song.id) {
    song.id = 'song_' + Date.now();
  }

  let foundRow = -1;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(song.id)) {
      foundRow = i + 1;
      break;
    }
  }

  const rowValues = [
    song.id,
    song.title,
    song.bpm || 100,
    song.beats_per_bar || 4,
    song.grid || 16,
    song.stars || 3,
    song.theme || 'castles',
    song.mascot || 'assets/chars/panda.png',
    song.offset_ms || 0,
    song.desc || '',
    JSON.stringify(song.pattern || []),
    new Date()
  ];

  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, rowValues.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
  return song;
}

function recordScore(score) {
  if (!score) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_SCORES);
  sheet.appendRow([
    new Date(),
    score.songId || '',
    score.songTitle || '',
    score.mode || 'solo',
    score.score || 0,
    score.combo || 0,
    score.perfect || 0,
    score.good || 0,
    score.miss || 0,
    score.acc || 0,
    score.timing || 0
  ]);
}

function getCalibrationFromSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME_CALIB);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return null;
  const lastRow = data[data.length - 1];
  let samples = [];
  try {
    samples = JSON.parse(lastRow[4]);
  } catch (e) {
    samples = [];
  }
  return {
    updated_at: lastRow[0],
    threshold: Number(lastRow[1]) || 0.05,
    offsetMs: Number(lastRow[2]) || 0,
    samples: samples
  };
}

function saveCalibrationToSheet(calib) {
  if (!calib) throw new Error('缺少校準資料');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME_CALIB);
  if (!sheet) {
    initSheetsIfNeeded();
    sheet = ss.getSheetByName(SHEET_NAME_CALIB);
  }
  const samplesJson = JSON.stringify(calib.samples || []);
  sheet.appendRow([
    new Date(),
    calib.threshold || 0.05,
    calib.offsetMs || 0,
    (calib.samples || []).length,
    samplesJson
  ]);
  return calib;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
