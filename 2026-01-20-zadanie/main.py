from browser import document
from browser.local_storage import storage
import json


btn_theme = document["btn_theme"]
theme_label = document["theme_label"]


inp = document["inp_item"]
btn_add = document["btn_add"]
btn_clear = document["btn_clear"]
btn_last = document["btn_last"]
out = document["out"]


items = []
# TODO 1 vytvor premennú theme a pri štarte ju nastav z load_theme()
# theme = "light"
theme = "light"


def render():
    if len(items) == 0:
        out.html = "<em>Zoznam je prázdny.</em>"
        return

    html = "<ul>"
    for it in items:
        html += f"<li>{it}</li>"
    html += "</ul>"
    out.html = html


def save_items():
    storage["todo_items"] = json.dumps(items)


def load_items():
    data = storage.get("todo_items")
    if data:
        return json.loads(data)
    return []


def add_item(ev):
    text = inp.value.strip()
    if text == "":
        out.html = "<em>Najprv napíš položku.</em>"
        return

    items.append(text)
    inp.value = ""
    render()
    save_items()


def clear_all(ev):
    items.clear()
    render()
    save_items()


def remove_last(ev):
    if len(items) == 0:
        out.html = "<em>Nie je čo zmazať.</em>"
        return
    items.pop()
    render()
    save_items()



# TODO 2 doplň apply_theme(theme_value)
# - nastav document.body.class_name
# - nastav theme_label.text

def apply_theme(theme_value):
    global theme_label
    document.body.class_name = theme_value
    theme_label.text = theme_value
    


# TODO 3 doplň save_theme() a load_theme()
# - kľúč v storage: "theme"

def save_theme():
    storage ["theme"] = theme


def load_theme():
    data = storage.get("theme", "")
    if len(data) == 0:
        return "light"
    return data


# TODO 4 doplň toggle_theme()
# - prepni theme light/dark
# - zavolaj apply_theme(theme)
# - zavolaj save_theme()

def toggle_theme(ev=None):
    global theme
    if theme == "light":
        theme = "dark"
    else:
        theme = "light"
    apply_theme(theme)
    save_theme()

def toggle_theme_on_button(ev):
    if ev.key == "t":
        toggle_theme()

btn_add.bind("click", add_item)
btn_clear.bind("click", clear_all)
btn_last.bind("click", remove_last)
btn_theme.bind("click", toggle_theme)

# (Pri hodnotení môže učiteľ požiadať o malú úpravu na preukázanie vedomostí)
# Prepinanie temy podla tlacitka t

document.bind("keydown", toggle_theme_on_button)
items = load_items()
render()
# TODO 5 theme = load_theme(); apply_theme(theme)
theme = load_theme()
apply_theme(theme)