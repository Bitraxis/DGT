
from browser import document, html, window
from browser.local_storage import storage
import json

kluc = "ulohy"

def load(load_kluc):
        try:
            data = json.loads(storage[load_kluc])
        except Exception as e:
            data = []
        return data
    
if kluc in storage:
    tasks = load(kluc)
else:
    tasks = [
        {"title": "Dokončiť DÚ", "done": False, "priority": "nízka"},
        {"title": "Nakŕmiť otrokov", "done": True, "priority": "stredná"},
        {"title": "Vyniesť smeti", "done": False, "priority": "vysoká"},
    ]

        
def list_tasks():
    my_div = document["tasks"]
    my_div.clear()
    filter_value = document["filter_priority"].value
    tab = html.TABLE(Class="task-table")
    header = html.TR([html.TH("Úloha"), html.TH("Hotovo"), html.TH("Priorita"), html.TH("♻")])
    tab <= header
    for t in tasks:
        if filter_value != "vsetko" and t["priority"] != filter_value:
            continue
        row = html.TR()
        row <= html.TD(t["title"])
        toggle_btn = html.BUTTON("✓" if t["done"] else "✗") 
        # if t["done"]:
        #     toggle_btn.style["background-color"] = "lightgreen"
        # else:
        #    toggle_btn.style["background-color"] = "lightcoral"
        toggle_btn.style["background-color"] = "lightcoral" if not t["done"] else "lightgreen"  
        toggle_btn.style["border-radius"] = "5px"
        toggle_btn.bind("click", toggle_done)
        row <= html.TD(toggle_btn)
        row <= html.TD(t["priority"])
        remove_btn = html.BUTTON("♻", Class="remove_btn")
        remove_btn.style["background-color"] = "lightblue"
        remove_btn.style["border-radius"] = "5px"
        remove_btn.bind("click", remove_task)
        row <= html.TD(remove_btn)
        tab <= row
        if t["priority"] == "nízka":
            color = "lightgreen"
        elif t["priority"] == "stredná":
            color = "khaki"
        else:
            color = "salmon"
        row.style = {"background-color": color}

    my_div <= tab

def remove_task(ev):
    row = ev.currentTarget.parentElement.parentElement
    title = ev.currentTarget.parentElement.parentElement.children[0].textContent
    for t in tasks:
        if t["title"] == title:
            tasks.remove(t)
            storage[kluc + "old"] = json.dumps(load(kluc))
            storage[kluc] = json.dumps(tasks)
    if window.confirm("Naozaj chcete odstrániť túto úlohu?"):
        row.remove() 

def toggle_done(ev):
    btn = ev.target
    row = btn.parentElement.parentElement
    title = row.children[0].textContent
    for t in tasks:
        if t["title"] == title:
            t["done"] = not t["done"]
            storage[kluc + "old"] = json.dumps(load(kluc))
            storage[kluc] = json.dumps(tasks)
    list_tasks()
    
def add_task(ev):
    title = document["new_task"].value
    priorita = document["priority"].value
    if title:
        tasks.append({"title": title, "done": False, "priority": priorita})
        storage[kluc + "old"] = json.dumps(load(kluc))
        storage[kluc] = json.dumps(tasks)
        document["new_task"].value = ""
        list_tasks()  
        
def bck_fn(ev):
    if kluc + "old" in storage:
        storage[kluc] = storage[kluc + "old"]
        del storage[kluc + "old"]
        global tasks
        tasks = load(kluc)
        list_tasks()
        
def dbl_bck_fn(ev):
    global tasks
    tasks = [
        {"title": "Dokončiť DÚ", "done": False, "priority": "nízka"},
        {"title": "Nakŕmiť otrokov", "done": True, "priority": "stredná"},
        {"title": "Vyniesť smeti", "done": False, "priority": "vysoká"}
    ]
    list_tasks()

def updateOnChange(ev):
    storage[kluc] = json.dumps(tasks)
    list_tasks()

def CMhandler(ev):
    if ev.target.tagName == "INPUT":
        return
    ev.preventDefault()
    
def resize_print(ev):
    print(f"Width: {window.innerWidth}, Height: {window.innerHeight}")

document["filter_priority"].bind("change", updateOnChange)
document["add_btn"].bind("click", add_task)
document["bck_btn"].bind("click", bck_fn)
document["bck_btn"].bind("dblclick", dbl_bck_fn)
document.bind("contextmenu", CMhandler)
list_tasks()