import csv

from src.nodes.CrudeNode import CrudeNode


class ExtractCSV:

    def __init__(self, srcFile):
        with open(srcFile, 'r') as file:
            data = list(csv.reader(file))

        self.llCrudeNode = [CrudeNode(i[0], i[1:i.index('')], i[i.index('') + 1:]) for i in data]

        for i in self.llCrudeNode:
            print(i)
