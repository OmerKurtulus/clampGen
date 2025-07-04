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

// Parse CSS values with multiple values (like margin: 0 0 13px)
function parseMultipleValues(value, maxViewport, minViewport, prop) {
    const values = value.trim().split(/\s+/);
    const processedValues = values.map(val => {
        if (val === '0' || val === '0px' || val === '1' || val === '1px') {
            return val === '0px' ? '0' : val;
        }
        
        if (val.includes('px')) {
            const pxValue = parseFloat(val.replace('px', ''));
            if (!isNaN(pxValue) && pxValue !== 0 && pxValue !== 1) {
                const isNegative = pxValue < 0;
                const absoluteValue = Math.abs(pxValue);
                const clampResult = calculateClamp(absoluteValue, maxViewport, minViewport);
                
                // Apply 13px minimum only for font-size
                if (prop === 'font-size') {
                    const minValue = Math.max(clampResult.min, 13);
                    const clampValue = `clamp(${minValue.toFixed(2)}px, ${clampResult.vw.toFixed(4)}vw, ${clampResult.max}px)`;
                    return isNegative ? `calc(-1 * ${clampValue})` : clampValue;
                }
                
                const clampValue = `clamp(${clampResult.min.toFixed(2)}px, ${clampResult.vw.toFixed(4)}vw, ${clampResult.max}px)`;
                return isNegative ? `calc(-1 * ${clampValue})` : clampValue;
            }
        }
        
        return val;
    });
    
    return processedValues.join(' ');
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
    const excludedProperties = ['letter-spacing', 'border', 'box-shadow', 'max-width', 'max-height', 'min-width', 'min-height'];
    
    // Process CSS - improved regex to handle all CSS blocks properly
    let processedCSS = cssInput;
    
    // Find all CSS blocks with improved regex that handles nested structures
    const cssBlockRegex = /([^{}]+)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g;
    let match;
    const blocks = [];
    
    while ((match = cssBlockRegex.exec(cssInput)) !== null) {
        blocks.push({
            selector: match[1].trim(),
            rules: match[2],
            fullMatch: match[0],
            startIndex: match.index
        });
    }
    
    // Process blocks in reverse order to avoid index shifting issues
    blocks.reverse().forEach(block => {
        const { selector, rules, fullMatch } = block;
        
        // Parse individual CSS properties
        const properties = rules.split(';').filter(prop => prop.trim());
        let updatedRules = '';
        let fontSize = null;
        let lineHeight = null;
        
        // First pass: collect font-size and line-height
        properties.forEach(property => {
            const colonIndex = property.indexOf(':');
            if (colonIndex === -1) return;
            
            const prop = property.substring(0, colonIndex).trim();
            const value = property.substring(colonIndex + 1).trim();
            
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
            const colonIndex = property.indexOf(':');
            if (colonIndex === -1) {
                if (property.trim()) {
                    updatedRules += `    ${property.trim()};\n`;
                }
                return;
            }
            
            const prop = property.substring(0, colonIndex).trim();
            const value = property.substring(colonIndex + 1).trim();
            
            if (!prop || !value) {
                if (property.trim()) {
                    updatedRules += `    ${property.trim()};\n`;
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
                    const ratio = pxValue / fontSize;
                    // Check if ratio is a whole number
                    const formattedRatio = ratio % 1 === 0 ? ratio.toString() : ratio.toFixed(10).replace(/\.?0+$/, '');
                    updatedRules += `    ${prop}: ${formattedRatio};\n`;
                    return;
                }
            }
            
            // Handle properties with multiple values (like margin, padding)
            if (value.includes('px') && /\s/.test(value.trim())) {
                const processedValue = parseMultipleValues(value, maxViewport, minViewport, prop);
                updatedRules += `    ${prop}: ${processedValue};\n`;
                return;
            }
            
            // Handle font-size with minimum 13px constraint
            if (prop === 'font-size' && value.includes('px')) {
                const pxValue = parseFloat(value.replace('px', ''));
                if (!isNaN(pxValue) && pxValue !== 0 && pxValue !== 1) {
                    const clampResult = calculateClamp(pxValue, maxViewport, minViewport);
                    const minValue = Math.max(clampResult.min, 13); // Minimum 13px for font-size
                    const clampValue = `clamp(${minValue.toFixed(2)}px, ${clampResult.vw.toFixed(4)}vw, ${clampResult.max}px)`;
                    updatedRules += `    ${prop}: ${clampValue};\n`;
                    return;
                }
            }
            
            // Handle other single px values
            if (value.includes('px') && prop !== 'line-height') {
                const pxValue = parseFloat(value.replace('px', ''));
                if (!isNaN(pxValue) && pxValue !== 0 && pxValue !== 1) {
                    const isNegative = pxValue < 0;
                    const absoluteValue = Math.abs(pxValue);
                    const clampResult = calculateClamp(absoluteValue, maxViewport, minViewport);
                    const clampValue = `clamp(${clampResult.min.toFixed(2)}px, ${clampResult.vw.toFixed(4)}vw, ${clampResult.max}px)`;
                    
                    if (isNegative) {
                        updatedRules += `    ${prop}: calc(-1 * ${clampValue});\n`;
                    } else {
                        updatedRules += `    ${prop}: ${clampValue};\n`;
                    }
                    return;
                }
            }
            
            // Keep original value if no processing needed
            updatedRules += `    ${prop}: ${value};\n`;
        });
        
        // Replace the original block with the processed one
        const newBlock = `${selector} {\n${updatedRules}}`;
        processedCSS = processedCSS.replace(fullMatch, newBlock);
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

function handleDownloadCSS() {
    const outputText = document.getElementById('cssOutput').value;
    if (!outputText.trim()) {
        alert('No processed CSS to download. Please process CSS first.');
        return;
    }
    
    // Create a blob with the CSS content
    const blob = new Blob([outputText], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary download link
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = 'style.css';
    downloadLink.style.display = 'none';
    
    // Add to DOM, click, and remove
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
    
    // Show confirmation message
    const copyMessage = document.getElementById('copyMessage');
    copyMessage.textContent = 'Downloaded';
    showElement(copyMessage);

    setTimeout(() => setOpacity(copyMessage, '1'), 10);
    setTimeout(() => {
        setOpacity(copyMessage, '0');
        setTimeout(() => {
            hideElement(copyMessage);
            copyMessage.textContent = 'Copied'; // Reset text
        }, 500);
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
const downloadCssBtn = document.getElementById('downloadCssBtn');

automaticClampBtn.addEventListener('click', handleAutomaticClampOpen);
closeAutomaticClampBtn.addEventListener('click', handleAutomaticClampClose);
processCssBtn.addEventListener('click', processCSS);
copyOutputBtn.addEventListener('click', handleCopyOutput);
downloadCssBtn.addEventListener('click', handleDownloadCSS);

window.addEventListener('click', (event) => {
    if (event.target === blurBackground) {
        handleClosePopup();
        handleAutomaticClampClose();
    }
});