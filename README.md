# Course Pay

Минимальная статическая страница оплаты онлайн-программы «ИИ для экспертов».

## Проверка

```bash
node --test tests/site.test.mjs
python3 -m http.server 4173 --bind 127.0.0.1
```

В production сайт собирается из `Dockerfile` и обслуживается через
Dockploy/Traefik на `https://pay.larkinmd7.ru`.
