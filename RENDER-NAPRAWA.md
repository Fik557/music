# Naprawa deploya Render

Błąd:

    Cannot find module '/opt/render/project/src/server.js'

oznacza, że Render startuje aplikację z katalogu głównego repozytorium, a plik server.js jest w podfolderze muzyczne-lobby.

## Najprostsza opcja w Render

W ustawieniach usługi ustaw:

- Root Directory: muzyczne-lobby
- Build Command: yarn
- Start Command: node server.js

Potem kliknij Manual Deploy albo Deploy latest commit.

## Opcja bez Root Directory

Jeśli zostawiasz Root Directory puste, ustaw:

- Build Command: cd muzyczne-lobby && yarn
- Start Command: node muzyczne-lobby/server.js

## Opcja przez pliki w repo

Możesz też dodać do głównego katalogu repozytorium pliki package.json i server.js z folderu outputs. Wtedy obecna komenda Rendera node server.js też zadziała.
