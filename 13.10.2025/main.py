
from browser import document, html, window
from browser.local_storage import storage
import json

tasks = [
    {"title": "Dokončiť DÚ", "done": False, "priority": "nízka"},
    {"title": "Nakŕmiť otrokov", "done": True, "priority": "stredná"},
    {"title": "Vyniesť smeti", "done": False, "priority": "vysoká"},
]

def list_tasks():
    my_div = document["tasks"]
    my_div.clear()
    tab = html.TABLE(Class="task-table")
    header = html.TR([html.TH("Úloha"), html.TH("Hotovo"), html.TH("Priorita"), html.TH("🚮")])
    tab <= header
    for t in tasks:
        row = html.TR()
        row <= html.TD(t["title"])
        toggle_btn = html.BUTTON("✓" if t["done"] else "✗") 
        # if t["done"]:
        #     toggle_btn.style["background-color"] = "lightgreen"
        # else:
        #    toggle_btn.style["background-color"] = "lightcoral"
        toggle_btn.style["background-color"] = "lightcoral" if not t["done"] else "lightgreen"  
        toggle_btn.bind("click", toggle_done)
        row <= html.TD(toggle_btn)
        row <= html.TD(t["priority"])
        remove_btn = html.BUTTON("🚮", Class="remove_btn")
        remove_btn.bind("click", remove_task)
        row <= html.TD(remove_btn)
        tab <= row
    
    my_div <= tab

def remove_task(ev):
    row = ev.currentTarget.parentElement.parentElement
    title = ev.currentTarget.parentElement.parentElement.children[0].textContent
    for t in tasks:
        if t["title"] == title:
            tasks.remove(t)
    if window.confirm("Naozaj chcete odstrániť túto úlohu?"):
        row.remove() 

def toggle_done(ev):
    btn = ev.target
    row = btn.parentElement.parentElement
    title = row.children[0].textContent
    for t in tasks:
        if t["title"] == title:
            t["done"] = not t["done"]
    list_tasks()
    
def add_task(ev):
    title = document["new_task"].value
    priorita = document["priority"].value
    if title:
        tasks.append({"title": title, "done": False, "priority": priorita})
        document["new_task"].value = ""
        list_tasks()  

document["add_btn"].bind("click", add_task)
list_tasks()