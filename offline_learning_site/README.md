# Offline Learning — Modular Site

This project is a lightweight, fully offline learning site for low resource environments such as jails or prisons. It uses only HTML, CSS, JavaScript, and JSON. No internet access is required.

## Features
- Modular JSON content in `/modules/*`
- Local progress tracking via `localStorage`
- Search across module metadata
- Simple quizzes with immediate feedback
- Export and import progress (as JSON)
- Print-friendly styles
- No external fonts, images, or CDNs

## Running
- Option A: Open `index.html` directly in a browser (file://). All content loads from local files.
- Option B: Start a tiny local server (optional): `python3 -m http.server 8080` and visit `http://localhost:8080`.

## Extending Content
1. Create a new folder under `/modules/<your-module>`.
2. Add `lessons.json` with an array of lessons.
3. Update `/modules/index.json` to include your module id, title, description, tags, and lesson_count.

### Lesson JSON shape
```json
{
  "lessons": [
    {
      "id": "unique-id",
      "title": "Lesson Title",
      "level": "Intro",
      "content": [
        { "type": "p", "text": "Paragraph" },
        { "type": "ul", "items": ["Item 1", "Item 2"] },
        { "type": "ol", "items": ["Step 1", "Step 2"] },
        { "type": "code", "code": "Example code" },
        { "type": "h3", "text": "Subheading" }
      ],
      "quiz": {
        "prompt": "Question?",
        "choices": ["A", "B", "C"],
        "answer": 1
      }
    }
  ]
}
```

## Accessibility
- Keyboard accessible controls
- ARIA roles for quiz radiogroup and choices
- High-contrast friendly and print-friendly

## License
Public domain (CC0). Modify and redistribute freely.
