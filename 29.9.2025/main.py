from browser import document, html
from random import choice

for i in range(7):
    x = html.DIV(str(i+1), Id="div"+str(i+1), Class="cisla")
    x.style.border = "1px solid black"
    x.style.background = ["red", "orange", "yellow", "green", "blue", "indigo", "violet"][i]
    document <= x
    
def zmenFarbu(ev):
    e = document["zmeneniefarby"]
    e.style = { "color": "red" }
document["tlacitko"].bind("click", zmenFarbu)