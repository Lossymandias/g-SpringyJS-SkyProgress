import bisect

import requests
from flask import Flask, request, render_template, jsonify
from flask_socketio import SocketIO

from src.ConstructorTree import ConstructorTree
from src.ExtractCSV import ExtractCSV


def getPointsSkills() -> dict[str, list[float]]:
    url = "https://api.hypixel.net/v2/resources/skyblock/skills"
    response = requests.get(url)
    ret_dir: dict[str, list[float]] = {}
    if response.status_code == 200:
        data = response.json()
        for i in data['skills']:
            ret_dir[f"SKILL_{i}"] = [0.0]
            for j in data['skills'][i]['levels']:
                ret_dir[f"SKILL_{i}"].append(j['totalExpRequired'])
    return ret_dir


def getPointsCollections() -> dict[str, list[int]]:
    url = "https://api.hypixel.net/v2/resources/skyblock/collections"
    response = requests.get(url)
    ret_dir: dict[str, list[int]] = {}
    if response.status_code == 200:
        data = response.json()
        for coll in data['collections']:
            for item in data['collections'][coll]['items']:
                ret_dir[item] = [0]
                for level in data['collections'][coll]['items'][item]['tiers']:
                    ret_dir[item].append(level['amountRequired'])
    return ret_dir


from local_secrets import API_KEY


class WebApp:
    def __init__(self):
        self._strApiKey = API_KEY

        self._app = Flask(
            __name__,
            template_folder='../../templates',
            static_folder='../../static'
        )
        self._socketio = SocketIO(self._app)
        self._register_routes()

        self._backECSV = ExtractCSV("./files/gInputElements.csv")
        self._backCT_Base = ConstructorTree(self._backECSV.llCrudeNode)

        self._strSkillPoints = getPointsSkills()
        self._strCollectionPoints = getPointsCollections()

    def updateList(self, nFilters: list[str]):
        result = {"filterPath": [], "filterSubpath": []}

        for s in nFilters:
            if s.lower().startswith("gen_"):
                result["filterPath"].append(s.lower())
            elif s.lower().startswith("elem_"):
                result["filterSubpath"].append(s.lower())

        rTotalFilter = {k: v for k, v in result.items() if v}
        gExport = self._backCT_Base.getTreeWithFilters(rTotalFilter)
        self._socketio.emit('addNodes', gExport)

    def _register_routes(self):
        @self._app.route('/')
        @self._app.route('/home')
        def endpointHome():
            return render_template('index.html')

        @self._app.route('/post-filters', methods=['POST'])
        def postFilters():
            data = request.get_json()
            self.updateList(list(data["key"]))
            return jsonify({'status': 'success'}), 200

        @self._app.route('/api/profiles/<uuidUser>', methods=['GET'])
        def getProfiles(uuidUser):
            hypixel_url = f"https://api.hypixel.net/v2/skyblock/profiles?uuid={uuidUser}"
            headers = {'API-Key': self._strApiKey}
            response = requests.get(hypixel_url, headers=headers)

            if response.status_code == 200:
                data = response.json()
                return jsonify({'status': 'success', 'response': data}), 200
            else:
                return jsonify({'status': 'error', 'message': 'Error fetching data from Mojang API'}), 500

        @self._app.route('/api/info/<uuidUser>/<profile_id>', methods=['GET'])
        def getInfo(uuidUser: str, profile_id: str):
            hypixel_url = f"https://api.hypixel.net/v2/skyblock/profile?profile={profile_id}"
            headers = {'API-Key': self._strApiKey}
            response = requests.get(hypixel_url, headers=headers)
            dic_return = {}

            if response.status_code == 200:
                data = response.json()

                usr_data = data["profile"]["members"][uuidUser]["player_data"]
                dic_return["ZONES"] = usr_data["visited_zones"]
                dic_return["COLLECTIONS"] = [
                    (i, bisect.bisect_left(self._strCollectionPoints[i],
                                           data["profile"]["members"][uuidUser]["collection"][i]) - 1) for i in
                    data["profile"]["members"][uuidUser]["collection"]]
                dic_return["SKILLS"] = [
                    (i, bisect.bisect_left(self._strSkillPoints[i], usr_data["experience"][i]) - 1) for i in
                    usr_data["experience"]]
                dic_return["BESTIARY"] = [(i, data["profile"]["members"][uuidUser]['bestiary']['kills'][i]) for i in
                                          data["profile"]["members"][uuidUser]['bestiary']['kills'] if
                                          type(data["profile"]["members"][uuidUser]['bestiary']['kills'][i]) == int]
                dic_return["PETS"] = [(i['type'], i['tier']) for i in
                                      data["profile"]["members"][uuidUser]['pets_data']['pets']]

                return jsonify({'status': 'success', 'response': dic_return}), 200
            return jsonify({'status': 'error', 'message': 'Error fetching data from Hypixel API'}), 500

        @self._app.route('/api/userUuid/<nameUser>', methods=['GET'])
        def getUuid(nameUser):
            mojang_url = f'https://api.mojang.com/users/profiles/minecraft/{nameUser.lower()}'
            response = requests.get(mojang_url)

            if response.status_code == 200:
                data = response.json()
                return jsonify({'status': 'success', 'uuid': data['id'], 'name': data['name']}), 200
            elif response.status_code == 404:
                return jsonify({'status': 'error', 'message': 'User not found'}), 404
            else:
                return jsonify({'status': 'error', 'message': 'Error fetching data from Mojang API'}), 500

        @self._socketio.on('homePageLoaded')
        def home_page_loaded():
            # Call updateList method when the home page is loaded
            self.updateList([])

    def start(self):
        self._socketio.run(self._app, allow_unsafe_werkzeug=True)
