// This script runs automatically when employers.indeed.com is opened
console.log("Indeed Automation Script Injected");

chrome.storage.local.get(["pendingIndeedJob"], (result) => {
    if (result.pendingIndeedJob) {
        console.log("Found Indeed job to post:", result.pendingIndeedJob);
        // Start the state machine to fill the Indeed form
        startIndeedAutomation(result.pendingIndeedJob);
    }
});

// Helper to set React input values
function setReactInputValue(element, value) {
    if (!element) return;
    
    element.focus();

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
    const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
    
    if (element.tagName === 'TEXTAREA' && nativeTextAreaValueSetter) {
        nativeTextAreaValueSetter.call(element, value);
    } else if (nativeInputValueSetter) {
        nativeInputValueSetter.call(element, value);
    } else {
        element.value = value;
    }

    element.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    element.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, composed: true, key: 'Enter', code: 'Enter', keyCode: 13 }));
    element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true, composed: true, key: 'Enter', code: 'Enter', keyCode: 13 }));
    element.blur();
}

function findElementByText(tag, text) {
    const elements = Array.from(document.querySelectorAll(tag));
    return elements.find(el => el.innerText.trim() === text || el.innerText.trim().includes(text)) || null;
}

function findInputByLabel(labelText) {
    const labels = document.querySelectorAll('label');
    for (let label of labels) {
        if (label.innerText.trim().includes(labelText)) {
            const id = label.getAttribute('for');
            if (id) {
                return document.getElementById(id);
            }
            const input = label.querySelector('input');
            if (input) return input;
            
            let next = label.nextElementSibling;
            while (next) {
                if (next.tagName === 'INPUT' || next.tagName === 'SELECT') return next;
                if (next.querySelector('input') || next.querySelector('button') || next.querySelector('select')) {
                    return next.querySelector('input') || next.querySelector('button') || next.querySelector('select');
                }
                next = next.nextElementSibling;
            }
        }
    }
    return null;
}

// Helper to interact with custom Indeed dropdowns
async function selectDropdownOption(labelText, optionText) {
    const labels = Array.from(document.querySelectorAll('label, legend, span, h2, h3'));
    const label = labels.find(l => l.innerText && l.innerText.includes(labelText));
    
    if (label) {
        let parent = label.parentElement;
        let trigger = null;
        for (let i = 0; i < 4 && parent; i++) {
            trigger = parent.querySelector('button[aria-haspopup], [role="combobox"], select');
            if (!trigger) {
                const buttons = Array.from(parent.querySelectorAll('button'));
                trigger = buttons.find(b => b.innerText.includes("Select an option") || b.innerText.includes("In person") || b.innerText.includes("Remote") || b.innerText.includes("Hybrid"));
            }
            if (trigger) break;
            parent = parent.parentElement;
        }
        
        if (trigger) {
            trigger.click(); // Open dropdown
            await new Promise(r => setTimeout(r, 600)); // Wait for animation
            
            // Find the option to click
            const possibleItems = Array.from(document.querySelectorAll('li, [role="option"], [role="menuitem"]'));
            let option = possibleItems.find(o => o.innerText && o.innerText.toLowerCase().includes(optionText.toLowerCase()));
            
            if (!option) {
                // aggressive leaf node search to prevent clicking massive container divs
                const allNodes = Array.from(document.querySelectorAll('*'));
                option = allNodes.find(o => {
                    const txt = (o.innerText || "").trim().toLowerCase();
                    // Match short text elements with no children (leaf nodes)
                    return txt.includes(optionText.toLowerCase()) && txt.length < 60 && o.children.length === 0;
                });
            }

            if (option) {
                option.click();
                return true;
            } else {
                console.log("Could not find dropdown option for:", optionText);
            }
        }
    }
    return false;
}

function startIndeedAutomation(jobData) {
    let currentPageState = '';
    
    const runState = async () => {
        try {
            const bodyText = document.body.innerText;
            
            if (bodyText.includes("The job post will be in") || bodyText.includes("Job title")) {
                if (currentPageState !== 'basics') {
                    console.log("On Basics Page");
                    currentPageState = 'basics';
                }
                
                // Automate switching to United States
                if (bodyText.includes("The job post will be in") && !bodyText.includes("United States")) {
                    console.log("Switching country to United States...");
                    let pencilBtn = null;
                    const allElements = Array.from(document.querySelectorAll('*'));
                    const textNode = allElements.find(s => s.innerText && s.innerText.trim().startsWith("The job post will be in") && s.children.length <= 2);
                    
                    if (textNode) {
                        pencilBtn = textNode.parentElement.querySelector('button') || textNode.querySelector('button');
                    }
                    if (!pencilBtn) {
                        const btns = Array.from(document.querySelectorAll('button'));
                        pencilBtn = btns.find(b => b.parentElement && b.parentElement.innerText.includes("The job post will be in"));
                    }
                    
                    if (pencilBtn) {
                        pencilBtn.click();
                        await new Promise(r => setTimeout(r, 1000));
                        
                        const dialog = document.querySelector('[role="dialog"]');
                        if (dialog) {
                            const combobox = dialog.querySelector('button[aria-haspopup], [role="combobox"], select');
                            if (combobox) combobox.click();
                            await new Promise(r => setTimeout(r, 600));
                            
                            const options = Array.from(document.querySelectorAll('li, [role="option"], [role="menuitem"]'));
                            const usOption = options.find(o => o.innerText && o.innerText.trim() === "United States");
                            if (usOption) usOption.click();
                            
                            await new Promise(r => setTimeout(r, 500));
                            
                            const doneBtn = Array.from(dialog.querySelectorAll('button')).find(b => b.innerText && b.innerText.includes("Done"));
                            if (doneBtn) doneBtn.click();
                            
                            // Wait for modal to close and page to refresh
                            await new Promise(r => setTimeout(r, 1500));
                            setTimeout(runState, 1500); // RESTART THE LOOP
                            return; // Exit current execution
                        }
                    }
                }
                
                // Job Title
                const titleInput = findInputByLabel("Job title") || document.querySelector('input[name="jobTitle"]');
                if (titleInput && !titleInput.value) {
                    setReactInputValue(titleInput, jobData.jobTitle || jobData.title || "");
                }
                
                // Job Location Type (Remote vs Hybrid vs In person)
                const locationStr = (jobData.location || "").toLowerCase();
                const workSettingStr = (jobData.workSetting || "").toLowerCase();
                
                if (locationStr.includes("hybrid") || workSettingStr.includes("hybrid")) {
                    await selectDropdownOption("Job location type", "Hybrid");
                } else if (locationStr.includes("remote") || workSettingStr.includes("remote")) {
                    await selectDropdownOption("Job location type", "Fully remote");
                } else {
                    await selectDropdownOption("Job location type", "In person");
                }
                
                await new Promise(r => setTimeout(r, 600));
                const locationInput = findInputByLabel("What is the job location?") || findInputByLabel("Street address") || document.querySelector('input[name="jobLocation"]');
                if (locationInput && !locationInput.value && jobData.location) {
                    // Format location to be "City, State" (removing country like "US")
                    let formattedLocation = jobData.location;
                    const parts = formattedLocation.split(',');
                    if (parts.length >= 2) {
                        formattedLocation = `${parts[0].trim()}, ${parts[1].trim()}`;
                    }
                    setReactInputValue(locationInput, formattedLocation);
                }
                
                // Intentionally NOT clicking continue
                
            } else if (bodyText.includes("Hiring goals") || bodyText.includes("Recruitment timeline")) {
                if (currentPageState !== 'hiring_goals') {
                    console.log("On Hiring Goals Page - Skipping Automation");
                    currentPageState = 'hiring_goals';
                }
                // Intentionally skipping all automation on this page as requested
                // Intentionally NOT clicking continue
                
            } else if (bodyText.includes("Job details") || bodyText.includes("Job type")) {
                if (currentPageState !== 'job_details') {
                    console.log("On Job Details Page");
                    currentPageState = 'job_details';
                    
                    // Click Job Type (Contract or Full-time)
                    // Click Job Type (Contract or Full-time)
                    await new Promise(r => setTimeout(r, 1000));
                    let targetType = "Full-time";
                    if (jobData.jobType && jobData.jobType.toLowerCase().includes("contract")) {
                        targetType = "Contract";
                    }
                    
                    const clickables = Array.from(document.querySelectorAll('button, label, [role="button"], span'));
                    const typeBtn = clickables.find(b => b.innerText && b.innerText.includes(targetType) && b.innerText.length < 30 && !b.innerText.includes("Select"));
                    
                    if (typeBtn && typeBtn.getAttribute('aria-pressed') !== 'true') {
                        // Some React buttons ignore standard click() and require native mouse events
                        const elementToClick = typeBtn.closest('button, label') || typeBtn;
                        elementToClick.click();
                        elementToClick.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                        elementToClick.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                    }
                }
                // Intentionally NOT clicking continue
                
            } else if (bodyText.includes("Add pay and benefits") || bodyText.includes("Review the pay we estimated")) {
                if (currentPageState !== 'pay_benefits') {
                    console.log("On Pay & Benefits Page");
                    currentPageState = 'pay_benefits';
                    
                    // Set Rate to per hour - Extremely targeted logic
                    const rateLabel = Array.from(document.querySelectorAll('label, legend, span')).find(l => l.innerText && l.innerText.trim() === "Rate");
                    let rateBtn = null;
                    if (rateLabel) {
                        const parent = rateLabel.parentElement || rateLabel.parentElement.parentElement;
                        rateBtn = parent.querySelector('button, [role="button"], [role="combobox"]');
                    }
                    if (!rateBtn) {
                        const clickables = Array.from(document.querySelectorAll('button, [role="button"], [role="combobox"]'));
                        rateBtn = clickables.find(b => b.innerText && (b.innerText.includes("per year") || b.innerText.includes("per month")));
                    }
                    
                    if (rateBtn) {
                        rateBtn.click();
                        await new Promise(r => setTimeout(r, 800));
                        
                        const opts = Array.from(document.querySelectorAll('li, [role="option"], [role="menuitem"], div, span'));
                        const hrOpt = opts.find(o => o.innerText && o.innerText.trim() === "per hour" && o.children.length === 0);
                        
                        if (hrOpt) {
                            const clickable = hrOpt.closest('li, [role="option"], button') || hrOpt;
                            clickable.click();
                            
                            // Simulate full mouse events for React
                            clickable.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                            clickable.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
                            
                            // Wait for Indeed's async API to fetch the new 'hourly' estimate
                            await new Promise(r => setTimeout(r, 2500));
                        } else {
                            // Close dropdown if we didn't find per hour to avoid blocking UI
                            document.body.click(); 
                        }
                    }
                    
                    const minInput = findInputByLabel("Minimum") || document.querySelector('input[name="rangeMin"]') || document.querySelector('input[aria-label*="Minimum"]');
                    const maxInput = findInputByLabel("Maximum") || document.querySelector('input[name="rangeMax"]') || document.querySelector('input[aria-label*="Maximum"]');
                    
                    let minVal = (jobData.minRate !== undefined && jobData.minRate !== null) ? jobData.minRate.toString().replace(/[^0-9.]/g, '') : "";
                    let maxVal = (jobData.maxRate !== undefined && jobData.maxRate !== null) ? jobData.maxRate.toString().replace(/[^0-9.]/g, '') : "";
                    
                    if (minVal === "0" || minVal === "0.00") minVal = "";
                    if (maxVal === "0" || maxVal === "0.00") maxVal = "";
                    
                    const forceType = (el, val) => {
                        if (!el) return;
                        el.focus();
                        el.select();
                        if (val === "") {
                            document.execCommand('delete', false, null);
                        } else {
                            // Use execCommand for React masking - perfectly simulates a user typing text
                            document.execCommand('insertText', false, val);
                        }
                        el.dispatchEvent(new Event('change', { bubbles: true }));
                        el.blur();
                    };
                    
                    const needsUpdate = (el, targetVal) => {
                        if (!el) return false;
                        if (targetVal === "") {
                            // If target is empty, we must update if it currently has text
                            return el.value !== "";
                        }
                        const currentNum = parseFloat(el.value.replace(/[^0-9.]/g, ''));
                        const targetNum = parseFloat(targetVal);
                        if (isNaN(currentNum)) return true;
                        return currentNum !== targetNum;
                    };
                    
                    // Bulletproof enforcement: continuously check the values for 8 seconds.
                    // If Indeed's background API overwrites our numbers with its fake estimates, we overwrite them right back!
                    const enforceValues = () => {
                        const mIn = findInputByLabel("Minimum") || document.querySelector('input[name="rangeMin"]') || document.querySelector('input[aria-label*="Minimum"]');
                        const mAx = findInputByLabel("Maximum") || document.querySelector('input[name="rangeMax"]') || document.querySelector('input[aria-label*="Maximum"]');
                        
                        if (mIn && needsUpdate(mIn, minVal)) {
                            forceType(mIn, minVal);
                        }
                        if (mAx && needsUpdate(mAx, maxVal)) {
                            forceType(mAx, maxVal);
                        }
                    };
                    
                    // Run it immediately, and then every 1.5 seconds, 5 times.
                    enforceValues();
                    for (let i = 1; i <= 5; i++) {
                        setTimeout(enforceValues, i * 1500);
                    }
                }
                // Intentionally NOT clicking continue
                
            } else if (bodyText.includes("Job description") && (bodyText.includes("B I") || document.querySelector('.ql-editor, [contenteditable="true"]'))) {
                if (currentPageState !== 'job_description') {
                    console.log("On Job Description Page");
                    currentPageState = 'job_description';
                    
                    setTimeout(() => {
                        const editor = document.querySelector('.ql-editor') || document.querySelector('[contenteditable="true"]') || document.querySelector('textarea');
                        if (editor && (!editor.innerText || editor.innerText.trim() === "")) {
                            if (editor.tagName === 'TEXTAREA') {
                                const tempDiv = document.createElement('div');
                                let rawHtml = jobData.description || "Description not provided";
                                rawHtml = rawHtml.replace(/<br\s*[\/]?>/gi, '\n')
                                                 .replace(/<\/p>/gi, '\n\n')
                                                 .replace(/<\/li>/gi, '\n')
                                                 .replace(/<li>/gi, '• ');
                                tempDiv.innerHTML = rawHtml;
                                const plainText = tempDiv.textContent || tempDiv.innerText || "";
                                setReactInputValue(editor, plainText.trim());
                            } else {
                                editor.focus();
                                const selection = window.getSelection();
                                const range = document.createRange();
                                range.selectNodeContents(editor);
                                selection.removeAllRanges();
                                selection.addRange(range);
                                document.execCommand('insertHTML', false, jobData.description || "Description not provided");
                                editor.dispatchEvent(new Event('input', { bubbles: true }));
                                editor.dispatchEvent(new Event('blur', { bubbles: true }));
                            }
                        }
                    }, 1000);
                }
                // Intentionally NOT clicking continue
            }
        } catch (e) {
            console.error("Indeed automation error:", e);
        }
        
        setTimeout(runState, 1500);
    };

    runState();
}
