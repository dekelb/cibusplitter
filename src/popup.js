const d = document;

const generateNodes = (type) => {
    const ret = {
        row: d.createElement("div"),
        woltName: d.createElement("div"),
        cibusName: d.createElement("div"),
        action: d.createElement("div"),
    };

    ret["row"].setAttribute("class", "row");
    ret["woltName"].setAttribute("class", "col wolt");
    ret["cibusName"].setAttribute("class", "col cibus");
    ret["action"].setAttribute("class", "col actions");

    switch (type) {
        case "conversion":
            const removeIcon = d.createElement("img");
            removeIcon.setAttribute(
                "src",
                chrome.runtime.getURL("images/trash.png")
            );
            removeIcon.setAttribute("class", "remove");
            ret["action"].appendChild(removeIcon);
            break;
        case "order":
            const add = d.createElement("img");
            add.setAttribute("src", chrome.runtime.getURL("images/add.png"));
            add.setAttribute("class", "add");
            ret["action"].appendChild(add);
            break;
    }

    return ret;
};

const addRow = (table, type, woltNameStr, cibusNameStr) => {
    const { row, woltName, cibusName, action } = generateNodes(type);
    woltName.textContent = woltNameStr;
    cibusName.textContent = cibusNameStr;

    row.appendChild(woltName);
    if (cibusName) {
        row.appendChild(cibusName);
        row.appendChild(action);
    }

    table.appendChild(row);
};

const fillConversionTable = () => {
    const table = d.querySelector("#conversion-table");
    table.querySelectorAll("div.row").forEach( e => e.remove());

    chrome.storage.sync.get("friends", function (result) {
        if (!result.friends) {
            return;
        }
        Object.keys(result.friends).forEach((friend) => {
            addRow(table, "conversion", friend, result.friends[friend]);
        });
    });
};

const fillOrderTable = () => {
    const table = d.querySelector("#current-order");
    table.querySelectorAll("div.row").forEach( e => e.remove());
    chrome.storage.local.get("participants", function (resultParticipants) {
        chrome.storage.sync.get("friends", function (resultFriends) {
            const friends = resultFriends?.friends || {};
            const participants = resultParticipants?.participants || {};
            if (
                Object.keys(participants).length == 0
            ) {
                document.querySelector("#current-order-container").remove();
                return;
            }

            Object.keys(resultParticipants.participants).forEach((participant) => {
                if (!resultParticipants.participants[participant].isHost && !(participant in friends)) {
                    addRow(table, "order", participant);
                }
            });
        })
    });
};

const handleRemoveFriend = (el) => {
    const rowElement = el.parentElement.parentElement;
    const name = rowElement.querySelector("div.wolt").textContent;

    chrome.storage.sync.get("friends", function (result) {
        const friends = result.friends;
        delete friends[name];

        chrome.storage.sync.set({ friends });
        rowElement.remove();
        fillTables();
    });
};

const handleAddFriend = (name) => {
    let woltName = name;
    if (!woltName) {
        woltName = prompt("Please enter Wolt name");
        if (!woltName) {
            return;
        }
    }

    const cibusName = prompt("Please enter Cibus name");
    if (!woltName || !cibusName) {
        return;
    }

    chrome.storage.sync.get("friends", function (result) {
        const table = d.querySelector("#conversion-table");
        const friends = result.friends || {};
        friends[woltName] = cibusName;
        chrome.storage.sync.set({ friends });

        addRow(table, "converstion", woltName, cibusName);
        fillTables();
    });
};

const registerClickHandlers = () => {
    d.querySelector("#conversion-table").addEventListener("click", (ev) => {
        if (ev.target.classList.contains("add")) {
            handleAddFriend();
        } else if (ev.target.classList.contains("remove")) {
            handleRemoveFriend(ev.target);
        }
    });

    d.querySelector("#current-order").addEventListener("click", (ev) => {
        if (ev.target.classList.contains("add")) {
            const name =
                ev.target.parentElement.parentElement.querySelector(
                    ".wolt"
                ).textContent;
            handleAddFriend(name);
        }
    });
};

const fillTables = () => {
    fillConversionTable();
    fillOrderTable();
}

window.addEventListener("load", () => {
    fillTables();
    registerClickHandlers();

    document
        .getElementById("split-again")
        .addEventListener("click", () => {
            chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
                const activeTab = tabs[0];
                chrome.tabs.sendMessage(activeTab.id, {"message": "splitAgain"});
            });
        })
});
