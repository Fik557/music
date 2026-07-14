# Darmowy hosting: Back4app + Neon

Projekt jest przygotowany do bezplatnego uruchomienia jako:

- Back4app Free Container: serwer Node.js i WebSocket,
- Neon Free: trwala baza PostgreSQL dla biblioteki, wynikow i zgloszen.

## 1. Baza Neon

1. Zaloz darmowe konto na https://console.neon.tech/.
2. Utworz projekt w regionie europejskim.
3. Skopiuj connection string PostgreSQL. Powinien zaczynac sie od `postgresql://` i zawierac `sslmode=require`.

Nie zapisuj connection stringa w GitHubie. Zostanie dodany jako sekret w Back4app.

## 2. Kontener Back4app

1. Zaloz konto bez karty na https://www.back4app.com/signup-containers.
2. Wybierz Containers i polacz repozytorium `Fik557/music`, galaz `main`.
3. Wybierz plan `Free` za `$0`.
4. Projekt automatycznie uzyje pliku `Dockerfile` i portu `8080`.
5. Health check path: `/api/health`.
6. Dodaj zmienne srodowiskowe:

   - `DATABASE_URL`: connection string z Neon,
   - `MODERATOR_PASSWORD`: haslo administratora,
   - `NODE_ENV`: `production`.

Nie wybieraj planu Shared ani Dedicated, bo sa platne. Darmowy kontener ma 256 MB RAM, dlatego projekt ustawia bezpieczny limit pamieci Node.js.

## Dane

Przy pierwszym uruchomieniu serwer automatycznie przenosi dane z `muzyczne-lobby/data/rooms.json` do PostgreSQL. Kolejne zmiany sa zapisywane w bazie. Lokalnie, bez `DATABASE_URL`, aplikacja nadal korzysta z SQLite/JSON.

Pliki audio dodane bezposrednio przez formularz sa zapisywane na dysku serwera i na darmowej instancji nie sa trwale. Do openingow uzywaj linkow YouTube lub plikow umieszczonych w repozytorium.
