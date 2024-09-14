// Utility Functions
function getInputValue(id) {
    return parseFloat(document.getElementById(id).value);
}

function showElement(element, displayStyle = 'block') {
    element.style.display = displayStyle;
}

function hideElement(element) {
    element.style.display = 'none';
}

function setOpacity(element, value) {
    element.style.opacity = value;
}

function createAndCopyToClipboard(text) {
    const tempTextarea = document.createElement('textarea');
    tempTextarea.value = text;
    document.body.appendChild(tempTextarea);
    tempTextarea.select();
    document.execCommand('copy');
    document.body.removeChild(tempTextarea);
}

// Event Handlers
function handleConvertClick() {
    const clampMax = getInputValue('clampMax');
    const clampMin = getInputValue('clampMin');
    const targetValue = getInputValue('targetValue');
    const errorMessage = document.getElementById('error-message');

    if (isNaN(clampMax) || isNaN(clampMin) || isNaN(targetValue)) {
        showElement(errorMessage);
        return;
    }

    hideElement(errorMessage);

    const clampPercentageValue = Math.floor((targetValue / clampMax) * 100 * 10000) / 10000;
    const clampMinResult = Math.floor((clampPercentageValue * clampMin) / 100 * 100) / 100;
    const clampMaxResult = targetValue;

    const outputText = `clamp(${clampMinResult.toFixed(2)}px, ${clampPercentageValue.toFixed(4)}vw, ${clampMaxResult}px)`;
    document.getElementById('output').textContent = outputText;
}

function handleCopyClick() {
    const outputText = document.getElementById('output').textContent;
    createAndCopyToClipboard(outputText);

    const copyMessage = document.getElementById('copyMessage');
    showElement(copyMessage);

    setTimeout(() => setOpacity(copyMessage, '1'), 10);
    setTimeout(() => {
        setOpacity(copyMessage, '0');
        setTimeout(() => hideElement(copyMessage), 500);
    }, 3000);
}

function handleInfoPopup() {
    const infoPopup = document.getElementById('infoPopup');
    const blurBackground = document.getElementById('blurBackground');
    
    showElement(infoPopup);
    showElement(blurBackground);
}

function handleClosePopup() {
    const infoPopup = document.getElementById('infoPopup');
    const blurBackground = document.getElementById('blurBackground');

    hideElement(infoPopup);
    hideElement(blurBackground);
}

function handleThemeToggle() {
    const theme = document.body.classList.contains('light-mode') ? 'dark' : 'light';
    setTheme(theme);
    localStorage.setItem('theme', theme);
}

// Set Theme
function setTheme(theme) {
    if (theme === 'light') {
        document.body.classList.add('light-mode');
    } else {
        document.body.classList.remove('light-mode');
    }
}

const themeToggleBtn = document.getElementById('themeToggleBtn');
const savedTheme = localStorage.getItem('theme') || 'light';
setTheme(savedTheme);
themeToggleBtn.addEventListener('click', handleThemeToggle);


 window.addEventListener('DOMContentLoaded', () => {
    const toggle = document.getElementById('darkmode-toggle');
    const body = document.body;

    if (!body.classList.contains('light-mode')) {
      toggle.checked = true;
    }
});

// Main Event Listeners
document.getElementById('convertBtn').addEventListener('click', handleConvertClick);
document.getElementById('copyBtn').addEventListener('click', handleCopyClick);

const infoButton = document.querySelector('.info-button');
const closePopupBtn = document.getElementById('closePopupBtn');
const blurBackground = document.getElementById('blurBackground');

infoButton.addEventListener('click', handleInfoPopup);
closePopupBtn.addEventListener('click', handleClosePopup);
window.addEventListener('click', (event) => {
    if (event.target === blurBackground) {
        handleClosePopup();
    }
});