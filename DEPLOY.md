# HolisticBite deploy notes

Проект теперь подключен к Notion через Next.js API.

## Что загружать в GitHub
Загружай в репозиторий корень этой папки, а не только `outputs`.

Обязательные файлы и папки:
- `package.json`
- `next.config.js`
- `pages/api/cms.js`
- `public/`
- `.gitignore`

Папка `outputs` оставлена как рабочая/резервная копия старого статического сайта.

## Vercel variables
В проекте Vercel должны быть переменные:
- `NOTION_TOKEN`
- `NOTION_FORMATS_DB_ID`
- `NOTION_REVIEWS_DB_ID`
- `NOTION_ANALYSES_DB_ID`
- `NOTION_LINKS_DB_ID`
- `NOTION_TEXTS_DB_ID`

После изменения переменных или кода сделай новый deploy.
