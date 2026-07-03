# Muzyczne Lobby

Gotowa strona do gry muzycznej:

- gracze wchodzą nickiem,
- moderator wchodzi hasłem: Kochamkotki,
- gracze tworzą własną grupę przez nazwę grupy i hasło grupy,
- kolejni gracze dołączają do istniejącej grupy wpisując tę samą nazwę i hasło,
- gracze nie widzą tytułu piosenki, dopóki nie skończy się czas albo moderator nie kliknie Zgadnięte,
- pierwszy gracz, który kliknie Zgaduje!, pauzuje piosenkę u wszystkich,
- moderator może odpauzować, przyznać punkty, edytować piosenki i wyrzucać graczy,
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
4. Jeśli repozytorium ma folder muzyczne-lobby w środku, ustaw Root Directory: muzyczne-lobby.
5. Build Command ustaw na: yarn
6. Start Command ustaw na: node server.js
7. Po wdrożeniu Render da link w stylu: https://twoja-nazwa.onrender.com

Ten link wysyłasz graczom. Link z kodem pokoju skopiujesz w aplikacji przyciskiem obok nazwy pokoju.

## Dodawanie piosenek

W panelu moderatora wklej link do pliku audio, np. MP3. Możesz też dodać pliki do folderu public/music.

Wtedy w panelu wpisujesz ścieżkę:

    /music/nazwa-pliku.mp3

Możesz też wkleić link YouTube. Odtwarzanie YouTube działa przez osadzony odtwarzacz YouTube w przeglądarce, więc każdy gracz nadal musi kliknąć Włącz dźwięk po wejściu.

Tytuł i wykonawca są opcjonalne. Wpisane piosenki można później edytować przyciskiem Edytuj.

## Ważne

Przeglądarki blokują automatyczne odtwarzanie dźwięku, dlatego każdy gracz musi po wejściu nacisnąć Włącz dźwięk.
