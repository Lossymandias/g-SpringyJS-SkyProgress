class SpringEngine {
    constructor() {
        this._seCanvas = document.getElementById('myCanvas');
        this._seCtx = this._seCanvas.getContext('2d');
        window.addEventListener('resize', self.resizeCanvas, false);

        this._seLlTotalNode = []
        this._seTotalOffset = [500, 500]

        this._seElemDragged = null;
        this._seElemIndexDragged = -1;

        this._seTempStartCam = [0, 0];

        this._seSomeoneLeft = false;
        this._seSomeoneRight = false;
        this._seSomeoneTop = false;
        this._seSomeoneBottom = false;

        this._seDrawName = -1;
        this._seMPos = [0, 0];

        this._seMapXAct = {};
        this._seHasSomeFocus = false;
        this._seLastFocus = -1;
        this._seSearchFocus = false;

        this._seFocusNodes = [];
        this._seStructureRef = {};
        this._seStructureByName = {};

        this._isUserSet = false;
    }

    clear() {
        this._seLlTotalNode = [];
        this._seMapXAct = {}
    }

    addElem(layerPut, elemType) {
        if (this._seLlTotalNode.length < elemType.com_id) {
            this._seLlTotalNode.length = elemType.com_id;
            this._seLlTotalNode.fill(null, this._seLlTotalNode.length, elemType.com_id);
        }

        if (!(layerPut in this._seMapXAct)) {
            this._seMapXAct[layerPut] = 0
        }

        const sPosStart = [layerPut * 500, this._seMapXAct[layerPut] * 500]
        this._seLlTotalNode[elemType.com_id] = new NodeCompObj(...sPosStart, elemType, elemType.com_id, this);
        this._seMapXAct[layerPut]++;


        if (!(elemType.com_specific in this._seStructureRef))
            this._seStructureRef[elemType.com_specific] = {}

        let commonName = elemType.com_name;
        const prefixes = ['enemy_', 'shop_', 'place_', 'attr_'];
        for (let i = 0; i < prefixes.length; i++) {
            if (commonName.startsWith(prefixes[i])) {
                commonName = commonName.slice(prefixes[i].length);
                break;
            }
        }

        commonName = commonName.replace(/[-_]/g, ' ')
        this._seStructureByName[commonName] = elemType.com_id;

        if (elemType.com_specific === "att") {
            const skill_name = `SKILL_${elemType.com_name.replace('attr_', '').toUpperCase()}`
            if (!(skill_name in this._seStructureRef[elemType.com_specific]))
                this._seStructureRef[elemType.com_specific][skill_name] = []
            this._seStructureRef[elemType.com_specific][skill_name].push([elemType.att_value, elemType.com_id])
        } else if (elemType.com_specific === "plc")
            this._seStructureRef[elemType.com_specific][`${elemType.com_name.slice(6).replace(/-/g, '_')}`] = elemType.com_id
        else if (elemType.com_specific === "col") {
            const com_name = `${elemType.com_name.replace('colle_', '').toUpperCase()}`
            if (!(com_name in this._seStructureRef[elemType.com_specific]))
                this._seStructureRef[elemType.com_specific][com_name] = []
            this._seStructureRef[elemType.com_specific][com_name].push([elemType.col_value, elemType.com_id])
        } else if (elemType.com_specific === "emy")
            this._seStructureRef[elemType.com_specific][`${elemType.com_name.slice(6).replace(/-/g, '_')}`] = elemType.com_id
        else if (elemType.com_specific === "obj")
            this._seStructureRef[elemType.com_specific][`${elemType.com_name}`] = elemType.com_id


    }

    setPosNodeByName(strName) {
        let tPos = this._seLlTotalNode[this._seStructureByName[strName]].getPos()
        this._seTotalOffset = [-tPos[0] + screen.height / 2, -tPos[1] + screen.width / 2];

        this.recAddFocus(this._seLlTotalNode[this._seStructureByName[strName]]);
        this._seSearchFocus = true;
         this._seLastFocus =  this._seStructureByName[strName];
    }

    connectElem(nRefIndex, elemType) {
        const rNodes = nRefIndex.map(i => this._seLlTotalNode[i]);
        this._seLlTotalNode[elemType.com_id].setRefNodes(rNodes);

        nRefIndex.forEach((i) => this._seLlTotalNode[i].addCountChild());
    }

    resizeCanvas() {
        this._seCanvas.width = window.innerWidth;
        this._seCanvas.height = window.innerHeight;

        this._seCtx.fillStyle = '#1a1c2c';
        this._seCtx.fillRect(0, 0, this._seCanvas.width, this._seCanvas.height);
    }

    drawTotal(llNodes) {
        console.log(`X: ${this._seTotalOffset[0]} Y: ${this._seTotalOffset[1]}`);
        this._seSomeoneLeft = false;
        this._seSomeoneRight = false;
        this._seSomeoneTop = false;
        this._seSomeoneBottom = false;

        for (let i = 0; i < llNodes.length; i++) {
            this._seCtx.lineWidth = 5;
            if (llNodes[i] === undefined)
                continue

            if (!this._seSomeoneLeft && llNodes[i].pX < -this._seTotalOffset[0])
                this._seSomeoneLeft = true;
            else if (!this._seSomeoneRight && llNodes[i].pX > (-this._seTotalOffset[0] + this._seCanvas.width))
                this._seSomeoneRight = true;


            if (!this._seSomeoneTop && llNodes[i].pY < -this._seTotalOffset[1])
                this._seSomeoneTop = true;
            else if (!this._seSomeoneBottom && llNodes[i].pY > (-this._seTotalOffset[1] + this._seCanvas.height))
                this._seSomeoneBottom = true;
        }

        llNodes.forEach(node => {
            if (node !== undefined) node.drawLines(this._seTotalOffset, this._seCtx, this._isUserSet);
        });

        this._seFocusNodes.forEach(node => {
            if (node !== undefined) node.drawLines(this._seTotalOffset, this._seCtx, this._isUserSet);
        });

        llNodes.forEach(node => {
            if (node !== undefined) node.drawInto(this._seTotalOffset, this._seCtx, this._isUserSet);
        });

        this._seFocusNodes.forEach(node => {
            if (node !== undefined) node.drawInto(this._seTotalOffset, this._seCtx, this._isUserSet);
        });

        const drawArc = (x, y) => {
            this._seCtx.beginPath();
            this._seCtx.arc(x, y, 15, 0, 2 * Math.PI, false);
            this._seCtx.fillStyle = '#257179';
            this._seCtx.fill();
        };

        if (this._seSomeoneLeft) drawArc(5, this._seCanvas.height / 2);
        if (this._seSomeoneRight) drawArc(this._seCanvas.width - 5, this._seCanvas.height / 2);
        if (this._seSomeoneTop) drawArc(this._seCanvas.width / 2, 5);
        if (this._seSomeoneBottom) drawArc(this._seCanvas.width / 2, this._seCanvas.height - 5);

        if (this._seDrawName >= 0 && (llNodes[this._seDrawName].getTypeNode() === "obj"
            || llNodes[this._seDrawName].getTypeNode() === "emy"
            || llNodes[this._seDrawName].getTypeNode() === "plc")) {
            this._seCtx.font = 'bold 20px Arial';

            let textWidth = this._seCtx.measureText(llNodes[this._seDrawName].getName()).width;

            let rectX = this._seMPos[0] + 10; // 10 pixels to the right of the mouse
            let rectY = this._seMPos[1] - 10; // Center the rectangle vertically around the mouse pointer
            let rectWidth = textWidth + 20; // Add some padding
            let rectHeight = 25; // Height of the rectangle
            let cornerRadius = 5; // Radius of the rounded corners

            this._seCtx.beginPath();
            this._seCtx.moveTo(rectX + cornerRadius, rectY);
            this._seCtx.lineTo(rectX + rectWidth - cornerRadius, rectY);
            this._seCtx.arcTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + cornerRadius, cornerRadius);
            this._seCtx.lineTo(rectX + rectWidth, rectY + rectHeight - cornerRadius);
            this._seCtx.arcTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - cornerRadius, rectY + rectHeight, cornerRadius);
            this._seCtx.lineTo(rectX + cornerRadius, rectY + rectHeight);
            this._seCtx.arcTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - cornerRadius, cornerRadius);
            this._seCtx.lineTo(rectX, rectY + cornerRadius);
            this._seCtx.arcTo(rectX, rectY, rectX + cornerRadius, rectY, cornerRadius);
            this._seCtx.closePath();

            this._seCtx.fillStyle = '#eee'; // Rectangle color
            this._seCtx.fill(); // Draw the rectangle

            this._seCtx.textAlign = 'left';
            this._seCtx.textBaseline = 'middle';

            this._seCtx.fillStyle = '#000'; // Text color
            this._seCtx.fillText(llNodes[this._seDrawName].getName(), rectX + 20 / 2, rectY + rectHeight / 2); // Draw the text
        }
    }

    _isInsideIndex(pX, pY) {
        for (let i = 0; i < this._seLlTotalNode.length; i++) {
            if (this._seLlTotalNode[i] === undefined)
                continue
            const pReal = [this._seLlTotalNode[i].pX + this._seTotalOffset[0], this._seLlTotalNode[i].pY + this._seTotalOffset[1]];
            if (((pReal[0] - pX) * (pReal[0] - pX) + (pReal[1] - pY) * (pReal[1] - pY)) <= 1600) {
                return i;
            }
        }
        return -1;
    }

    getNode(index) {
        return this._seLlTotalNode[index];
    }

    _isInsideIndexExcluding(pX, pY, indexEx) {
        for (let i = 0; i < this._seLlTotalNode.length; i++) {
            if (this._seLlTotalNode[i] === undefined)
                continue
            if (i !== indexEx) {
                const pReal = [this._seLlTotalNode[i].pX, this._seLlTotalNode[i].pY];
                if (((pReal[0] - pX) * (pReal[0] - pX) + (pReal[1] - pY) * (pReal[1] - pY)) <= 4000) { //TODO DEPENDS DE LA MIDA DEL ALTRE
                    return i;
                }
            }
        }
        return -1;
    }

    recAddFocus(rNode) {
        rNode.isObjectFocus = true;
        rNode.LlpOrigin.forEach(node => this.recAddFocus(node));
        this._seFocusNodes.push(rNode);
    }

    recRemoveFocus(rNode) {
        this._seFocusNodes = [];
        rNode.isObjectFocus = false;
        rNode.LlpOrigin.forEach(node => this.recRemoveFocus(node));
    }

    hoverPiece(pX, pY) {
        const sFound = this._isInsideIndex(pX, pY);

        if(sFound === -1 && this._seLastFocus !== -1 && !this._seSearchFocus){
             this.recRemoveFocus(this._seLlTotalNode[this._seLastFocus]);
             this._seLastFocus = -1;
        }

        if (sFound >= 0) {
            if (this._seLastFocus !== -1 && sFound !== this._seLastFocus)
                this.recRemoveFocus(this._seLlTotalNode[this._seLastFocus]);

            this.recAddFocus(this._seLlTotalNode[sFound]);
            this._seSearchFocus = false;
            this._seLastFocus = sFound;
            this._seSearchFocus = false;
        }

        this._seDrawName = sFound;
        this._seHasSomeFocus = sFound >= 0;
        this._seMPos = [pX, pY];
    }

    eventStartDrag(pX, pY) {
        const sFound = this._isInsideIndex(pX, pY);
        if (sFound >= 0) {
            this._seElemDragged = this._seLlTotalNode[sFound];
            this._seElemIndexDragged = sFound;
        } else
            this._seTempStartCam = [pX, pY]
    }

    eventDrag(pX, pY) {
        if (this._seElemDragged != null) {
            const pReal = [pX - this._seTotalOffset[0], pY - this._seTotalOffset[1]];
            [this._seElemDragged.pX, this._seElemDragged.pY] = pReal;
            this._seElemDragged.setDir((pX - this._seTotalOffset[0]), (pY - this._seTotalOffset[1])); //To rectify direction
        } else {
            this._seTotalOffset = [this._seTotalOffset[0] + (pX - this._seTempStartCam[0]), this._seTotalOffset[1] + (pY - this._seTempStartCam[1])]
            this._seTempStartCam = [pX, pY];
        }
    }

    eventEndDrag() {
        this._seElemDragged = null;
        this._seElemIndexDragged = -1;
    }

    updateTotal(llNodes) {
        if(llNodes.length === 0) return;
        console.log(`X: ${llNodes[0].pX} Y: ${llNodes[0].pY}`);
        llNodes.forEach((node, i) => {
            if (node !== undefined && i !== this._seElemIndexDragged) node.update();
        });
    }

    setPosElem(idElem, pX, pY) {
        this._seLlTotalNode[idElem].pX = (pX - this._seTotalOffset[0]);
        this._seLlTotalNode[idElem].pY = (pY - this._seTotalOffset[1]);
        this._seLlTotalNode[idElem].setDir((pX - this._seTotalOffset[0]), (pY - this._seTotalOffset[1]));
    }

    mainLoop() {
        console.log("mainLoop");
        this.resizeCanvas();
        this.drawTotal(this._seLlTotalNode);
        this.updateTotal(this._seLlTotalNode);

        requestAnimationFrame(this.mainLoop.bind(this));
    }

    setInformation(dictKnowledge) {
        this._isUserSet = true;

        for (let i = 0; i < dictKnowledge['ZONES'].length; i++) {
            if (dictKnowledge['ZONES'][i] in this._seStructureRef['plc'])
                this._seLlTotalNode[this._seStructureRef['plc'][dictKnowledge['ZONES'][i]]].setKnowledge(true);
        }

        for (let i = 0; i < dictKnowledge['BESTIARY'].length; i++) {
            if (dictKnowledge['BESTIARY'][i][0] in this._seStructureRef['emy'])
                this._seLlTotalNode[this._seStructureRef['emy'][dictKnowledge['BESTIARY'][i][0]]].setKnowledge(true);
        }

        for (let i = 0; i < dictKnowledge['PETS'].length; i++) {
            let namePet = `${dictKnowledge['PETS'][i][0]}_${dictKnowledge['PETS'][i][1]}`.toLowerCase();
            if (namePet in this._seStructureRef['obj'])
                this._seLlTotalNode[this._seStructureRef['obj'][namePet]].setKnowledge(true);
        }

        for (let i = 0; i < dictKnowledge['SKILLS'].length; i++) {
            if (dictKnowledge['SKILLS'][i][0] in this._seStructureRef['att']) {
                const lNodes = this._seStructureRef['att'][dictKnowledge['SKILLS'][i][0]]
                for (let j = 0; j < lNodes.length; j++) {
                    if (lNodes[j][0] <= dictKnowledge['SKILLS'][i][1]) {
                        this._seLlTotalNode[lNodes[j][1]].setKnowledge(true);
                    }
                }
            }
        }

        for (let i = 0; i < dictKnowledge['COLLECTIONS'].length; i++) {
            if (dictKnowledge['COLLECTIONS'][i][0] in this._seStructureRef['col']) {
                const lNodes = this._seStructureRef['col'][dictKnowledge['COLLECTIONS'][i][0]]
                for (let j = 0; j < lNodes.length; j++) {
                    if (lNodes[j][0] <= dictKnowledge['COLLECTIONS'][i][1]) {
                        this._seLlTotalNode[lNodes[j][1]].setKnowledge(true);
                    }
                }
            }
        }
    }
}

const g = 80;  // gravitational acceleration

const k = 2;  // spring constant
const b = 1;   // damping coefficient
const dt = 0.03; // time step

class NodeCompObj {
    constructor(pX, pY, type, curIndex, parent) {
        this.pX = pX;
        this.pY = pY;
        this.pDotX = 0;
        this.pDotY = 0;
        this.curIndex = curIndex;
        this.gParent = parent;

        this.type = type;

        this.LlpOrigin = []
        this.LlgVect = 0;

        this._locIsKnowed = false;
        this._locChildCount = 0;
        this._locmMin = 4;

        this.m = this._locmMin;
    }

    setKnowledge(newValue) {
        this._locIsKnowed = newValue;
    }

    setRefNodes(llTElems) {
        this.LlpOrigin = llTElems
        this.LlgVect = Array(this.LlpOrigin.length).fill([0, 0]);
        this.setDir(this.pX, this.pY)
    }

    addCountChild() {
        this._locChildCount += 1;
        this.m = this._locmMin + (this._locChildCount > 20 ? 20 : this._locChildCount) * 2;

    }

    getPos() {
        return [this.pX, this.pY];
    }

    setDir(pX, pY) {
        for (let i = 0; i < this.LlpOrigin.length; i++) {
            const pNewX = pX - this.LlpOrigin[i].pX;
            const pNewY = pY - this.LlpOrigin[i].pY;
            const mag = Math.hypot(pNewX, pNewY);
            this.LlgVect[i] = (mag > 0) ? [pNewX / mag, pNewY / mag] : [0, 0];
            this.LlgVect[i] = [pNewX / mag, pNewY / mag];
        }
    }

    update() {
        let accelVTotal = [0, 0];

        for (let i = 0; i < this.LlpOrigin.length; i++) {
            let springF = [-k * (this.pX - this.LlpOrigin[i].pX), -k * (this.pY - this.LlpOrigin[i].pY)];
            let dampingF = [-b * this.pDotX, -b * this.pDotY];
            let gravityForce = this.m * g;
            let accelV = [springF[0] + dampingF[0] + gravityForce * this.LlgVect[i][0], springF[1] + dampingF[1] + gravityForce * this.LlgVect[i][1]];
            accelVTotal[0] += accelV[0];
            accelVTotal[1] += accelV[1];
        }

        //Si abans de aplicar el calcul, esta dins de una altre, i si sumem el vector tengent al de la colliso
        let indexCon = this.gParent._isInsideIndexExcluding(this.pX, this.pY, this.curIndex);
        if (indexCon !== -1) {
            const nOther = this.gParent.getNode(indexCon);
            let rResult = computeV1V2(this.m, this.m,
                Math.sqrt(this.pDotX * this.pDotX + this.pDotY * this.pDotY),
                Math.sqrt(nOther.pDotX * nOther.pDotX + nOther.pDotY * nOther.pDotY),
                [this.pX, this.pY],
                [nOther.pX, nOther.pY]);//Has collision
            this.pDotY = rResult[0][1];
            this.pDotX = rResult[0][0];
            nOther.pDotX = rResult[1][0];
            nOther.pDotY = rResult[1][1];
        } else {
            this.pDotY += accelVTotal[1] * dt;
            this.pDotX += accelVTotal[0] * dt;
        }
        this.pDotY *= 0.9;
        this.pDotX *= 0.9;

        this.pX += this.pDotX * dt;
        this.pY += this.pDotY * dt;
    }


    lThemes = [
        ['#257179', '#38b764'],
        ['#b13e53', '#ef7d57'],
        ['#5d275d', '#b13e53'],
        ['#3b5dc9', '#41a6f6']];

    lThemesGrey = [
        ['#333c57', '#566c86'],
        ['#333c57', '#566c86'],
        ['#333c57', '#566c86'],
        ['#333c57', '#566c86']];

    mapIcons = {
        "attr_alchemy": [
            "M0 0h24v24H0z",
            "M9 3l6 0",
            "M10 9l4 0",
            "M10 3v6l-4 11a.7 .7 0 0 0 .5 1h11a.7 .7 0 0 0 .5 -1l-4 -11v-6"],
        "attr_combat": [
            "M0 0h24v24H0z", // Background path, we can ignore this as it's for fill="none"
            "M20 4v5l-9 7l-4 4l-3 -3l4 -4l7 -9z",
            "M6.5 11.5l6 6"],
        "attr_farming": [
            "M0 0h24v24H0z", // Background path, we can ignore this as it's for fill="none"
            "M13 8l-9.383 9.418a2.091 2.091 0 0 0 0 2.967a2.11 2.11 0 0 0 2.976 0l9.407 -9.385",
            "M9 3h4.586a1 1 0 0 1 .707 .293l6.414 6.414a1 1 0 0 1 .293 .707v4.586a2 2 0 1 1 -4 0v-3l-5 -5h-3a2 2 0 1 1 0 -4z"],
        "attr_fishing": [
            "M0 0h24v24H0z", // Background path, we can ignore this as it's for fill="none"
            "M16 9v6a5 5 0 0 1 -10 0v-4l3 3",
            "M16 7m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
            "M16 5v-2"],
        "attr_mining": [
            "M0 0h24v24H0z", // Background path, we can ignore this as it's for fill="none"
            "M13 8l-9.383 9.418a2.091 2.091 0 0 0 0 2.967a2.11 2.11 0 0 0 2.976 0l9.407 -9.385",
            "M9 3h4.586a1 1 0 0 1 .707 .293l6.414 6.414a1 1 0 0 1 .293 .707v4.586a2 2 0 1 1 -4 0v-3l-5 -5h-3a2 2 0 1 1 0 -4z"
        ],
        "attr_foraging": [
            "M0 0h24v24H0z", // Background path, we can ignore this as it's for fill="none"
            "M13 9l7.383 7.418c.823 .82 .823 2.148 0 2.967a2.11 2.11 0 0 1 -2.976 0l-7.407 -7.385",
            "M6.66 15.66l-3.32 -3.32a1.25 1.25 0 0 1 .42 -2.044l3.24 -1.296l6 -6l3 3l-6 6l-1.296 3.24a1.25 1.25 0 0 1 -2.044 .42"
        ],
        "attr_enchanting": [
            "M0 0h24v24H0z", // Background path, we can ignore this as it's for fill="none"
            "M3 19a9 9 0 0 1 9 0a9 9 0 0 1 9 0",
            "M3 6a9 9 0 0 1 9 0a9 9 0 0 1 9 0",
            "M3 6l0 13",
            "M12 6l0 13",
            "M21 6l0 13"],
        "attr_heart-of-the-mountain": [
            "M0 0h24v24H0z",
            "M3 20h18l-6.921 -14.612a2.3 2.3 0 0 0 -4.158 0l-6.921 14.612z",
            "M7.5 11l2 2.5l2.5 -2.5l2 3l2.5 -2"],
        "attr_skyblock": [
            "M17.553 16.75a7.5 7.5 0 0 0 -10.606 0",
            "M18 3.804a6 6 0 0 0 -8.196 2.196l10.392 6a6 6 0 0 0 -2.196 -8.196z",
            "M16.732 10c1.658 -2.87 2.225 -5.644 1.268 -6.196c-.957 -.552 -3.075 1.326 -4.732 4.196",
            "M15 9l-3 5.196",
            "M3 19.25a2.4 2.4 0 0 1 1 -.25a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 1 .25"]
    };

    mapIconsCollections = {
        "colle_combat": [
            "M0 0h24v24H0z", // Background path, we can ignore this as it's for fill="none"
            "M20 4v5l-9 7l-4 4l-3 -3l4 -4l7 -9z",
            "M6.5 11.5l6 6"],
        "colle_farming": [
            "M0 0h24v24H0z", // Background path, we can ignore this as it's for fill="none"
            "M13 8l-9.383 9.418a2.091 2.091 0 0 0 0 2.967a2.11 2.11 0 0 0 2.976 0l9.407 -9.385",
            "M9 3h4.586a1 1 0 0 1 .707 .293l6.414 6.414a1 1 0 0 1 .293 .707v4.586a2 2 0 1 1 -4 0v-3l-5 -5h-3a2 2 0 1 1 0 -4z"],
        "colle_fishing": [
            "M0 0h24v24H0z", // Background path, we can ignore this as it's for fill="none"
            "M16 9v6a5 5 0 0 1 -10 0v-4l3 3",
            "M16 7m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0",
            "M16 5v-2"],
        "colle_mining": [
            "M0 0h24v24H0z", // Background path, we can ignore this as it's for fill="none"
            "M13 8l-9.383 9.418a2.091 2.091 0 0 0 0 2.967a2.11 2.11 0 0 0 2.976 0l9.407 -9.385",
            "M9 3h4.586a1 1 0 0 1 .707 .293l6.414 6.414a1 1 0 0 1 .293 .707v4.586a2 2 0 1 1 -4 0v-3l-5 -5h-3a2 2 0 1 1 0 -4z"
        ],
        "colle_foraging": [
            "M0 0h24v24H0z", // Background path, we can ignore this as it's for fill="none"
            "M13 9l7.383 7.418c.823 .82 .823 2.148 0 2.967a2.11 2.11 0 0 1 -2.976 0l-7.407 -7.385",
            "M6.66 15.66l-3.32 -3.32a1.25 1.25 0 0 1 .42 -2.044l3.24 -1.296l6 -6l3 3l-6 6l-1.296 3.24a1.25 1.25 0 0 1 -2.044 .42"
        ],
    };

    mapItemsToCollections = {
        "colle_emerald": "colle_mining",
        "colle_iron_ingot": "colle_mining",
        "colle_cobblestone": "colle_mining",
        "colle_diamond": "colle_mining",
        "colle_wheat": "colle_farming",
        "colle_mushroom": "colle_farming",
        "colle_pumpkin": "colle_farming",
        "colle_cactus": "colle_farming",
        "colle_oak": "colle_foraging",
    }

    mapObjects = {
        "elem_sword": [
            "M0 0h24v24H0z",
            "M20 4v5l-9 7l-4 4l-3 -3l4 -4l7 -9z",
            "M6.5 11.5l6 6"],
        "elem_star": [
            "M0 0h24v24H0z",
            "M12 3l3 6l6 3l-6 3l-3 6l-3 -6l-6 -3l6 -3z"],
        "elem_armor": [
            "M0 0h24v24H0z",
            "M15 4l6 2v5h-3v8a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1v-8h-3v-5l6 -2a3 3 0 0 0 6 0"],
        "elem_accessory": [
            "M0 0h24v24H0z",
            "M8 16l2 -6l6 -2l-2 6l-6 2",
            "M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0",
            "M12 3l0 2",
            "M12 19l0 2",
            "M3 12l2 0",
            "M19 12l2 0"],
        "elem_pet": [
            "M0 0h24v24H0z",  // Background path, fill="none"
            "M11 5h2",  // First line segment for the dog shape
            "M19 12c-.667 5.333 -2.333 8 -5 8h-4c-2.667 0 -4.333 -2.667 -5 -8",  // Dog's body
            "M11 16c0 .667 .333 1 1 1s1 -.333 1 -1h-2z",  // Dog's lower face or feature
            "M12 18v2",  // Vertical stroke for tail or leg
            "M10 11v.01",  // Dog's left eye
            "M14 11v.01",  // Dog's right eye
            "M5 4l6 .97l-6.238 6.688a1.021 1.021 0 0 1 -1.41 .111a.953 .953 0 0 1 -.327 -.954l1.975 -6.815z",  // Left ear
            "M19 4l-6 .97l6.238 6.688c.358 .408 .989 .458 1.41 .111a.953 .953 0 0 0 .327 -.954l-1.975 -6.815z"  // Right ear
        ]
    }

    mapOtherElements = {
        "icon_enemy": ["M0 0h24v24H0z",
            "M12 4c4.418 0 8 3.358 8 7.5c0 1.901 -.755 3.637 -2 4.96l0 2.54a1 1 0 0 1 -1 1h-10a1 1 0 0 1 -1 -1v-2.54c-1.245 -1.322 -2 -3.058 -2 -4.96c0 -4.142 3.582 -7.5 8 -7.5z",
            "M10 17v3",
            "M14 17v3",
            "M9 11m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0",
            "M15 11m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0"],
        "icon_place": ["M0 0h24v24H0z",
            "M17.553 16.75a7.5 7.5 0 0 0 -10.606 0",
            "M18 3.804a6 6 0 0 0 -8.196 2.196l10.392 6a6 6 0 0 0 -2.196 -8.196z",
            "M16.732 10c1.658 -2.87 2.225 -5.644 1.268 -6.196c-.957 -.552 -3.075 1.326 -4.732 4.196",
            "M15 9l-3 5.196",
            "M3 19.25a2.4 2.4 0 0 1 1 -.25a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 1 .25"
        ],
        "icon_shop": [
            "M0 0h24v24H0z", // Background path, we can ignore this as it's for fill="none"
            "M3 21l18 0",
            "M3 7v1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1m0 1a3 3 0 0 0 6 0v-1h-18l2 -4h14l2 4",
            "M5 21l0 -10.15",
            "M19 21l0 -10.15",
            "M9 21v-4a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2v4"
        ]
    }

    mapTypeRarityColor = {
        "type_common": "#FFFFFF",
        "type_uncommon": "#55ff55",
        "type_rare": "#1e1e8c",
        "type_epic": "#9C0A4C",
        "type_legendary": "#FFA608",
        "type_mythic": "#FF55FF",
        "type_divine": "#55fbe0",
        "type_special": "#ff5555",
        "type_very-special": "#FF513D",
    }

    getTypeNode() {
        return this.type.com_specific;
    }

    getName() {
        return this.type.com_name;
    }

    local_typeToIconMap = {
        "emy": "icon_enemy",
        "plc": "icon_place",
        "shp": "icon_shop"
    };

    local_specificToColor = {
        "att": 1,
        "col": 0,
        "plc": 3,
        "emy": 2,
        "obj": 0,
        "shp": 0,
    }

    isObjectFocus = false;

    drawLines(offsetVect, ctxInto) {
        //LINE
        for (let j = 0; j < this.LlpOrigin.length; j++) {
            ctxInto.beginPath();
            const p1 = [this.pX + offsetVect[0], this.pY + offsetVect[1]];
            const p2 = [this.LlpOrigin[j].pX + offsetVect[0], this.LlpOrigin[j].pY + offsetVect[1]];
            let dx = p2[0] - p1[0];
            let dy = p2[1] - p1[1];
            let pLength = Math.hypot(dx, dy);

            ctxInto.moveTo(p1[0], p1[1]);
            ctxInto.lineTo(p2[0], p2[1]);

            ctxInto.strokeStyle = 'rgba(100, 102, 122, 0.5)';
            if (this.isObjectFocus)
                ctxInto.strokeStyle = '#C5C5C6';

            ctxInto.stroke();

            let pHeightWing = 20;
            let pWidthWing = 40;

            let factor = (-pWidthWing + pLength / 2) / pLength;
            let px = p1[0] + factor * dx;
            let py = p1[1] + factor * dy;
            let magPrep = Math.sqrt(dx * dx + dy * dy);
            const vecUnit1 = [-dy / magPrep, dx / magPrep];

            ctxInto.fillStyle = 'rgba(100, 102, 122, 0.5)';
            if (this.isObjectFocus)
                ctxInto.fillStyle = '#C5C5C6';

            ctxInto.beginPath();
            ctxInto.moveTo(vecUnit1[0] * pHeightWing + px, vecUnit1[1] * pHeightWing + py);
            ctxInto.lineTo((p1[0] + p2[0]) * 0.5, (p1[1] + p2[1]) * 0.5);
            ctxInto.lineTo(vecUnit1[0] * -pHeightWing + px, vecUnit1[1] * -pHeightWing + py);
            ctxInto.fill();
        }
    }

    drawInto(offsetVect, ctxInto, hasUserSelected = true) {
        //NODE
        ctxInto.beginPath();
        ctxInto.arc(this.pX + offsetVect[0], this.pY + offsetVect[1], 30, 0, 2 * Math.PI, false);

        ctxInto.fillStyle = (this._locIsKnowed || !hasUserSelected)
            ? this.lThemes[this.local_specificToColor[this.type.com_specific]][0]
            : this.lThemesGrey[this.local_specificToColor[this.type.com_specific]][0];

        if (this.isObjectFocus)
            ctxInto.fillStyle = "#ffcd75";

        ctxInto.fill();
        ctxInto.lineWidth = 5;

        ctxInto.fillStyle = (this._locIsKnowed || !hasUserSelected)
            ? this.lThemes[this.local_specificToColor[this.type.com_specific]][1]
            : this.lThemesGrey[this.local_specificToColor[this.type.com_specific]][1];
        ctxInto.stroke();

        let centerX = this.pX + offsetVect[0];
        let centerY = this.pY + offsetVect[1];

        let iconSize = 23;
        ctxInto.strokeStyle = '#000000';
        ctxInto.lineWidth = 2;
        ctxInto.lineCap = 'round';
        ctxInto.lineJoin = 'round';

        ctxInto.fillStyle = 'black';
        ctxInto.textAlign = 'center';
        ctxInto.textBaseline = 'middle';

        if (this.type.com_specific === "att") {
            ctxInto.font = 'bold 27px Arial';
            ctxInto.fillText(this.type.att_value, (centerX + 30 / 3), centerY);
            this.mapIcons[this.type.com_name].slice(1).forEach(pathData => {
                this.drawSvgPath(ctxInto, pathData, (centerX - 30 / 2) - iconSize / 2, centerY - iconSize / 2 - 2.5, iconSize, iconSize);
            });
        } else if (this.type.com_specific === "col") {
            ctxInto.font = 'bold 12px Arial';
            ctxInto.fillText(this.type.com_name.split("_").slice(1), centerX, centerY + 10);

            ctxInto.font = 'bold 20px Arial';
            ctxInto.fillText(this.type.col_value, centerX + 10, centerY - 8);
            this.mapIconsCollections[this.mapItemsToCollections[this.type.com_name]].slice(1).forEach(pathData => {
                this.drawSvgPath(ctxInto, pathData, (centerX - 30 / 2) - iconSize / 2, centerY - iconSize / 2 - 8, iconSize, iconSize);
            });
        } else if (this.type.com_specific === "obj") {
            ctxInto.strokeStyle = this.mapTypeRarityColor[this.type.obj_rarity.toLowerCase()];
            this.mapObjects[this.type.obj_subpath.toLowerCase()].slice(1).forEach(pathData => {
                this.drawSvgPath(ctxInto, pathData, centerX - iconSize * 1.5 / 2, centerY - iconSize * 1.5 / 2, iconSize * 1.5, iconSize * 1.5);
            });
            ctxInto.font = 'bold 20px Arial';
            const textDisp = this.type.com_name.split(/[_-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            this.drawRectangleText(ctxInto, textDisp, centerX, centerY, this.lThemes[this.local_specificToColor[this.type.com_specific]][0])
        } else {
            const textDisp = this.type.com_name.split(/[_-]/).slice(1).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            let iconSize = 40;
            const iconKey = this.local_typeToIconMap[this.type.com_specific];
            if (iconKey) {
                this.mapOtherElements[iconKey].slice(1).forEach(pathData => {
                    this.drawSvgPath(ctxInto, pathData, centerX - iconSize / 2, centerY - iconSize / 2, iconSize, iconSize);
                });
            }
            ctxInto.font = 'bold 20px Arial';
            this.drawRectangleText(ctxInto, textDisp, centerX, centerY, this.lThemes[this.local_specificToColor[this.type.com_specific]][0])
        }
    }

    drawRectangleText(ctxInto, textDisp, centerX, centerY, backColor) {
        let textWidth = ctxInto.measureText(textDisp).width;

        let rectWidth = textWidth + 20;
        let rectHeight = 25;
        let cornerRadius = 5;
        let rectX = centerX - rectWidth / 2;
        let rectY = centerY + 35;

        ctxInto.beginPath();
        ctxInto.moveTo(rectX + cornerRadius, rectY);
        ctxInto.lineTo(rectX + rectWidth - cornerRadius, rectY);
        ctxInto.arcTo(rectX + rectWidth, rectY, rectX + rectWidth, rectY + cornerRadius, cornerRadius);
        ctxInto.lineTo(rectX + rectWidth, rectY + rectHeight - cornerRadius);
        ctxInto.arcTo(rectX + rectWidth, rectY + rectHeight, rectX + rectWidth - cornerRadius, rectY + rectHeight, cornerRadius);
        ctxInto.lineTo(rectX + cornerRadius, rectY + rectHeight);
        ctxInto.arcTo(rectX, rectY + rectHeight, rectX, rectY + rectHeight - cornerRadius, cornerRadius);
        ctxInto.lineTo(rectX, rectY + cornerRadius);
        ctxInto.arcTo(rectX, rectY, rectX + cornerRadius, rectY, cornerRadius);
        ctxInto.closePath();

        ctxInto.fillStyle = backColor;
        ctxInto.fill();

        ctxInto.textAlign = 'left';
        ctxInto.textBaseline = 'middle';

        ctxInto.fillStyle = '#000';
        ctxInto.fillText(textDisp, rectX + 20 / 2, rectY + rectHeight / 2);
    }

    drawSvgPath(ctx, pathData, x, y, width, height) {
        let path = new Path2D(pathData);
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(width / 24, height / 24);
        ctx.stroke(path);
        ctx.restore();
    }
}

function computeV1V2(m1, m2, v1, v2, p1, p2) {
    const v2P = ((v1 - v2) * m1 + (m1 * v1 + m2 * v2)) / (m1 + m2)
    const v1P = -v1 + v2 + v2P;

    const vecObj1 = [p1[0] - p2[0], p1[1] - p2[1]]
    const magVec1 = Math.sqrt(vecObj1[0] * vecObj1[0] + vecObj1[1] * vecObj1[1]);
    const vecUnit1 = [vecObj1[0] / magVec1, vecObj1[1] / magVec1]

    const vecObj2 = [p2[0] - p1[0], p2[1] - p1[1]]
    const magVec2 = Math.sqrt(vecObj2[0] * vecObj2[0] + vecObj2[1] * vecObj2[1]);
    const vecUnit2 = [vecObj2[0] / magVec2, vecObj2[1] / magVec2]

    return [[vecUnit1[0] * v1P, vecUnit1[1] * v1P], [vecUnit2[0] * v2P, vecUnit2[1] * v2P]];
}