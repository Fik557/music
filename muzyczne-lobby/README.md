# Muzyczne Lobby

Gotowa strona do gry muzycznej:

- gracze wchodzą tylko nickiem i wybierają drużynę,
- wszyscy w pokoju słyszą ten sam fragment piosenki,
- pierwszy gracz, który wciśnie przycisk, pauzuje piosenkę u wszystkich,
- moderator może odpauzować, przejść dalej i dopisać punkty,
- domyślnie fragment trwa 10 sekund: 0-5 s daje 2 pkt, 5-7 s daje 1 pkt.

## Uruchomienie lokalnie

W folderze projektu uruchom:

    node server.js

Potem otwórz:

    http://localhost:3000

## Publiczny link online

Najprościej wrzucić ten folder na hosting Node.js, np. Render albo Railway.

Render:

1. Utwórz nowe konto na Render.
2. Wrzuć folder muzyczne-lobby do repozytorium GitHub.
3. W Render wybierz New Web Service.
4. Start command ustaw na: node server.js
5. Po wdrożeniu Render da link w stylu: https://twoja-nazwa.onrender.com

Ten link wysyłasz graczom. Link z kodem pokoju skopiujesz w aplikacji przyciskiem obok nazwy pokoju.

## Dodawanie piosenek

W panelu moderatora wklej link do pliku audio, np. MP3. Możesz też dodać pliki do folderu public/music.

Wtedy w panelu wpisujesz ścieżkę:

    /music/nazwa-pliku.mp3

Używaj tylko utworów, które możesz legalnie udostępniać uczestnikom gry.

## Ważne

Przeglądarki blokują automatyczne odtwarzanie dźwięku, dlatego każdy gracz musi po wejściu nacisnąć Włącz dźwięk.
