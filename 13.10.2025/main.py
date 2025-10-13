from browser import document, html

ulohy = [
    {"title": "Dokončiť DÚ", "done": False, "priority": "nízka"},
    {"title": "Nakŕmiť otrokov", "done": True, "priority": "stredná"},
    {"title": "Vyniesť smetu", "done": False, "priority": "vysoká"},
]

def list_tasks():
    my_div = document["tasks"]
    my_div.clear()
    tab = html.TABLE(Class="task-table")
    header = html.TR([html.TH("Úloha"), html.TH("Hotovo", html.TH("Priorita"))])
    tab <= header