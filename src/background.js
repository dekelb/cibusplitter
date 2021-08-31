chrome.runtime.onMessageExternal.addListener(function (
    request,
    sender,
    sendResponse
) {
    if (request.participants) {
        chrome.storage.local.set({ participants: request.participants });
    } else if (request.getAllData) {
        chrome.storage.local.get("participants", (localRes) => {
            chrome.storage.sync.get("friends", (syncRes) => {
                sendResponse({
                    participants: localRes?.participants || {},
                    friends: syncRes?.friends || {},
                });
            });
        });
    }
});
