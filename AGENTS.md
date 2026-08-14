# Course Pay

Статическая страница оплаты программы «ИИ для экспертов» на `pay.larkinmd7.ru`.

- Локальный просмотр: `python3 -m http.server 4173 --bind 127.0.0.1`
- Тесты: `node --test tests/site.test.mjs`
- Контейнер: `docker build -t course-pay .`
- Healthcheck: `GET /health` → `200 ok`

Критичные инварианты: три фиксированные суммы 29 900 / 49 900 / 89 900 ₽;
ShopID ЮKassa `1275315`; ФИО и e-mail обязательны; секретов и собственной базы нет.

Definition of Done: тесты зелёные, переход в ЮKassa работает, HTTPS и mobile
smoke пройдены, rollback указан в паспорте.
