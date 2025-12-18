from browser import document, timer
import random
import time

start_btn = document["start-btn"]
click_btn = document["click-btn"]
status_div = document["status"]
current_span = document["current-time"]
best_span = document["best-time"]
history_list = document["history-list"]

start_time = None
best_time = None
history = []      # zoznam posledných časov (ms)
timeout_id = None # aby sme vedeli zrušiť časovač, ak treba


def reset_ui():
    """Resetuje stav hry do východzej podoby."""
    global start_time, timeout_id
    start_time = None
    if timeout_id is not None:
        timer.clear_timeout(timeout_id)
    timeout_id = None

    click_btn.style.display = "none"
    click_btn.disabled = False
    start_btn.disabled = False
    status_div.text = "Pripravený na nový pokus."


def show_target():
    """Zobrazí tlačidlo na kliknutie a uloží čas štartu merania."""
    global start_time
    status_div.text = "TERAZ klikni!"
    click_btn.style.display = "inline-block"
    start_time = time.time()


def start_test(ev):
    """Spustenie testu — nastaví náhodné oneskorenie."""
    global timeout_id, start_time
    reset_ui()
    start_btn.disabled = True
    status_div.text = "Čakaj... tlačidlo sa objaví čoskoro."

    # náhodné oneskorenie medzi 1 a 4 sekundami
    delay_ms = random.randint(1000, 4000)
    timeout_id = timer.set_timeout(show_target, delay_ms)


def click_reaction(ev):
    """Vyhodnotí reakčný čas po kliknutí na cieľ."""
    global best_time, history

    if start_time is None:
        # používateľ klikol skôr, ako sa nastavil start_time
        status_div.text = "Podvádzaš 😊 počkaj, kým sa tlačidlo objaví."
        return

    reaction_s = time.time() - start_time
    reaction_ms = int(reaction_s * 1000)

    # Aktuálny čas
    current_span.text = str(reaction_ms)

    # Najlepší čas
    if best_time is None or reaction_ms < best_time:
        best_time = reaction_ms
        best_span.text = str(best_time)

    # História (max 5 posledných)
    history.append(reaction_ms)
    if len(history) > 5:
        history = history[-5:]

    # Prekresliť zoznam
    history_list.clear()
    for t in history:
        from browser import html
        li = html.LI(f"{t} ms")
        history_list <= li

    status_div.text = "Pekne! Skús to znova."
    click_btn.style.display = "none"
    start_btn.disabled = False


# priradenie udalostí
start_btn.bind("click", start_test)
click_btn.bind("click", click_reaction)

# po načítaní stránky:
reset_ui()