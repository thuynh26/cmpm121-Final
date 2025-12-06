// Language handler for English, Chinese, and Arabic.

const languages = {
  en: {
    code: "en",
    label: "English",
    strings: {
      selectLang: "Select a Language: ",
      howToTitle: "HOW TO PLAY",
      howToLines: [
        "Use W/A/S/D to move.",
        "Left-click: Interact with objects.",
        "Right-click drag: Look around.",
        "SPACE: Throw item.",
        "Hold Oxygen Tank Item to replenish oxygen.",
      ],
      startButton: "START GAME",
      controlsText:
        "Controls: W/A/S/D to move | Right-click drag to look around | Left-click to interact | SPACE to throw",
      targetMessage: "Congrats you hit the target!",
      victoryTitle: "🎉 VICTORY! 🎉",
      victoryBody: "You completed the game!",
      lossTitle: "LOSE!",
      lossBody: "You ran out of oxygen!",
      playAgain: "Play Again",
      fuelTypeLabel: "FUEL TYPE",
    },
  },

  zr: {
    code: "zr",
    label: "中文",
    strings: {
      selectLang: "选择语言：",
      howToTitle: "怎么玩",
      howToLines: [
        "使用 W/A/S/D 键移动。",
        "单击鼠标左键：与对象交互。",
        "右键单击拖动：环顾四周。",
        "空格：丢弃物品。",
        "持有氧气罐物品以补充氧气",
      ],
      startButton: "开始游戏",
      controlsText:
        "操作方式: W/A/S/D 移動 | 右键拖动环顾四周 | 左键互动 | 空格键投掷",
      targetMessage: "恭喜你击中目标！",
      victoryTitle: "🎉 胜利！🎉",
      victoryBody: "你通关了！",
      lossTitle: "失去！",
      lossBody: "你氧气耗尽了！",
      playAgain: "再玩一次",
      fuelTypeLabel: "TEST",
    },
  },

  ar: {
    code: "ar",
    label: "العربية",
    strings: {
      selectLang: ":اختر لغة",
      howToTitle: "كيفية اللعب",
      howToLines: [
        ".استخدم W/A/S/D للتحرك",
        ".النقر بزر الماوس الأيسر: التفاعل مع الكائنات",
        ".انقر بزر الماوس الأيمن واسحب: انظر حولك",
        ".المسافة: رمي العنصر",
        "امسك بحاوية الأكسجين لتجديد الأكسجين.",
      ],
      startButton: "ابدأ اللعبة",
      controlsText:
        "أدوات التحكم: W/A/S/D للتحرك | انقر بزر الماوس الأيمن واسحب للنظر حولك | انقر بزر الماوس الأيسر للتفاعل | اضغط على مفتاح المسافة للرمي",
      targetMessage: "مبروك لقد أصبت الهدف",
      victoryTitle: "🎉 النصر 🎉",
      victoryBody: "لقد أكملت اللعبة",
      lossTitle: "يخسر",
      lossBody: "لقد نفد منك الأكسجين",
      playAgain: "العب مرة أخرى",
      fuelTypeLabel: "TEST 2",
    },
  },
};

let currentLang = "en";

// DOM elements for the start overlay screen
let _startOverlay = null;
let _langText = null;
let _startButton = null;
let _howToTitleEl = null;
let _howToBodyEl = null;
let _langButtonsEl = null;

function getConfig() {
  return languages[currentLang];
}

export function getStrings() {
  return getConfig().strings;
}

export function initI18n({ startOverlay, langText, startButton }) {
  _startOverlay = startOverlay;
  _startButton = startButton;
  _langText = langText;

  if (!_startOverlay || !_startButton) return;

  // Ask player to choose a language
  _langText.textContent = "Select a Language:";
  _langText.style.display = "flex";
  _langText.style.gap = "8px";
  _langText.style.justifyContent = "center";
  _langText.style.marginBottom = "12px";
  _startOverlay.appendChild(_langText);

  _langButtonsEl = document.createElement("div");
  _langButtonsEl.id = "language-buttons";
  _langButtonsEl.style.display = "flex";
  _langButtonsEl.style.gap = "8px";
  _langButtonsEl.style.justifyContent = "center";
  _langButtonsEl.style.marginBottom = "12px";

  // Create butons for language
  Object.values(languages).forEach((lang) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = lang.label;
    btn.style.cursor = "pointer";
    btn.onclick = () => setLanguage(lang.code);
    _langButtonsEl.appendChild(btn);
  });

  _startOverlay.appendChild(_langButtonsEl);

  // HOW TO PLAY title
  _howToTitleEl = document.createElement("h2");
  _howToTitleEl.id = "how-to-title";
  _howToTitleEl.style.margin = "0 0 8px 0";
  _howToTitleEl.style.justifyContent = "center";
  _startOverlay.appendChild(_howToTitleEl);

  // Instructions body
  _howToBodyEl = document.createElement("div");
  _howToBodyEl.id = "how-to-body";
  _howToBodyEl.style.justifyContent = "center";
  _startOverlay.appendChild(_howToBodyEl);

  // Start button
  _startButton.textContent = "START GAME";
  _startButton.style.justifyContent = "center";
  _startButton.style.cursor = "pointer";
  _startOverlay.appendChild(_startButton);

  setLanguage("en"); // default language
}

export function setLanguage(langCode) {
  if (!languages[langCode]) return;
  currentLang = langCode;
  updateStartScreenTexts();
  updateInGameTexts();
}

// Updates the HOW TO PLAY text and start button label.
function updateStartScreenTexts() {
  const cfg = getConfig();
  const s = cfg.strings;
  if (_langText && s.selectLang) {
    _langText.textContent = s.selectLang;
  }
  if (_howToTitleEl) {
    _howToTitleEl.textContent = s.howToTitle;
  }
  if (_howToBodyEl) {
    _howToBodyEl.innerHTML = s.howToLines.map((line) => `${line}`).join("<br>");
  }
  if (_startButton) {
    _startButton.textContent = s.startButton;
  }
}

// Update DOM texts (controls, target message, win + loss message).
function updateInGameTexts() {
  const cfg = getConfig();
  const s = cfg.strings;

  const controlsEl = document.getElementById("controls-text");
  if (controlsEl) {
    controlsEl.innerHTML = `<strong>${s.controlsText.split(":")[0]}:</strong> ${
      s.controlsText.split(":")[1] ?? s.controlsText
    }`;
  }

  const targetMsgEl = document.getElementById("target-message");
  if (targetMsgEl) {
    targetMsgEl.textContent = s.targetMessage;
  }

  const victoryTitleEl = document.getElementById("victory-title");
  const victoryBodyEl = document.getElementById("victory-body");
  const victoryBtnEl = document.getElementById("victory-reset-button");

  if (victoryTitleEl) victoryTitleEl.textContent = s.victoryTitle;
  if (victoryBodyEl) victoryBodyEl.textContent = s.victoryBody;
  if (victoryBtnEl) victoryBtnEl.textContent = s.playAgain;

  const lossTitleEl = document.getElementById("loss-title");
  const lossBodyEl = document.getElementById("loss-body");
  const lossBtnEl = document.getElementById("loss-reset-button");

  if (lossTitleEl) lossTitleEl.textContent = s.lossTitle;
  if (lossBodyEl) lossBodyEl.textContent = s.lossBody;
  if (lossBtnEl) lossBtnEl.textContent = s.playAgain;
}
