// This script runs on the ERP website (e.g. localhost:218)
// It listens for the 'window.postMessage' triggered by the Dice button click
window.addEventListener("message", (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return;

    if (event.data.type && event.data.type === "POST_TO_DICE") {
        console.log("Dice Extension caught job payload:", event.data.job);
        
        // Send the job payload to our background.js to open the new tab
        chrome.runtime.sendMessage({
            action: "open_dice",
            job: event.data.job
        });
    } else if (event.data.type && event.data.type === "POST_TO_INDEED") {
        console.log("Extension caught Indeed job payload:", event.data.job);
        
        // Send the job payload to our background.js to open the new tab
        chrome.runtime.sendMessage({
            action: "open_indeed",
            job: event.data.job
        });
    }
});
