# Карточки ПДР — Поточний стан та план генерації

## Поточний стан: 5 карточок (seed-дані для тестування)

| # | ПДР | Питання (UK) | Складність | Теги |
|---|-----|-------------|-----------|------|
| 1 | 1.1 | Що означає дорожній знак 1.1? | EASY | signs, warning |
| 2 | 12.4 | Яка максимальна дозволена швидкість у населеному пункті? | EASY | speed, settlement |
| 3 | 16.12 | Хто має перевагу на перехресті рівнозначних доріг? | MEDIUM | intersections, priority, equal_roads |
| 4 | 16.4 | Чи можна виїжджати на перехрестя, якщо за ним утворився затор? | HARD | intersections, traffic_jam |
| 5 | 16.6 | Що повинен зробити водій при повороті ліворуч на регульованому перехресті? | MEDIUM | intersections, priority, turning |

## Мета: 1000 карточок

### Розподіл за складністю
- EASY: 200 (базові правила, один учасник, одна норма)
- MEDIUM: 500 (два учасники, пріоритет, виключення)
- HARD: 300 (множинні умови, конфлікти знаків/сигналів)

### Розподіл за темами (орієнтовно)

| Тема | Кількість | Розділи ПДР |
|------|----------|-------------|
| Знаки (signs, warning, prohibitory, mandatory, informational) | 200 | Додаток 1 |
| Перехрестя та пріоритет (intersections, priority, equal_roads, roundabout) | 150 | 16.1–16.15 |
| Швидкість (speed, settlement, highway) | 80 | 12.1–12.8 |
| Розмітка (markings) | 60 | Додаток 2 |
| Світлофори (traffic_lights) | 60 | 8.1–8.11 |
| Повороти та маневри (turning, lane_change, overtaking, reversing) | 100 | 10.1–10.5, 14.1–14.6 |
| Паркування та зупинка (parking, stopping) | 60 | 15.1–15.15 |
| Пішоходи (pedestrians, school_zone) | 50 | 17.1–17.4, 18.1–18.4 |
| Спецтранспорт (special_vehicles, emergency) | 40 | 3.1–3.8 |
| Залізничний переїзд (railway_crossing) | 30 | 20.1–20.8 |
| Буксирування, вантажі, пасажири (towing, cargo, passengers) | 30 | 21–23 |
| Велосипедисти (cyclists) | 20 | 6.1–6.8 |
| Видимість, погода (visibility, weather) | 20 | 9.8, 12.5 |
| Документи, обов'язки (documents) | 30 | 2.1–2.14 |
| Медична допомога (first_aid) | 30 | — |
| Безпека, будова ТЗ (safety, vehicle_systems) | 40 | — |

### Як генерувати

1. **JSON Schema** для валідації: `agents/data/ticket-schema.json`
2. **Приклад** (3 карточки): `agents/data/tickets-example.json`
3. **Промпт для генерації**: `agents/prompts/ticket-generator.md`
4. **Промпт для валідації**: `agents/prompts/ticket-validator.md`

### Процес

```
1. Підготувати rules.jsonl (витяг норм з ПДР) — використати agents/prompts/pdd-extractor.md
2. Генерувати батчами по 50 карточок — використати agents/prompts/ticket-generator.md
3. Валідувати кожну карточку — використати agents/prompts/ticket-validator.md
4. Зберегти у agents/data/tickets.generated.json
5. Імпортувати через API: npx tsx agents/scripts/import-tickets.ts
   або через Admin UI: http://localhost:3000/admin/import
```

### Формат файлу для імпорту

Файл `tickets.generated.json`:
```json
{
  "tickets": [
    {
      "questionRu": "...",
      "questionUk": "...",
      "explanationRu": "...",
      "explanationUk": "...",
      "pddRef": "12.4",
      "difficulty": "EASY",
      "tags": ["speed", "settlement"],
      "scenarioHash": "speed-settlement-50kmh-basic-001",
      "imageBrief": "Знак обмеження швидкості 50 км/год",
      "imageSearchQueries": ["site:commons.wikimedia.org UA road sign 3.29-050 svg"],
      "options": [
        { "textRu": "A", "textUk": "A", "isCorrect": false, "order": 1 },
        { "textRu": "B", "textUk": "B", "isCorrect": true, "order": 2 },
        { "textRu": "C", "textUk": "C", "isCorrect": false, "order": 3 },
        { "textRu": "D", "textUk": "D", "isCorrect": false, "order": 4 }
      ]
    }
  ]
}
```
