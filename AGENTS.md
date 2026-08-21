# Course Pay

Статическая страница оплаты программы «ИИ для экспертов» на `pay.larkinmd7.ru`.

- Локальный просмотр: `python3 -m http.server 4173 --bind 127.0.0.1`
- Тесты: `node --test tests/site.test.mjs`
- Контейнер: `docker build -t course-pay .`
- Healthcheck: `GET /health` → `200 ok`

Критичные инварианты: три фиксированные суммы 29 900 / 49 900 / 89 900 ₽ и
временный служебный платёж 10 ₽; ShopID ЮKassa `1436088`; ФИО и e-mail
обязательны; секретов и собственной базы нет. После проверки боевого платежа
форму 10 ₽ и маршрут `/success/test/` нужно удалить.

Definition of Done: тесты зелёные, переход в ЮKassa работает, HTTPS и mobile
smoke пройдены, rollback указан в паспорте.
