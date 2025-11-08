class Node:
    def __init__(self, nodeId: str, nodeListFilters: list[str], isReq: bool, nNode: int):
        self.nodeId: str = nodeId
        self.nodeFilters: set[str] = set(nodeListFilters)
        self.nodeRequirementHard: list['Node'] = []
        self.nodeRequirementSoft: list['Node'] = []
        self._nodeIsReq = isReq
        self.nIdNode = nNode

    def addRequirementHard(self, nReq: 'Node'):
        self.nodeRequirementHard.append(nReq)

    def addRequirementSoft(self, nReq: 'Node'):
        self.nodeRequirementSoft.append(nReq)

    def complyFilter(self, actFilters: set[str]) -> bool:
        return self._nodeIsReq or bool(self.nodeFilters & actFilters)
