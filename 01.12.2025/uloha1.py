from browser import document, html, timer
from random import randint as r


def cislo_o_1():
    aktualne = int(document["number-display"].text)
    aktualne += 1
    document["number-display"].text = str(aktualne)

delay_ms = r(1000, 5000)   
timer.set_timeout(cislo_o_1, delay_ms)