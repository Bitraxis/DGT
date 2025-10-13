
from browser import document, html

tasks = [
    {"title": "Dokončiť DÚ", "done": False, "priority": "nízka"},
    {"title": "Nakŕmiť otrokov", "done": True, "priority": "stredná"},
    {"title": "Vyniesť smeti", "done": False, "priority": "vysoká"},
]

def list_tasks():
    my_div = document["tasks"]
    my_div.clear()
    tab = html.TABLE(Class="task-table")
    header = html.TR([html.TH("Úloha"), html.TH("Hotovo", html.TH("Priorita"))])
    tab <= header
    
    for t in tasks:
        row = html.TR()
        row <= html.TD(t["title"])
        row <= html.TD("OK" if t["done"] else "TDB")
        row <= html.TD(t["priority"])
        tab <= row
    
    my_div <= tab

    
def add_task(ev):
    title = document["new_task"].value
    priorita = document["priority"].value
    if title:
        tasks.append({"title": title, "done": False, "priority": priorita})
        document["new_task"].value = ""
        list_tasks()  

document["add_btn"].bind("click", add_task)
list_tasks()