# Darmowy hosting: Koyeb + Neon

Projekt jest przygotowany do bezplatnego uruchomienia jako:

- Koyeb Free Web Service: serwer Node.js i WebSocket,
- Neon Free: trwala baza PostgreSQL dla biblioteki, wynikow i zgloszen.

## 1. Baza Neon

1. Zaloz darmowe konto na https://console.neon.tech/.
2. Utworz projekt w regionie europejskim.
3. Skopiuj connection string PostgreSQL. Powinien zaczynac sie od `postgresql://` i zawierac `sslmode=require`.

Nie zapisuj connection stringa w GitHubie. Zostanie dodany jako sekret w Koyeb.

## 2. Serwis Koyeb

1. Zaloz konto na https://app.koyeb.com/ i wybierz plan Starter.
2. Utworz Web Service z repozytorium `Fik557/music`, galezi `main`.
3. Wybierz darmowa instancje `Free` oraz region Frankfurt.
4. Build command: `npm ci`.
5. Run command: `npm start`.
6. Port pozostaw z wartosci zmiennej `PORT` ustawianej przez Koyeb.
7. Health check path: `/api/health`.
8. Dodaj zmienne srodowiskowe:

   - `DATABASE_URL`: connection string z Neon,
   - `MODERATOR_PASSWORD`: haslo administratora,
   - `NODE_ENV`: `production`.

Nie wybieraj instancji `eco` ani `standard`, bo sa platne. Darmowa instancja moze zasnac po godzinie bez ruchu; pierwsze wejscie po przerwie potrwa wtedy kilka sekund.

## Dane

Przy pierwszym uruchomieniu serwer automatycznie przenosi dane z `muzyczne-lobby/data/rooms.json` do PostgreSQL. Kolejne zmiany sa zapisywane w bazie. Lokalnie, bez `DATABASE_URL`, aplikacja nadal korzysta z SQLite/JSON.

Pliki audio dodane bezposrednio przez formularz sa zapisywane na dysku serwera i na darmowej instancji nie sa trwale. Do openingow uzywaj linkow YouTube lub plikow umieszczonych w repozytorium.
