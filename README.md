# ImperiialClaw

Un agent IA personnel local fonctionnant entièrement via Telegram.

## 🚀 Installation

1. Clonez le dépôt (ou copiez les fichiers).
2. Installez les dépendances :
   ```bash
   npm install
   ```
3. Configurez votre environnement :
   - Copiez `.env.example` vers `.env`.
   - Remplissez les clés API et votre ID Telegram.
4. Lancez l'agent :
   ```bash
   npm run dev
   ```

## ⚙️ Configuration (.env)

| Variable | Description |
| --- | --- |
| `TELEGRAM_BOT_TOKEN` | Token obtenu via @BotFather. |
| `TELEGRAM_ALLOWED_USER_IDS` | Liste des IDs autorisés (ex: `123456,789012`). |
| `GROQ_API_KEY` | Clé API Groq (Modèle llama-3.3-70b-versatile). |
| `OPENROUTER_API_KEY` | (Optionnel) Clé OpenRouter pour le fallback. |
| `DB_PATH` | Chemin vers la base SQLite (défaut `./data/memory.db`). |
| `AGENT_MAX_ITERATIONS` | Limite de boucle de raisonnement (défaut `5`). |

## 🛠️ Structure

- `src/bot` : Interface Telegram (grammY).
- `src/llm` : Client Groq + Fallback OpenRouter.
- `src/agent` : Boucle de raisonnement (ReAct style).
- `src/tools` : Registre des outils (ex: `get_current_time`).
- `src/memory` : Persistance SQLite (Messages & Faits).
