// Listens for messages from the ERP content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "open_dice") {
        // Save the job data to Chrome's local storage so the Dice tab can read it
        chrome.storage.local.set({ pendingDiceJob: request.job }, () => {
            // Open a new tab to the Dice Employer "Post a Job" page exactly
            chrome.tabs.create({ url: "https://www.dice.com/employers/job" });
        });
    } else if (request.action === "open_indeed") {
        // Save the job data to Chrome's local storage for Indeed
        chrome.storage.local.set({ pendingIndeedJob: request.job }, () => {
            // Open Indeed Post a Job page
            chrome.tabs.create({ url: "https://employers.indeed.com/job-posting/from-scratch/getting-started" });
        });
    }
});
