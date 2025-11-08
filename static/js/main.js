mapStrings = {'GEN_COMBAT': "Combat", 'GEN_ACCESSORIES': "Artifacts", 'GEN_FISHING': "Fishing"}
//TODO POSAR AQUI ELS DOS ALTRES;

var isSelBoxDisplayed = 0;
var subDisplayed = 0;
var presentListFilters = [];

const mAddByType = {
    "GEN_COMBAT": ["ELEM_SWORD", "ELEM_RANGE", "ELEM_ARMOR"],
    "GEN_FISHING": ["ELEM_RODS", "ELEM_ARMOR"],
    "GEN_PETS": ["ELEM_MINING", "ELEM_COMBAT", "ELEM_FARMING", "ELEM_FORAGING", "ELEM_FISHING", "ELEM_ENCHANTING", "ELEM_ALCHEMY", "ELEM_TAMING", "ELEM_OTHER"],
    "GEN_ACCESSORIES": ["ELEM_MINING", "ELEM_COMBAT", "ELEM_FARMING", "ELEM_FORAGING", "ELEM_FISHING", "ELEM_ENCHANTING", "ELEM_ALCHEMY", "ELEM_TAMING", "ELEM_OTHER"]
}

//TODO POSAR AQUI ELS DOS ALTRES;

function addFilter(idTag) {
    let newElem = document.createElement("div");
    newElem.className = "elemPill_Elem";
    newElem.id = `elemPill_#${idTag}`
    presentListFilters.push(idTag);

    for (let i = 0; i < mAddByType[idTag].length; i++) {
        presentListFilters.push(mAddByType[idTag][i]);
    }

    newElem.innerHTML = `<i class="bi bi-stack"></i><div>${mapStrings[idTag]}</div><i id="elemPill-SubClass_${idTag}"  class="bi bi-funnel-fill"></i><i id="elemPill-Close_${idTag}" class="bi bi-x-circle-fill"></i>`;
    document.querySelector("#elemPill_List").prepend(newElem);
    document.getElementById("elemList_Filters").removeChild(document.getElementById(idTag));

    document.getElementById("elemList_Filters").style.display = "none";


    let closeButton = document.querySelector(`#elemPill-Close_${idTag}`);
    closeButton.onclick = function () {
        removeFilter(idTag);
    };

    let addButton = document.querySelector(`#elemPill-SubClass_${idTag}`);
    addButton.onclick = function () {
        showSubpathBox(idTag);
    };

    sendCurrentFilters();
}

function switchSubFilter(type, idSubTag) {
    const presentSetFilters = new Set(presentListFilters);
    if (presentSetFilters.has(idSubTag)) {
        presentSetFilters.delete(idSubTag);
        document.getElementById(type + "_" + idSubTag).style.color = 'gray';
    } else {
        presentSetFilters.add(idSubTag);
        document.getElementById(type + "_" + idSubTag).style.color = 'white';
    }
    presentListFilters = Array.from(presentSetFilters);


    sendCurrentFilters();
}

function searchByUser() {
    const inputElement = document.getElementById('elemPill_Input-Label');
    console.log('Current text: ' + inputElement.value);

    fetch(`/api/userUuid/${inputElement.value}`)
        .then(res => res.status === 404 ? showToastErrorUsrNotFound(inputElement.value) : res.json())
        .then(data => {
            console.log(data)
            displayAvailableProfiles(data['uuid'])
        })
        .catch(err => console.error('Error:', err));
}

function searchByItem() {
    engSpring.setPosNodeByName(document.getElementById('elemPill_Item-Label').value.toLowerCase());
}

function displayAvailableProfiles(usrUuid) {
    fetch(`/api/profiles/${usrUuid}`)
        .then(res => res.status === 404 ? showToastErrorFetchInfo() : res.json())
        .then(data => {
            const profileList = document.querySelector('.profile_list');
            profileList.style.display = 'flex';

            for (let i = 0; i < data['response']['profiles'].length; i++) {
                const date = new Date(data['response']['profiles'][i]['created_at']);

                const day = date.getDate().toString().padStart(2, '0'); // Pads day to 2 digits
                const month = date.toLocaleString('default', {month: 'short'}); // Gets short month name (e.g., 'Oct')
                const year = date.getFullYear().toString().slice(-2); // Gets the last two digits of the year
                console.log(data['response']['profiles'][i]['profile_id'])
                document.getElementById(`profile_elements`).innerHTML += `
                    <div class="profile_item" onclick="applyFilterNameUuid('${usrUuid}', '${data['response']['profiles'][i]['profile_id']}')">
                        <div class="profile_item-top-name">
                            ${data['response']['profiles'][i]['cute_name']}
                        </div>
                        <div class="profile_item-image">
                            <svg width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                                 stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17.553 16.75a7.5 7.5 0 0 0 -10.606 0"></path>
                                <path d="M18 3.804a6 6 0 0 0 -8.196 2.196l10.392 6a6 6 0 0 0 -2.196 -8.196z"></path>
                                <path d="M16.732 10c1.658 -2.87 2.225 -5.644 1.268 -6.196c-.957 -.552 -3.075 1.326 -4.732 4.196"></path>
                                <path d="M15 9l-3 5.196"></path>
                                <path d="M3 19.25a2.4 2.4 0 0 1 1 -.25a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 1 .25"></path>
                            </svg>
                        </div>
                        <div class="profile_item-bottom">
                            <div class="profile_item-bottom-date">${day} ${month} ${year}</div>
                            <div class="profile_item-bottom-type">${data['response']['profiles'][i]['game_mode']}</div>
                        </div> <!-- Close the bottom div -->
                    </div> <!-- Close the profile_item div -->
                `;

            }
        })
        .catch(err => showToastErrorFetchInfo());
}

function applyFilterNameUuid(usrUuid, profUuid) {
    const profileList = document.querySelector('.profile_list');
    profileList.style.display = 'none';
    document.getElementById(`profile_elements`).innerHTML = ""

    fetch(
        `/api/info/${usrUuid}/${profUuid}`)
        .then(res => res.status === 404 ? showToastErrorFetchInfo() : res.json())
        .then(data => {
            engSpring.setInformation(data['response'])
            console.log(data)
        })
        .catch(err => showToastErrorFetchInfo());
}

function showToastErrorFetchInfo() {
    const toast = document.getElementById("toast");
    toast.className = "toast show";
    toast.innerHTML = `There has been error in the fetching of player information`
    setTimeout(function () {
        toast.className = toast.className.replace("show", "");
    }, 3000);
}

function showToastErrorUsrNotFound(usrNotFound) {
    const toast = document.getElementById("toast");
    toast.className = "toast show";
    toast.innerHTML = `The user "${usrNotFound}" doesn't exists`
    setTimeout(function () {
        toast.className = toast.className.replace("show", "");
    }, 3000);
}

function removeFilter(idTag) {
    document.getElementById("elemPill_List").removeChild(document.getElementById(`elemPill_#${idTag}`));
    const filterElem = document.createElement("div");
    filterElem.className = "elemList_Filters_Selection";
    filterElem.id = idTag;
    filterElem.innerHTML = `${mapStrings[idTag]}`;

    console.log("REMOVE " + idTag)
    presentListFilters = presentListFilters.filter((c) => {
        return c !== idTag
    });

    const presentSetFilters = new Set(presentListFilters);
    for (const item of mAddByType[idTag])
        if (presentSetFilters.has(item))
            presentSetFilters.delete(item);

    presentListFilters = Array.from(presentSetFilters);

    filterElem.onclick = function () {
        addFilter(filterElem.id);
    };
    document.querySelector("#elemList_Filters").append(filterElem);
    sendCurrentFilters();
}


function sendCurrentFilters() {
    console.log("ENVIAR FILTERS");
    console.log(presentListFilters);
    fetch('/post-filters', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({key: presentListFilters}),
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
}

function showSelectBox() {
    var element = document.getElementById("elemPill_Filter");
    var rect = element.getBoundingClientRect();
    var elemSel = document.getElementById("elemList_Filters");
    elemSel.style.position = "absolute";
    elemSel.style.left = rect.left + "px";
    elemSel.style.top = (rect.top + rect.height) + "px";
    elemSel.style.display = "block";
    isSelBoxDisplayed = 2;
    subDisplayed = 1;
}

subLayerByName = {"GEN_COMBAT": 2, "GEN_FISHING": 3, "GEN_ACCESSORIES": 4, "GEN_PETS": 5}; //TODO POSAR AQUI ELS DOS ALTRES;

function showSubpathBox(idTag) {
    var element = document.getElementById(`elemPill_#${idTag}`);
    var rect = element.getBoundingClientRect();
    var elemSel = document.getElementById(`elemList_F${idTag}`);

    console.log(`elemList_F${idTag}`)
    console.log(elemSel)
    elemSel.style.position = "absolute";
    elemSel.style.left = rect.left + "px";
    elemSel.style.top = (rect.top + rect.height) + "px";
    elemSel.style.display = "block";
    isSelBoxDisplayed = 2;

    subDisplayed = subLayerByName[idTag];
}

addEventListener("click", (event) => {
    var x = event.clientX;
    var y = event.clientY;
    var rectListElems = document.getElementById("elemList_Filters").getBoundingClientRect();
    if (subDisplayed === 1 && isSelBoxDisplayed > 0 && (rectListElems.top > y || rectListElems.bottom < y || rectListElems.left > x || rectListElems.right < x)) {
        isSelBoxDisplayed -= 1;
        if (isSelBoxDisplayed <= 0) {
            document.getElementById("elemList_Filters").style.display = "none";
            subDisplayed = 0;
        }
    }

    let rectListCombatElems = document.getElementById("elemList_FGEN_COMBAT").getBoundingClientRect();
    if (subDisplayed === 2 && isSelBoxDisplayed > 0 && (rectListCombatElems.top > y || rectListCombatElems.bottom < y || rectListCombatElems.left > x || rectListCombatElems.right < x)) {
        isSelBoxDisplayed -= 1;
        if (isSelBoxDisplayed <= 0) {
            document.getElementById("elemList_FGEN_COMBAT").style.display = "none";
            subDisplayed = 0;
        }
    }

    rectListCombatElems = document.getElementById("elemList_FGEN_FISHING").getBoundingClientRect();
    if (subDisplayed === 3 && isSelBoxDisplayed > 0 && (rectListCombatElems.top > y || rectListCombatElems.bottom < y || rectListCombatElems.left > x || rectListCombatElems.right < x)) {
        isSelBoxDisplayed -= 1;
        if (isSelBoxDisplayed <= 0) {
            document.getElementById("elemList_FGEN_FISHING").style.display = "none";
            subDisplayed = 0;
        }
    }

    rectListCombatElems = document.getElementById("elemList_FGEN_ACCESSORIES").getBoundingClientRect();
    if (subDisplayed === 4 && isSelBoxDisplayed > 0 && (rectListCombatElems.top > y || rectListCombatElems.bottom < y || rectListCombatElems.left > x || rectListCombatElems.right < x)) {
        isSelBoxDisplayed -= 1;
        if (isSelBoxDisplayed <= 0) {
            document.getElementById("elemList_FGEN_ACCESSORIES").style.display = "none";
            subDisplayed = 0;
        }
    }

    rectListCombatElems = document.getElementById("elemList_FGEN_PETS").getBoundingClientRect();
    if (subDisplayed === 5 && isSelBoxDisplayed > 0 && (rectListCombatElems.top > y || rectListCombatElems.bottom < y || rectListCombatElems.left > x || rectListCombatElems.right < x)) {
        isSelBoxDisplayed -= 1;
        if (isSelBoxDisplayed <= 0) {
            document.getElementById("elemList_FGEN_PETS").style.display = "none";
            subDisplayed = 0;
        }
    }

    //TODO POSAR AQUI ELS DOS ALTRES;
});

var isMouseDown = false;

addEventListener('mousemove', function (event) {
    engSpring.hoverPiece(event.clientX, event.clientY);
})

addEventListener('mousedown', function (event) {
    isMouseDown = true;
    engSpring.eventStartDrag(event.clientX, event.clientY);
});

addEventListener('mousemove', function (event) {
    if (isMouseDown) {
        engSpring.eventDrag(event.clientX, event.clientY);
    }
});

addEventListener('mouseup', function (event) {
    isMouseDown = false;
    engSpring.eventEndDrag();
});


document.addEventListener("DOMContentLoaded", function () {
    document.getElementById('elemPill_Input-Label').addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.keyCode === 13) {
            searchByUser();
            document.getElementById('elemPill_Input-Label').blur();
        }
    });

    document.getElementById('elemPill_Item-Label').addEventListener('keydown', function (event) {
        if (event.key === 'Enter' || event.keyCode === 13) {
            searchByItem();
            document.getElementById('elemPill_Item-Label').blur();
        }
    });
});

//ENGINE:
const engSpring = new SpringEngine();

const socket = io.connect();
socket.on('addNodes', (llNodes) => {
    engSpring.clear();
    for (let i = 0; i < llNodes.length; i++)
        engSpring.addElem(llNodes[i][1], llNodes[i][2]);
    for (let i = 0; i < llNodes.length; i++)
        engSpring.connectElem(llNodes[i][0], llNodes[i][2]);
    console.log(llNodes);
});
engSpring.mainLoop();

