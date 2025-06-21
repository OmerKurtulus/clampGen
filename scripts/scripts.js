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

// Clamp calculation function
function calculateClamp(targetValue, maxViewport, minViewport) {
    const clampPercentageValue = Math.floor((targetValue / maxViewport) * 100 * 10000) / 10000;
    const clampMinResult = Math.floor((clampPercentageValue * minViewport) / 100 * 100) / 100;
    const clampMaxResult = targetValue;
    
    return {
        min: clampMinResult,
        vw: clampPercentageValue,
        max: clampMaxResult
    };
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

    const clampResult = calculateClamp(targetValue, clampMax, clampMin);
    const outputText = `clamp(${clampResult.min.toFixed(2)}px, ${clampResult.vw.toFixed(4)}vw, ${clampResult.max}px)`;
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

// Automatic Clamp Functions
function handleAutomaticClampOpen() {
    const automaticClampPopup = document.getElementById('automaticClampPopup');
    const blurBackground = document.getElementById('blurBackground');
    
    showElement(automaticClampPopup);
    showElement(blurBackground);
}

function handleAutomaticClampClose() {
    const automaticClampPopup = document.getElementById('automaticClampPopup');
    const blurBackground = document.getElementById('blurBackground');

    hideElement(automaticClampPopup);
    hideElement(blurBackground);
}

function processCSS() {
    const cssInput = document.getElementById('cssInput').value;
    const maxViewport = getInputValue('autoClampMax');
    const minViewport = getInputValue('autoClampMin');
    
    if (!cssInput.trim() || isNaN(maxViewport) || isNaN(minViewport)) {
        alert('Please enter valid CSS code and viewport values.');
        return;
    }

    // Properties that should NOT be clamped
    const excludedProperties = ['letter-spacing', 'border', 'box-shadow'];
    
    // Process CSS
    let processedCSS = cssInput;
    
    // Find all CSS blocks
    const cssBlocks = processedCSS.match(/[^{}]+\{[^{}]*\}/g) || [];
    
    cssBlocks.forEach(block => {
        const [selector, rules] = block.split('{');
        const rulesContent = rules.replace('}', '');
        
        // Parse individual CSS properties
        const properties = rulesContent.split(';').filter(prop => prop.trim());
        let updatedRules = '';
        let fontSize = null;
        let lineHeight = null;
        
        // First pass: collect font-size and line-height
        properties.forEach(property => {
            const [prop, value] = property.split(':').map(s => s.trim());
            if (prop === 'font-size' && value && value.includes('px')) {
                const pxValue = parseFloat(value.replace('px', ''));
                if (!isNaN(pxValue)) {
                    fontSize = pxValue;
                }
            }
            if (prop === 'line-height' && value && value.includes('px')) {
                const pxValue = parseFloat(value.replace('px', ''));
                if (!isNaN(pxValue)) {
                    lineHeight = pxValue;
                }
            }
        });
        
        // Second pass: process properties
        properties.forEach(property => {
            const [prop, value] = property.split(':').map(s => s.trim());
            
            if (!prop || !value) {
                if (property.trim()) {
                    updatedRules += `    ${property};\n`;
                }
                return;
            }
            
            // Skip excluded properties
            if (excludedProperties.some(excluded => prop.includes(excluded))) {
                updatedRules += `    ${prop}: ${value};\n`;
                return;
            }
            
            // Handle line-height conversion
            if (prop === 'line-height' && value.includes('px') && fontSize) {
                const pxValue = parseFloat(value.replace('px', ''));
                if (!isNaN(pxValue)) {
                    const ratio = (pxValue / fontSize).toFixed(10);
                    updatedRules += `    ${prop}: ${ratio};\n`;
                    return;
                }
            }
            
            // Handle font-size with minimum 13px constraint
            if (prop === 'font-size' && value.includes('px')) {
                const pxValue = parseFloat(value.replace('px', ''));
                if (!isNaN(pxValue)) {
                    const clampResult = calculateClamp(pxValue, maxViewport, minViewport);
                    const minValue = Math.max(clampResult.min, 13); // Minimum 13px for font-size
                    const clampValue = `clamp(${minValue.toFixed(2)}px, ${clampResult.vw.toFixed(4)}vw, ${clampResult.max}px)`;
                    updatedRules += `    ${prop}: ${clampValue};\n`;
                    return;
                }
            }
            
            // Handle other px values
            if (value.includes('px') && prop !== 'line-height') {
                const pxValue = parseFloat(value.replace('px', ''));
                if (!isNaN(pxValue)) {
                    const clampResult = calculateClamp(pxValue, maxViewport, minViewport);
                    const clampValue = `clamp(${clampResult.min.toFixed(2)}px, ${clampResult.vw.toFixed(4)}vw, ${clampResult.max}px)`;
                    updatedRules += `    ${prop}: ${clampValue};\n`;
                    return;
                }
            }
            
            // Keep original value if no processing needed
            updatedRules += `    ${prop}: ${value};\n`;
        });
        
        // Replace the original block with the processed one
        const newBlock = `${selector.trim()} {\n${updatedRules}}`;
        processedCSS = processedCSS.replace(block, newBlock);
    });
    
    document.getElementById('cssOutput').value = processedCSS;
}

function handleCopyOutput() {
    const outputText = document.getElementById('cssOutput').value;
    if (!outputText.trim()) {
        alert('No processed CSS to copy. Please process CSS first.');
        return;
    }
    
    createAndCopyToClipboard(outputText);
    
    const copyMessage = document.getElementById('copyMessage');
    showElement(copyMessage);

    setTimeout(() => setOpacity(copyMessage, '1'), 10);
    setTimeout(() => {
        setOpacity(copyMessage, '0');
        setTimeout(() => hideElement(copyMessage), 500);
    }, 3000);
}

// Theme initialization
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

// Automatic Clamp Event Listeners
const automaticClampBtn = document.getElementById('automaticClampBtn');
const closeAutomaticClampBtn = document.getElementById('closeAutomaticClampBtn');
const processCssBtn = document.getElementById('processCssBtn');
const copyOutputBtn = document.getElementById('copyOutputBtn');

automaticClampBtn.addEventListener('click', handleAutomaticClampOpen);
closeAutomaticClampBtn.addEventListener('click', handleAutomaticClampClose);
processCssBtn.addEventListener('click', processCSS);
copyOutputBtn.addEventListener('click', handleCopyOutput);

window.addEventListener('click', (event) => {
    if (event.target === blurBackground) {
        handleClosePopup();
        handleAutomaticClampClose();
    }
});