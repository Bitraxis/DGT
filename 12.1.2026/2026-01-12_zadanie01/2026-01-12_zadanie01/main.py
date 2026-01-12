from browser import document

# TODO: STATUS
# Skús zmeniť text v prvku 'status' tak, aby si videl, že Brython beží.
document["status"].text = "Status: Spravene"

# premenná na počítanie pozdravov
count = 0

def greet(ev):
    global meno
    global count
    """Spustí sa po kliknutí na tlačidlo."""
    # TODO: načítaj meno z inputu inp_name, ošetri prázdny vstup a vypíš do prvku out
    # Nápoveda: document["inp_name"].value
    # Nápoveda: document["out"].text = "..."
    
    meno = document["inp_name"].value.strip()
    if meno == "":
        meno = "Zadaj meno prosím."
        document["out"].text = str(meno)
    else: 
        count += 1
        document["out"].text = "Ahoj " + str(meno) + "! Pozdravil som ťa už " + str(count) + " krát."
    pass

def on_enter(ev):
    if ev.keyCode == 13:
        greet(ev)
    else:
        pass
# TODO: BIND
# Pripoj funkciu greet na kliknutie tlačidla btn_greet.
# Nápoveda: document["btn_greet"].bind("click", greet)
document["btn_greet"].bind("click", greet)
# Enter functionality
document["inp_name"].bind("keydown", on_enter)