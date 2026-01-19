from browser import document
from browser.local_storage import storage
import json

inp = document["inp_item"]
btn_add = document["btn_add"]
btn_clear = document["btn_clear"]
btn_last = document["btn_last"]
out = document["out"]

# Stav aplikácie (zoznam položiek)
items = []  # TODO: po doplnení load() nastav items = load()


def render():
    if len(items) == 0:
        out.html = "<em>Zoznam je prázdny.</em>"
        return

    html = "<ul>"
    for it in items:
        html += f"<li>{it}</li>"
    html += "</ul>"
    out.html = html


def save():
    storage["todo_items"] = json.dumps(items)
    pass


def load():
    data = storage.get("todo_items")
    if len(data) > 0:
        return json.loads(data)
    else:
        return []
    pass


def add_item(ev):
    text = inp.value.strip()
    if text == "":
        out.html = "<em>Najprv napíš položku.</em>"
        return

    items.append(text)
    inp.value = ""
    render()
    # TODO (Checkpoint 5): zavolaj save()
    save()


def clear_all(ev):
    items.clear()
    render()
    # TODO (Checkpoint 5): zavolaj save()
    save()

def remove_last(ev):
    # TODO (Checkpoint 6): ošetri prázdny zoznam, pop(), render(), save()
    if len(items) == 0:
        out.html = "<em>Zoznam je už prázdny.</em>"
        return
    items.pop()
    render()
    save()
    pass


btn_add.bind("click", add_item)
btn_clear.bind("click", clear_all)
btn_last.bind("click", remove_last)

# TODO: items = load(); render()
# items = load()
# render()
items = load()
render()
