# Translations

iCUE widgets support localization through JSON translation files and the `tr()` helper.

## Translation File

### File Location

Place the translation file in the same directory as `index.html`.

```
MyWidget/
├── index.html
├── translation.json
└── resources/
    └── icon.svg
```

### File Format

```json
{
    "en": {
        "translation": {
            "Hello": "Hello",
            "Settings": "Settings"
        }
    },
    "de": {
        "translation": {
            "Hello": "Hallo",
            "Settings": "Einstellungen"
        }
    },
    "uk": {
        "translation": {
            "Hello": "Привіт",
            "Settings": "Налаштування"
        }
    }
}
```

### Supported Languages

| Code    | Language                    |
| ------- | --------------------------- |
| `en`    | English (default, required) |
| `de`    | German                      |
| `es`    | Spanish                     |
| `fr`    | French                      |
| `it`    | Italian                     |
| `ja`    | Japanese                    |
| `ko`    | Korean                      |
| `pt`    | Portuguese                  |
| `ru`    | Russian                     |
| `zh_CN` | Chinese (Simplified)        |
| `zh_TW` | Chinese (Traditional)       |
| `uk`    | Ukrainian                   |

**Note:** `en` is required and is used as the fallback language for missing translations.

---

## Using Translations

### In Meta Parameters

Use `tr('key')` in `data-label`, `title`, and other attributes:

```html
<title>tr('My Widget')</title>

<meta
    name="x-icue-property"
    content="textColor"
    data-label="tr('Text Color')"
    data-type="color"
    data-default="'#ffffff'"
/>

<script type="application/json" id="x-icue-groups">
    [
        {
            "title": "tr('Appearance')",
            "properties": ["textColor", "backgroundColor"]
        }
    ]
</script>
```

### In JavaScript

The `tr()` function returns a Promise:

```javascript
async function updateUI() {
    const label = await tr("Hello");
    document.getElementById("greeting").textContent = label;
}

tr("Settings").then((text) => {
    document.getElementById("title").textContent = text;
});
```

Multiple translations:

```javascript
async function initTranslations() {
    const [hello, settings, save] = await Promise.all([
        tr("Hello"),
        tr("Settings"),
        tr("Save"),
    ]);
    document.getElementById("greeting").textContent = hello;
    document.getElementById("title").textContent = settings;
    document.getElementById("saveBtn").textContent = save;
}
```

---

## Complete Example

**translation.json:**

```json
{
    "en": {
        "translation": {
            "Clock": "Clock",
            "Time Zone": "Time Zone",
            "Text Color": "Text Color",
            "Appearance": "Appearance"
        }
    },
    "uk": {
        "translation": {
            "Clock": "Годинник",
            "Time Zone": "Часовий пояс",
            "Text Color": "Колір тексту",
            "Appearance": "Зовнішній вигляд"
        }
    }
}
```

**index.html:**

```html
<!doctype html>
<html lang="en">
    <head>
        <title>tr('Clock')</title>

        <meta
            name="x-icue-property"
            content="timeZone"
            data-label="tr('Time Zone')"
            data-type="combobox"
            data-values="[{'key':'utc','value':tr('UTC')},{'key':'est','value':tr('EST')},{'key':'cst','value':tr('CST')}]"
        />

        <meta
            name="x-icue-property"
            content="textColor"
            data-label="tr('Text Color')"
            data-type="color"
            data-default="'#ffffff'"
        />

        <script type="application/json" id="x-icue-groups">
            [
                {
                    "title": "tr('Appearance')",
                    "properties": ["timeZone", "textColor"]
                }
            ]
        </script>
    </head>
    <body>
        <div id="time"></div>
    </body>
</html>
```
