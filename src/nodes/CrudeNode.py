class CrudeNode:
    def __init__(self, nameId_cn: str, listFilters_cn: list[str], listRequirements_cn: list[str]):
        self.nameId = nameId_cn
        self.listFilters = listFilters_cn
        self.listRequirements = listRequirements_cn

    def __str__(self):
        return f"{self.nameId} : {self.listFilters} - {self.listRequirements}"
