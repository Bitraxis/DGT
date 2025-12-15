from browser import document, timer
import random

# vytvoríme zoznam všetkých tlačidiel
buttons = [document[f"btn{i}"] for i in range(16)]

current_index = None     # kde je teraz krtko ("X")
score = 0                # počet bodov
rounds = 0               # koľko kôl už prebehlo
max_rounds = 20          # maximálny počet kôl
timer_id = None          # id časovača, aby sme ho vedeli zastaviť

# nastavíme max_rounds aj do HTML
document["max_round"].text = str(max_rounds)

def vycisti():
    """Nastaví na všetkých tlačidlách bodku '.'."""
    # TODO: pre každé tlačidlo v buttons nastav text "."
    # for btn in buttons:
    #     btn.text = "."
    for btn in buttons:
        btn.text = "."

    pass


def zobraz_noveho():
    """Náhodne zobrazí krtka 'X' na jednom tlačidle."""
    global current_index
    # najprv všetko vyčistíme
    vycisti()

    # vyber náhodného indexu len z hlavnej diagonály 4x4 mriežky: 0,5,10,15
    diagonal_indices = [0, 5, 10, 15]
    new_index = random.choice(diagonal_indices)
    current_index = new_index
    buttons[current_index].text = "X"


def tik():
    """Funkcia, ktorú volá timer každé kolo."""
    global rounds, timer_id

    # TODO: zvýš rounds o 1
    # rounds += 1
    rounds += 1

    # aktualizuj zobrazenie kola
    document["round"].text = str(rounds)

    # TODO: zavolaj zobraz_noveho(), aby sa krtko presunul
    # zobraz_noveho()
    zobraz_noveho()

    # TODO: keď rounds >= max_rounds:
    #   - zastav timer.clear_interval(timer_id)
    #   - vycisti mriežku
    #   - vypíš napr. "Koniec hry" do info (alebo len necháš posledný stav)
    if rounds >= max_rounds:
        timer.clear_interval(timer_id)
        vycisti()
        document["info"].text = "Koniec hry"

    pass


def start_game(ev):
    """Spustí hru."""
    global score, rounds, timer_id

    # reset skóre a kôl
    score = 0
    rounds = 0
    document["score"].text = str(score)
    document["round"].text = str(rounds)

    # zobraz prvého krtka
    zobraz_noveho()

    # TODO: nastav timer, ktorý každých 1000 ms zavolá tik
    # timer_id = timer.set_interval(tik, 1000)
    timer_id = timer.set_interval(tik, random.randint(1000, 2000))

def stop_game(ev):
    """Zastaví hru (ak beží)."""
    global timer_id
    # TODO: ak timer_id nie je None, zastav interval
    # timer.clear_interval(timer_id)
    # a vycisti mriežku
    # vycisti()
    if timer_id is not None:
        timer.clear_interval(timer_id)
        timer_id = None
        vycisti()
    pass


def klik_na_pole(ev):
    """Reaguje na klik na tlačidlo v mriežke."""
    global score

    # ev.target je tlačidlo, na ktoré klikli
    btn = ev.target

    # TODO: ak text tlačidla je "X", zvýš score o 1
    # if btn.text == "X":
    #     score += 1
    #     document["score"].text = str(score)
    if btn.text == "X":
        score += 1
        document["score"].text = str(score)
    pass


# pripojíme handler na všetky tlačidlá v mriežke
for btn in buttons:
    btn.bind("click", klik_na_pole)

# pripojíme tlačidlá štart a stop
document["btn_start"].bind("click", start_game)
document["btn_stop"].bind("click", stop_game)
