// ============================================================
// Dice Auto-Fill Extension - TreeWalker Edition
// ============================================================
console.log('[Dice Automator] ✅ Script loaded on:', window.location.href);

// ── HELPERS ──────────────────────────────────────────────────────────────────

// Set value on a React-controlled input (bypasses React's synthetic event system)
function setReactValue(input, value) {
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeSetter.call(input, value);
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
}

// Find and click an element by its EXACT visible text using TreeWalker
// This works even for complex React Aria / Tailwind components
function clickElementByText(exactText) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) {
        const textNode = walker.currentNode;
        if (textNode.textContent.trim() === exactText) {
            // Walk UP the DOM to find the nearest clickable parent
            let el = textNode.parentElement;
            while (el && el !== document.body) {
                const tag = el.tagName;
                const role = el.getAttribute('role') || '';
                const hasDataRac = el.hasAttribute('data-rac');
                if (tag === 'BUTTON' || role === 'radio' || role === 'option'
                    || role === 'tab' || hasDataRac) {
                    console.log('[Dice Automator] 🖱️ Clicking:', exactText, '| Element:', tag, role);
                    el.click();
                    el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                    return true;
                }
                el = el.parentElement;
            }
            // No known clickable found — click the direct parent anyway
            if (textNode.parentElement) {
                console.log('[Dice Automator] 🖱️ Fallback click for:', exactText);
                textNode.parentElement.click();
                return true;
            }
        }
    }
    console.warn('[Dice Automator] ⚠️ Could not find text on page:', exactText);
    return false;
}

// Find input next to a visible label text
function findInputByLabelText(labelText) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    while (walker.nextNode()) {
        const textNode = walker.currentNode;
        if (textNode.textContent.trim().replace(/\s*\*\s*$/, '') === labelText) {
            let el = textNode.parentElement;
            // Look for input in siblings or parent's children
            for (let i = 0; i < 6; i++) {
                if (!el) break;
                const input = el.querySelector('input:not([type="hidden"])');
                if (input) return input;
                el = el.parentElement;
            }
        }
    }
    return null;
}

// ── MAIN ─────────────────────────────────────────────────────────────────────

chrome.storage.local.get(['pendingDiceJob'], (result) => {
    if (!result.pendingDiceJob) {
        console.warn('[Dice Automator] ❌ No pending job found in storage.');
        return;
    }

    const job = result.pendingDiceJob;
    console.log('[Dice Automator] ✅ Job data:', JSON.stringify(job));

    const done = {
        title: false,
        onSite: false,
        location: false,
        range: false,
        description: false
    };

    const fillInterval = setInterval(() => {
        // Do nothing if we are on the login page!
        if (window.location.href.toLowerCase().includes('login')) {
            return;
        }

        // ── STEP 1: JOB TITLE ────────────────────────────────────────────
        if (!done.title) {
            const form = document.querySelector('form');
            if (form) {
                const inputs = Array.from(form.querySelectorAll('input:not([type="hidden"])'));
                const titleInput = inputs.find(i => !i.closest('[data-testid="reference-id"]'));
                if (titleInput && !titleInput.value) {
                    console.log('[Dice Automator] 📝 Filling Job Title:', job.title);
                    setReactValue(titleInput, job.title);
                    done.title = true;
                }
            }
        }

        // ── STEP 3: WORK SETTING ───────────────────────
        if (!done.onSite) { // We'll just keep the flag named 'onSite' for simplicity, but it means workSetting clicked
            // Map the ERP work setting to Dice's button text
            let settingText = 'On-Site';
            if (job.workSetting) {
                const ws = job.workSetting.toLowerCase();
                if (ws === 'remote') settingText = 'Remote';
                else if (ws === 'hybrid') settingText = 'Hybrid';
            }

            const clicked = clickElementByText(settingText);
            if (clicked) {
                console.log('[Dice Automator] 🖱️ Clicked Work Setting:', settingText);
                done.onSite = true;
            }
        }

        // ── STEP 4: LOCATION ─────────────────────────────────────────────
        if (!done.location && done.onSite) {
            let locInput = document.querySelector('input[placeholder="Location"]');
            if (!locInput) locInput = findInputByLabelText('Location');

            if (locInput && !locInput.value) {
                // If ERP location is literally just "Remote, US", don't fill it because Dice rejects it.
                // Dice requires a real City, State format.
                const firstLoc = (job.location || '').split('|')[0].trim();
                
                if (firstLoc.toLowerCase().includes('remote') && firstLoc.length < 15) {
                    console.log('[Dice Automator] 📍 Skipping location because it is generic Remote:', firstLoc);
                    done.location = true; // Mark as done without filling so it doesn't cause a validation error
                } else {
                    console.log('[Dice Automator] 📍 Filling Location:', firstLoc);
                    locInput.focus();
                    setReactValue(locInput, firstLoc);
                    done.location = true;
                }
            }
        }

        // ── STEP 5: PAY TYPE — Click "Range" & Fill Pay ─────────────────────
        if (!done.range) {
            const rangeClicked = clickElementByText('Range');
            if (rangeClicked) {
                // Wait for inputs to appear
                setTimeout(() => {
                    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
                    let payInputs = null;
                    while (walker.nextNode()) {
                        const textNode = walker.currentNode;
                        if (textNode.textContent.trim().startsWith('Pay Range (USD)')) {
                            let el = textNode.parentElement;
                            for (let i = 0; i < 6; i++) {
                                if (!el) break;
                                const inputs = Array.from(el.querySelectorAll('input:not([type="hidden"])'));
                                if (inputs.length >= 2) {
                                    payInputs = inputs;
                                    break;
                                }
                                el = el.parentElement;
                            }
                            if (payInputs) break;
                        }
                    }
                    if (payInputs && payInputs.length >= 2) {
                        if (job.minRate) setReactValue(payInputs[0], String(job.minRate));
                        if (job.maxRate) setReactValue(payInputs[1], String(job.maxRate));
                        console.log('[Dice Automator] 💰 Filled Pay Range:', job.minRate, '-', job.maxRate);
                    }
                }, 500); // Wait a half second for React to render the inputs
                done.range = true;
            }
        }

        // ── STEP 6: DESCRIPTION (Step 2 — TinyMCE) ───────────────────────
        if (true) {
            const tinyFrame = document.querySelector('.tox-edit-area__iframe');
            if (tinyFrame) {
                try {
                    const iDoc = tinyFrame.contentDocument || tinyFrame.contentWindow.document;
                    if (iDoc && iDoc.body) {
                        const bodyContent = iDoc.body.innerHTML.replace(/<br[^>]*>/gi, '').trim();
                        // Only fill if empty
                        if (bodyContent === '' || bodyContent === '<p></p>') {
                            console.log('[Dice Automator] 📄 Filling via TinyMCE iframe...');
                            
                            // 1. Focus the editor
                            iDoc.body.focus();
                            
                            // 2. Set the HTML
                            iDoc.body.innerHTML = job.description;
                            
                            // 3. Move cursor to the end
                            const range = iDoc.createRange();
                            range.selectNodeContents(iDoc.body);
                            range.collapse(false);
                            const sel = tinyFrame.contentWindow.getSelection();
                            sel.removeAllRanges();
                            sel.addRange(range);
                            
                            // 4. Dispatch events to wake up TinyMCE's internal word counter and React state
                            const eventOpts = { bubbles: true, cancelable: true };
                            iDoc.body.dispatchEvent(new Event('input', eventOpts));
                            iDoc.body.dispatchEvent(new Event('change', eventOpts));
                            iDoc.body.dispatchEvent(new KeyboardEvent('keyup', { ...eventOpts, key: 'Space', code: 'Space', keyCode: 32 }));
                            
                            console.log('[Dice Automator] ✅ Description filled and events dispatched.');
                        }
                    }
                } catch (e) {
                    console.error('[Dice Automator] iframe error:', e);
                }
            }
            
            // If the user navigates back and forth, the iframe is destroyed and recreated.
            // If we see an iframe WITHOUT the data-auto-filled attribute, it will run again!
        }

    }, 2000); // Check every 2 seconds — gives Dice time to react to clicks

    // Stop after 15 minutes to allow plenty of time for back/forth navigation
    setTimeout(() => {
        clearInterval(fillInterval);
        console.log('[Dice Automator] Timeout reached, stopping.');
    }, 900000);
});
