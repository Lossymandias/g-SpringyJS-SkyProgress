from collections import defaultdict

from src.nodes import CrudeNode
from src.nodes.Node import Node


class ConstructorTree:
    def __init__(self, llTotalCrude: list[CrudeNode]):
        self._MapGlobalRequirement: dict[str, dict[str, list[Node]]] = defaultdict(lambda: defaultdict(list))
        self._activePromises: dict[str, list[Node]] = defaultdict(list[Node])
        self._nTotalNode = 0

        self._nodeIdToNode: dict[str, Node] = {}
        for crudeN in llTotalCrude:
            newNode = Node(crudeN.nameId, crudeN.listFilters, False, self._nTotalNode)
            self._nTotalNode += 1
            if crudeN.nameId in self._activePromises:
                for promisedNode in self._activePromises[crudeN.nameId]:
                    promisedNode.addRequirementHard(newNode)

            for req in crudeN.listRequirements:
                if req.split('_')[0] == "COLLECTION" or req.split('_')[0] == "ATTR":
                    newNode.addRequirementHard(self._returnNodeRequirement(req))
                else:
                    if req not in self._nodeIdToNode:
                        self._activePromises[req].append(newNode)
                    else:
                        newNode.addRequirementHard(self._nodeIdToNode[req])
            self._nodeIdToNode[crudeN.nameId] = newNode

        self._sdMapIdIndex = {}
        self._rTotalTree = self.exportToTree()

    def _returnNodeRequirement(self, req) -> Node:
        reqId = req.split('_')[0]
        reqType = req.split('_', 1)[1].split('#')[0]
        reqNum = int(req.split('#')[1])

        current_len = len(self._MapGlobalRequirement[reqId][reqType])
        if current_len <= reqNum:
            self._MapGlobalRequirement[reqId][reqType].extend([None] * (reqNum - current_len + 1))

        if self._MapGlobalRequirement[reqId][reqType][reqNum] is None:
            self._MapGlobalRequirement[reqId][reqType][reqNum] = Node(req, [], True, self._nTotalNode)
            self._nTotalNode += 1

        return self._MapGlobalRequirement[reqId][reqType][reqNum]

    def exportToTree(self):
        rRet = []
        self._sdMapIdIndex = {}
        sCount = 0
        for key, value in self._MapGlobalRequirement.items():
            for keyCol, valueCol in value.items():
                for lvlCol in range(0, len(valueCol)):
                    if valueCol[lvlCol] is not None:
                        if key == "COLLECTION":
                            rRet.append([[v.nIdNode for v in valueCol[lvlCol].nodeRequirementHard] +
                                         [valueCol[index].nIdNode for index in reversed(range(lvlCol)) if
                                          valueCol[index] is not None][:1], -1, {
                                             "com_id": valueCol[lvlCol].nIdNode,
                                             "com_name": f"colle_{keyCol.lower()}",
                                             "com_specific": "col",
                                             "col_value": lvlCol,
                                         }])
                            self._sdMapIdIndex[valueCol[lvlCol].nIdNode] = sCount
                        elif key == "ATTR":
                            rRet.append([[v.nIdNode for v in valueCol[lvlCol].nodeRequirementHard] +
                                         [valueCol[index].nIdNode for index in reversed(range(lvlCol)) if
                                          valueCol[index] is not None][:1], -1, {
                                             "com_id": valueCol[lvlCol].nIdNode,
                                             "com_name": f"attr_{keyCol.lower()}",
                                             "com_specific": "att",
                                             "att_value": lvlCol,
                                         }])
                            self._sdMapIdIndex[valueCol[lvlCol].nIdNode] = sCount
                        sCount += 1

        prefix_to_specific = {
            "SHOP": "shp",
            "PLACE": "plc",
            "ENEMY": "emy",
        }
        for key, value in self._nodeIdToNode.items():
            prefix = value.nodeId.split('_')[0]
            if prefix in prefix_to_specific:
                rRet.append([
                    [v.nIdNode for v in value.nodeRequirementHard], -1,
                    {
                        "com_id": value.nIdNode,
                        "com_name": key.lower(),
                        "com_specific": prefix_to_specific[prefix]
                    }
                ])
            else:
                rRet.append([[v.nIdNode for v in value.nodeRequirementHard], -1, {
                    "com_id": value.nIdNode,
                    "com_name": f"{key.lower()}",
                    "com_specific": "obj",
                    "obj_rarity": f"{next((item.lower() for item in value.nodeFilters if item.startswith('TYPE')), None)}",
                    "obj_subpath": f"{next((item.lower() for item in value.nodeFilters if item.startswith('ELEM')), None)}",
                    "obj_path": f"{next((item.lower() for item in value.nodeFilters if item.startswith('GEN')), None)}",
                }])
            self._sdMapIdIndex[value.nIdNode] = sCount
            sCount += 1
        self._recGetMaxDepth(rRet, self._sdMapIdIndex)

        return rRet

    totalFiltersNames = {"filterHasName": "com_name", "filterPath": "obj_path", "filterSubpath": "obj_subpath"}

    def getTreeWithFilters(self, filters):
        if filters == {}:
            return self._rTotalTree

        setElemToAdd = {
            node[2]["com_id"]
            for node in self._rTotalTree
            if all(
                key in self.totalFiltersNames
                and self.totalFiltersNames[key] in node[2]
                and node[2][self.totalFiltersNames[key]] in filters[key]
                for key in filters
            )
        }

        setElemTotal = setElemToAdd.copy()
        rRetFiltered = []

        while setElemToAdd:
            setElemToAdd, current = set(), setElemToAdd
            for rNodeIndex in current:
                rRetFiltered.append(self._rTotalTree[self._sdMapIdIndex[rNodeIndex]])
                for rChild in self._rTotalTree[self._sdMapIdIndex[rNodeIndex]][0]:
                    if rChild not in setElemTotal:
                        setElemToAdd.add(rChild)
                        setElemTotal.add(rChild)

        return rRetFiltered[::-1]

    def _recGetMaxDepth(self, sRet, sdMapIdIndex):
        for i in range(0, len(sRet)):
            if len(sRet[i][0]) == 0:
                sRet[i][1] = 0

        for i in range(0, len(sRet)):
            if len(sRet[i][0]) != 0:
                sRet[i][1] = self._getRectMaxDepth(sRet, sdMapIdIndex, i)

    def _getRectMaxDepth(self, sRet, sdMapIdIndex, indexAct):
        sMaxRep = 0
        for i in sRet[indexAct][0]:
            if sRet[sdMapIdIndex[i]][1] != -1:
                sMaxRep = max(sMaxRep, sRet[sdMapIdIndex[i]][1] + 1)
            else:
                sRet[sdMapIdIndex[i]][1] = self._getRectMaxDepth(sRet, sdMapIdIndex, sdMapIdIndex[i])
                sMaxRep = max(sMaxRep, sRet[sdMapIdIndex[i]][1] + 1)
        return sMaxRep
