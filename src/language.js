// Language handler for English, Chinese, and Arabic.

const languages = {
  en: {
    code: "en",
    label: "English",
    strings: {
      howToTitle: "HOW TO PLAY",
      howToLines: [
        "Use W/A/S/D to move.",
        "Left-click: Interact with objects.",
        "Right-click drag: Look around.",
        "SPACE: Throw item.",
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
    },
  },

  zr: {
    code: "zr",
    label: "中文",
    strings: {
      howToTitle: "test",
      howToLines: [
        "test",
        "test",
        "test",
        "test",
      ],
      startButton: "test",
      controlsText: "test",
      targetMessage: "test",
      victoryTitle: "test",
      victoryBody: "test",
      lossTitle: "test",
      lossBody: "test",
      playAgain: "test",
    },
  },
};

let currentLang = "en";

// DOM elements for the start overlay screen
let _startOverlay = null;
let _startButton = null;
let _howToTitleEl = null;
let _howToBodyEl = null;
let _langButtonsEl = null;

function getConfig() {
  return languages[currentLang];
}

export function initI18n({ startOverlay, startButton }) {
  _startOverlay = startOverlay;
  _startButton = startButton;

  if (!_startOverlay || !_startButton) return;

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
    btn.onclick = () => setLanguage(lang.code);
    _langButtonsEl.appendChild(btn);
  });

  _startOverlay.appendChild(_langButtonsEl);

  // HOW TO PLAY title
  _howToTitleEl = document.createElement("h2");
  _howToTitleEl.id = "how-to-title";
  _howToTitleEl.style.margin = "0 0 8px 0";
  _langButtonsEl.style.justifyContent = "center";
  _startOverlay.appendChild(_howToTitleEl);

  // Instructions body
  _howToBodyEl = document.createElement("div");
  _howToBodyEl.id = "how-to-body";
  _howToBodyEl.style.marginBottom = "12px";
  _startOverlay.appendChild(_howToBodyEl);

  // Start button
  _startButton.textContent = "START GAME";
  _startButton.style.marginTop = "8px";
  _startButton.style.padding = "8px 16px";
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
