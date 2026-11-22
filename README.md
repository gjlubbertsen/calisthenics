# Calisthenics

Een circuit van 7 oefeningen met geanimeerde voorbeelden en automatische progressie, als
installeerbare webapp (PWA). Geen server, geen account: alle data staat in de browser op je toestel.

## Wat de app doet

- **Instaptest**: per oefening kies je de trap die je al kunt en je maximum. Je startdoel wordt 70% daarvan.
- **Circuit-timer**: warming-up, rondes met werk en rust, piepjes, trillen, optioneel een gesproken coach.
  Het scherm blijft aan en de timer pauzeert zodra je de app verlaat.
- **Geanimeerde figuren** bij alle 42 trappen, van muur push-up tot pistol squat.
- **Progressie**: 3 trainingen op rij gehaald is doel +1 (holds +5 sec); 2 keer gemist is doel −1.
  Boven de bovengrens van een trap ga je naar de volgende trap. Sets die je niet deed tellen niet mee.
- **Uitleg per oefening**: tik op een oefening voor techniek, alle trappen, je doel aanpassen,
  van trap wisselen of de oefening tijdelijk uit het circuit halen.
- **Voortgang**: weekdoel en reeks, trainingen per week, verloop per oefening en 15 badges.
- **Historie**: maandkalender en alle trainingen, per training te verwijderen.
- **Donker en licht thema**, export en import van je data, offline te gebruiken.

## Bestanden

- `index.html` schermen
- `style.css` opmaak en thema's
- `app.js` timer, instaptest, progressie, statistieken, opslag
- `data.js` het trainingsprogramma (7 oefeningen, elk met trappen)
- `figures.js` de tekeningen: per figuur twee houdingen waartussen de app beweegt
- `manifest.webmanifest`, `sw.js` en `icons/` maken er een installeerbare, offline werkende app van

## Lokaal draaien

Een PWA moet via http(s) geladen worden, dus niet als `file://`.

    python3 -m http.server 8080

Open dan `http://localhost:8080`.

## Online zetten met GitHub Pages

1. `git push -u origin main`
2. Op GitHub: Settings → Pages → Source "Deploy from a branch", branch `main`, map `/ (root)`.
3. Na een minuut staat de app op `https://<jouw-naam>.github.io/calisthenics/`.

GitHub Pages is gratis voor publieke repositories; voor een privé-repository is een betaald plan nodig.

## Installeren op je telefoon

Open de https-link in Chrome. Menu → "App installeren" of "Toevoegen aan startscherm".
In de app staat onder Instellingen ook een knop "Installeer als app" zodra de browser dat aanbiedt.

## Programma aanpassen

Alles staat in `data.js`. Per trap: `name`, `fig` (tekening uit `figures.js`), `cue` (één regel
techniek), `start`, `top`, en optioneel `perSide`, `unit` en `tempo` (seconden per herhaling).
Timerinstellingen staan in de app onder Instellingen.

## Nieuwe versie uitrollen

Gewoon pushen. De service worker ververst de bestanden op de achtergrond, dus een geïnstalleerde
app toont de nieuwe versie bij de tweede keer openen.
