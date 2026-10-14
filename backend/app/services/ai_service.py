import os
import json
import requests

class AIService:
    @staticmethod
    def is_ai_configured():
        api_key = os.getenv("AI_API_KEY", "").strip()
        return bool(api_key)

    @classmethod
    def get_provider_info(cls):
        configured = cls.is_ai_configured()
        provider = os.getenv("AI_PROVIDER", "gemini" if configured else "educational_fallback")
        model = os.getenv("AI_MODEL", "gemini-1.5-flash")
        return {
            "configured": configured,
            "provider": provider if configured else "Educational Fallback (No API key set)",
            "model": model if configured else "Rule-based academic engine"
        }

    @classmethod
    def generate_chat_response(cls, messages, subject_context=""):
        api_key = os.getenv("AI_API_KEY", "").strip()
        provider = os.getenv("AI_PROVIDER", "gemini").lower()
        model = os.getenv("AI_MODEL", "gemini-1.5-flash")

        system_instruction = (
            "You are StudyFlow AI, an intelligent, empathetic academic tutor and study planner. "
            "Help students understand difficult concepts, solve problems step-by-step, "
            "and suggest actionable study habits. Format formulas using KaTeX / LaTeX ($ or $$) when helpful. "
            "Use clear headings, bullet points, and code snippets when appropriate."
        )
        if subject_context:
            system_instruction += f"\nSubject Context: {subject_context}"

        last_user_msg = messages[-1]["content"] if messages else ""

        # If API key is available, call real provider
        if api_key:
            try:
                if "gemini" in provider or api_key.startswith("AIza"):
                    endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                    contents = []
                    # Format past conversation
                    for m in messages[-6:]:
                        role = "user" if m.get("role") == "user" else "model"
                        contents.append({
                            "role": role,
                            "parts": [{"text": m.get("content", "")}]
                        })
                    payload = {
                        "contents": contents,
                        "systemInstruction": {"parts": [{"text": system_instruction}]},
                        "generationConfig": {"temperature": 0.7, "maxOutputTokens": 1024}
                    }
                    resp = requests.post(endpoint, json=payload, timeout=20)
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data["candidates"][0]["content"]["parts"][0]["text"]
                        return {
                            "content": text,
                            "source": "ai_model",
                            "model": model
                        }
                    else:
                        print(f"[AIService Error] Gemini API status {resp.status_code}: {resp.text}")
                elif "openai" in provider:
                    endpoint = "https://api.openai.com/v1/chat/completions"
                    chat_history = [{"role": "system", "content": system_instruction}]
                    for m in messages[-6:]:
                        chat_history.append({"role": m.get("role", "user"), "content": m.get("content", "")})
                    payload = {
                        "model": model if "gpt" in model else "gpt-3.5-turbo",
                        "messages": chat_history,
                        "temperature": 0.7
                    }
                    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
                    resp = requests.post(endpoint, json=payload, headers=headers, timeout=20)
                    if resp.status_code == 200:
                        data = resp.json()
                        text = data["choices"][0]["message"]["content"]
                        return {
                            "content": text,
                            "source": "ai_model",
                            "model": model
                        }
            except Exception as e:
                print(f"[AIService Exception] Provider request failed: {e}")

        # Transparent Educational Fallback
        return cls._generate_fallback_response(last_user_msg, subject_context)

    @classmethod
    def _generate_fallback_response(cls, question, subject_context=""):
        q_lower = question.lower()
        
        fallback_header = (
            "> **Notice:** *Educational Fallback Mode active (No external AI API key configured in `.env`). "
            "Here is curated academic guidance for your query:*\n\n"
        )
        
        if "pomodoro" in q_lower or "focus" in q_lower or "timer" in q_lower:
            body = (
                "### The Pomodoro Technique for Productive Study\n"
                "1. **Set your focus block**: Study intensely for **25 minutes** with all notifications silenced.\n"
                "2. **Short Refresh**: Take a **5-minute break** (stretch, drink water, step away from screens).\n"
                "3. **Longer Break**: After **4 consecutive cycles**, reward yourself with a **15–30 minute break**.\n\n"
                "💡 **StudyFlow Tip:** Use the integrated Pomodoro Timer on your Planner page to track today's focused sessions automatically!"
            )
        elif "overfit" in q_lower:
            body = (
                "### Understanding Overfitting in Machine Learning\n"
                "- **Definition**: Overfitting occurs when a statistical or machine learning model learns the training data's noise and quirks rather than the true underlying distribution.\n"
                "- **Symptoms**: High training accuracy with significantly degraded validation / test accuracy.\n"
                "- **Remedies**:\n"
                "  1. **Regularization** ($L_1$ Lasso, $L_2$ Ridge, Dropout in neural networks).\n"
                "  2. **Cross-Validation**: $k$-fold cross-validation to assess generalization.\n"
                "  3. **Early Stopping**: Stop training when validation loss stops improving.\n"
                "  4. **Data Augmentation**: Expand training variations to prevent memorization."
            )
        elif "time complexity" in q_lower or "big o" in q_lower:
            body = (
                "### Big-O Algorithmic Complexity Cheat Sheet\n"
                "- **$O(1)$ Constant**: Array lookup by index, hash map lookup (average case).\n"
                "- **$O(\\log n)$ Logarithmic**: Binary search on a sorted list, balanced BST search.\n"
                "- **$O(n)$ Linear**: Iterating through an unsorted array, linear search.\n"
                "- **$O(n \\log n)$ Linearithmic**: MergeSort, QuickSort (average), HeapSort.\n"
                "- **$O(n^2)$ Quadratic**: Bubble sort, nested loops over the same collection."
            )
        elif "python" in q_lower:
            body = (
                "### Python Mastery Roadmap & Core Concepts\n"
                "- **Data Structures**: Lists (mutable), Tuples (immutable), Sets (unique), Dicts (key-value hash table).\n"
                "- **Key Functions**: List comprehensions `[x**2 for x in nums if x > 0]`, generator expressions, and decorators.\n"
                "- **Memory Management**: Reference counting + cyclic garbage collection.\n\n"
                "```python\n# Example: Clean generator pipeline\ndef get_even_squares(numbers):\n    return (n**2 for n in numbers if n % 2 == 0)\n```"
            )
        elif "sql" in q_lower or "database" in q_lower:
            body = (
                "### SQL vs NoSQL: Practical Comparison\n"
                "- **Relational (SQL)**: Strict schemas, ACID transactions, foreign key constraints (e.g. PostgreSQL, SQLite). Ideal for complex relational joins.\n"
                "- **Document (MongoDB)**: Flexible JSON-like BSON schemas, embedding vs referencing, horizontal sharding. Ideal for evolving data and hierarchical documents."
            )
        else:
            body = (
                f"### Academic Concept Breakdown: *{question[:60]}...*\n\n"
                "Here is a structured framework to solve or study this topic:\n\n"
                "1. **Core Concept Definition**: Identify the fundamental definitions, axioms, or mechanics underlying this question.\n"
                "2. **Worked Example / Application**: Break the problem down into sequential steps—input assumptions, transformation rule, and output verification.\n"
                "3. **Self-Check Test**: Attempt 2–3 targeted practice questions in the **MCQ Tests** module to solidify your memory retention.\n\n"
                "📌 *To unlock dynamic, conversational responses with real-time AI, set `AI_API_KEY` and `AI_PROVIDER=gemini` in your backend `.env` file.*"
            )

        return {
            "content": fallback_header + body,
            "source": "educational_fallback",
            "model": "rule_based_academic_engine"
        }

    @classmethod
    def generate_quiz_questions(cls, topic, count=5, difficulty="Medium"):
        api_key = os.getenv("AI_API_KEY", "").strip()
        provider = os.getenv("AI_PROVIDER", "gemini").lower()
        model = os.getenv("AI_MODEL", "gemini-1.5-flash")

        if api_key and ("gemini" in provider or api_key.startswith("AIza")):
            try:
                endpoint = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
                prompt = (
                    f"Generate exactly {count} multiple choice questions about '{topic}' at '{difficulty}' difficulty. "
                    "Return ONLY a valid JSON array of objects with keys: "
                    "'question' (string), 'options' (array of 4 strings), 'correct_option' (0-indexed integer), 'explanation' (string). "
                    "Do not include markdown backticks or commentary."
                )
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {"temperature": 0.4}
                }
                resp = requests.post(endpoint, json=payload, timeout=20)
                if resp.status_code == 200:
                    text = resp.json()["candidates"][0]["content"]["parts"][0]["text"].strip()
                    if text.startswith("```json"):
                        text = text[7:]
                    if text.startswith("```"):
                        text = text[3:]
                    if text.endswith("```"):
                        text = text[:-3]
                    items = json.loads(text.strip())
                    for it in items:
                        it["is_ai_generated"] = True
                        it["topic"] = topic
                        it["difficulty"] = difficulty
                    return items
            except Exception as e:
                print(f"[AIService Quiz Gen Error] {e}")

        return None

