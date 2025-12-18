from browser import document, html, timer
import time
import random
gameDuration = 30
gameActive = False
score = 0
def rungame(ev):
    global score, gameActive
    score = 0
    gameActive = True
    document["start"].attrs["disabled"] = "disabled"
    end_time = time.time() + gameDuration
    def show_mole():
        if not gameActive:
            return
        for btn in document.select("button[title='mole']"):
            btn.style.visibility = "hidden"
        mole_button = random.choice(document.select("button[title='mole']"))
        mole_button.style.visibility = "visible"
        timer.set_timeout(show_mole, 800)
    def end_game():
        global gameActive
        gameActive = False
        for btn in document.select("button[title='mole']"):
            btn.style.visibility = "hidden"
        document["start"].attrs.pop("disabled", None)
        alert = html.DIV(f"Game Over! Your score: {score}")
        document <= alert
    show_mole()
    timer.set_timeout(end_game, game_duration * 1000)
document["start"].bind("click", rungame)