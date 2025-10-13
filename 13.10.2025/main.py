from browser import document, html

ulohy = [
    {"title": "Dokončiť DÚ", "done": False, "priority": "nízka"},
]

def list_tasks():
    my_div = document["tasks"]
    my_div.clear()
    tab = html.TABLE(Class="task-table")
    header = html.TR([html.TH("Úloha"), html.TH("Hotovo", html.TH("Priorita"))])
    tab <= header