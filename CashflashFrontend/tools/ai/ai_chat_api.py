import json
import os
import random
import re
import tempfile
import unicodedata
from collections import deque
from contextlib import asynccontextmanager
from decimal import Decimal
from typing import Any, Literal
from urllib.parse import quote_plus

from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from langchain_ollama import ChatOllama
from pydantic import BaseModel, Field, ValidationError
from sqlalchemy import create_engine, text
import uvicorn

try:
    from faster_whisper import WhisperModel
except ImportError:
    WhisperModel = None

load_dotenv(Path(__file__).resolve().parent / ".env")

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:1.5b")
OLLAMA_SQL_MODEL = os.getenv("OLLAMA_SQL_MODEL", OLLAMA_MODEL)
OLLAMA_RECOMMENDATION_MODEL = os.getenv("OLLAMA_RECOMMENDATION_MODEL", OLLAMA_MODEL)
OLLAMA_VOICE_MODEL = os.getenv("OLLAMA_VOICE_MODEL", OLLAMA_MODEL)
OLLAMA_KEEP_ALIVE = os.getenv("OLLAMA_KEEP_ALIVE", "30m")
VOICE_ASR_MODEL_SIZE = os.getenv("VOICE_ASR_MODEL_SIZE", "small")
VOICE_ASR_DEVICE = os.getenv("VOICE_ASR_DEVICE", "cpu")
VOICE_ASR_COMPUTE_TYPE = os.getenv("VOICE_ASR_COMPUTE_TYPE", "int8")
VOICE_ALLOWED_EXTENSIONS = {
    ".wav",
    ".mp3",
    ".m4a",
    ".mp4",
    ".mpeg",
    ".mpga",
    ".webm",
    ".ogg",
}

DB_HOST = os.getenv("DB_HOST", "127.0.0.1")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME", "cashflashdb")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "root")
DB_QUERY_LIMIT = int(os.getenv("DB_QUERY_LIMIT", "10"))
AI_PREVIEW_ROWS = int(os.getenv("AI_PREVIEW_ROWS", "10"))
AI_HOST = os.getenv("AI_HOST", "0.0.0.0")
AI_PORT = int(os.getenv("AI_PORT", "28001"))
AI_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        "AI_ALLOWED_ORIGINS",
        "http://localhost:25174,http://localhost:25175,http://127.0.0.1:25174,http://127.0.0.1:25175",
    ).split(",")
    if origin.strip()
]

FORBIDDEN_SQL = re.compile(
    r"\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|REPLACE|GRANT|REVOKE|MERGE|CALL)\b",
    re.IGNORECASE,
)

SMALL_TALK = {
    "hi",
    "hello",
    "helllo",
    "hey",
    "thanks",
    "thank you",
    "bye",
    "help",
    "who are you",
    "what can you do",
}

TABLE_ALIASES = {
    "user": ["user", "users", "customer", "customers"],
    "users": ["user", "users", "customer", "customers"],
    "wallet": ["wallet", "wallets", "balance", "balances"],
    "wallets": ["wallet", "wallets", "balance", "balances"],
    "transaction": [
        "transaction",
        "transactions",
        "payment",
        "payments",
        "transfer",
        "topup",
        "top-up",
    ],
    "transactions": [
        "transaction",
        "transactions",
        "payment",
        "payments",
        "transfer",
        "topup",
        "top-up",
    ],
    "merchant": ["merchant", "merchants", "store", "stores"],
    "merchants": ["merchant", "merchants", "store", "stores"],
    "bank_account": ["bank", "bank account", "bank accounts", "account", "accounts"],
    "bank_accounts": ["bank", "bank account", "bank accounts", "account", "accounts"],
    "card": ["card", "cards"],
    "cards": ["card", "cards"],
    "audit_log": ["audit", "audit log", "logs", "login"],
    "audit_logs": ["audit", "audit log", "logs", "login"],
}

QUESTION_HINTS = {
    "how",
    "show",
    "list",
    "latest",
    "last",
    "recent",
    "count",
    "total",
    "find",
    "get",
    "which",
    "what",
    "top",
    "active",
    "inactive",
    "highest",
    "lowest",
}

DOMAIN_TERMS = {
    alias.lower()
    for aliases in TABLE_ALIASES.values()
    for alias in aliases
}

RECOMMENDATION_TOPICS = [
    {
        "focus": "wallet readiness for daily CashFlash payments",
        "goal": "encourage healthy wallet balance habits for quick transfers and bill payments",
    },
    {
        "focus": "bank linking for smoother CashFlash withdrawals",
        "goal": "encourage linking and verifying a bank account before the user needs to withdraw funds",
    },
    {
        "focus": "transaction review for safer CashFlash usage",
        "goal": "encourage users to review recent transactions and spot unusual activity early",
    },
    {
        "focus": "PIN safety for wallet and transfer protection",
        "goal": "encourage stronger payment security habits without sounding scary",
    },
    {
        "focus": "failed payment recovery inside CashFlash",
        "goal": "encourage checking balance, bank, and card details before retrying a failed transaction",
    },
    {
        "focus": "beneficiary accuracy for person-to-person transfers",
        "goal": "encourage users to keep recipient details correct to avoid failed or delayed transfers",
    },
    {
        "focus": "KYC completion for better CashFlash access",
        "goal": "encourage finishing KYC to unlock smoother usage and stronger account trust",
    },
    {
        "focus": "spending awareness using CashFlash history",
        "goal": "encourage users to review transaction history and track spending patterns",
    },
    {
        "focus": "card readiness for top-ups and payment continuity",
        "goal": "encourage users to keep an active card available for wallet funding",
    },
]

DEFAULT_RECOMMENDATION_TITLE = "Payment Recommendation"
DEFAULT_RECOMMENDATION_MESSAGE = "Keep your wallet, PIN, and bank details updated for smoother and safer payments."
RECOMMENDATION_HISTORY = deque(maxlen=6)
RECOMMENDATION_SIMILARITY_STOPWORDS = {
    "a",
    "an",
    "and",
    "for",
    "your",
    "with",
    "the",
    "to",
    "of",
    "on",
    "in",
    "keep",
    "check",
    "use",
    "stay",
    "cashflash",
}
RECOMMENDATION_TITLE_FILLER_WORDS = {
    "your",
    "with",
    "for",
    "the",
    "and",
    "are",
    "ready",
    "today",
}

RECOMMENDATION_FALLBACKS = [
    {
        "title": "Keep Wallet Ready",
        "message": "Maintain enough wallet balance so daily transfers and payments can go through without delays.",
    },
    {
        "title": "Review Recent Activity",
        "message": "Check your latest transactions often so you can catch unusual activity and missed payments early.",
    },
    {
        "title": "Link Bank Early",
        "message": "Link and verify your bank account early to make withdrawals and wallet transfers smoother.",
    },
    {
        "title": "Protect With PIN",
        "message": "Use a strong PIN and avoid sharing it to keep wallet payments and transfers more secure.",
    },
    {
        "title": "Complete KYC",
        "message": "Finish your KYC process to unlock smoother account access and stronger payment reliability.",
    },
    {
        "title": "Check Before Retry",
        "message": "Before retrying a failed payment, confirm balance and account details to avoid repeated failures.",
    },
]


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    answer: str
    response_type: Literal["text", "table"] = "text"
    columns: list[str] = Field(default_factory=list)
    rows: list[dict[str, Any]] = Field(default_factory=list)


class RecommendationResponse(BaseModel):
    title: str
    message: str


class VoiceSendMoneyPayload(BaseModel):
    identifier: str | None = None
    amount: int | None = None
    paymentMethod: Literal["WALLET", "BANK", "CARD"] | None = None


class VoiceSendMoneyResponse(BaseModel):
    transcript: str
    payload: VoiceSendMoneyPayload


class VoiceParserResult(BaseModel):
    identifier: str | None = None
    amount: int | None = None
    paymentMethod: Literal["WALLET", "BANK", "CARD"] | None = None


def build_db_url() -> str:
    return (
        f"mysql+pymysql://{quote_plus(DB_USER)}:{quote_plus(DB_PASSWORD)}"
        f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    )


def text_response(answer: str) -> ChatResponse:
    return ChatResponse(answer=answer)


def is_small_talk(message: str) -> bool:
    return message.strip().lower() in SMALL_TALK


def small_talk_reply(message: str) -> str:
    m = message.strip().lower()

    if m in {"hi", "hello", "hey", "helllo"}:
        return "Hello! I’m your CashFlash assistant. Ask me about users, wallets, merchants, transactions, audit logs, cards, or bank accounts."
    if m in {"thanks", "thank you"}:
        return "You’re welcome."
    if m == "help":
        return "You can ask things like how many users are in total, show the latest 5 transactions, show the last 5 audit logs, or how many merchants are active."
    if m in {"who are you", "what can you do"}:
        return "I can answer CashFlash database questions using read-only queries and show results as short answers or tables."
    if m == "bye":
        return "Goodbye."
    return "Hello!"


def is_noise_prompt(message: str) -> bool:
    cleaned = message.strip()

    if not cleaned:
        return True

    tokens = re.findall(r"[a-zA-Z0-9]+", cleaned.lower())

    if not tokens:
        return True

    if len(tokens) == 1 and len(tokens[0]) == 1 and tokens[0] not in SMALL_TALK:
        return True

    return False


def looks_like_cashflash_question(message: str) -> bool:
    lowered = message.lower()
    tokens = re.findall(r"[a-zA-Z0-9]+", lowered)

    if any(term in lowered for term in DOMAIN_TERMS):
        return True

    if any(word in lowered for word in QUESTION_HINTS) and len(tokens) >= 3:
        return True

    return False


def invalid_prompt_reply() -> str:
    return "Please ask a clear CashFlash question."


def clean_sql(raw: str) -> str:
    sql = raw.strip()
    sql = re.sub(r"^```sql\s*", "", sql, flags=re.IGNORECASE)
    sql = re.sub(r"^```\s*", "", sql)
    sql = re.sub(r"\s*```$", "", sql)
    sql = sql.strip()

    if ";" in sql:
        sql = sql.split(";", 1)[0].strip()

    return sql


def is_safe_sql(sql: str) -> tuple[bool, str]:
    if not sql:
        return False, "Empty SQL generated."

    if FORBIDDEN_SQL.search(sql):
        return False, "Blocked non-read-only SQL."

    first_word = sql.split(None, 1)[0].upper() if sql.split() else ""
    if first_word not in {"SELECT", "WITH", "SHOW", "DESCRIBE", "EXPLAIN"}:
        return False, f"Only read-only SQL is allowed. Got: {first_word}"

    return True, ""


def maybe_add_limit(sql: str) -> str:
    upper_sql = sql.upper()

    if upper_sql.startswith(("SHOW", "DESCRIBE", "EXPLAIN")):
        return sql

    if re.search(r"\bLIMIT\s+\d+\b", upper_sql):
        return sql

    if any(func in upper_sql for func in ["COUNT(", "SUM(", "AVG(", "MIN(", "MAX("]):
        return sql

    return f"{sql} LIMIT {DB_QUERY_LIMIT}"


def normalize_token_set(value: str) -> set[str]:
    return set(re.findall(r"[a-z0-9]+", value.lower().replace("_", " ")))


def load_schema_map(engine) -> dict[str, list[dict[str, str]]]:
    schema_map: dict[str, list[dict[str, str]]] = {}

    with engine.connect() as conn:
        tables = conn.execute(text("SHOW TABLES")).fetchall()

        for row in tables:
            table_name = row[0]
            cols = conn.execute(text(f"DESCRIBE `{table_name}`")).fetchall()

            schema_map[table_name] = [
                {
                    "name": col[0],
                    "type": col[1],
                }
                for col in cols
            ]

    return schema_map


def pick_relevant_tables(
    question: str, schema_map: dict[str, list[dict[str, str]]]
) -> list[str]:
    q = question.lower()
    question_tokens = normalize_token_set(q)
    scored_tables = []

    for table_name, cols in schema_map.items():
        score = 0
        table_tokens = normalize_token_set(table_name)

        if table_name.lower() in q:
            score += 10

        score += len(question_tokens & table_tokens) * 4

        for alias in TABLE_ALIASES.get(table_name.lower(), []):
            if alias in q:
                score += 6

        column_tokens = set()
        for col in cols:
            column_tokens |= normalize_token_set(col["name"])

        score += len(question_tokens & column_tokens)

        if score > 0:
            scored_tables.append((table_name, score))

    scored_tables.sort(key=lambda item: item[1], reverse=True)

    selected = [name for name, _ in scored_tables[:4]]

    if not selected:
        selected = list(schema_map.keys())[:6]

    return selected


def build_schema_context(
    question: str, schema_map: dict[str, list[dict[str, str]]]
) -> str:
    selected_tables = pick_relevant_tables(question, schema_map)
    parts = []

    for table_name in selected_tables:
        cols = schema_map[table_name]
        col_lines = [f"- {col['name']}: {col['type']}" for col in cols]
        parts.append(f"Table: {table_name}\n" + "\n".join(col_lines))

    return "\n\n".join(parts)


def format_amount(value: Any) -> str:
    try:
        number = float(value)
        if number.is_integer():
            return f"₹{int(number):,}"
        return f"₹{number:,.2f}"
    except Exception:
        return str(value)


def serialize_value(value: Any):
    if value is None:
        return None
    if isinstance(value, Decimal):
        return float(value)
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return value


def humanize_name(name: str) -> str:
    return name.replace("_", " ").strip()


def format_value(column: str, value: Any) -> str:
    value = serialize_value(value)

    if value is None:
        return "not available"

    column_lower = column.lower()

    if isinstance(value, (int, float)):
        if any(key in column_lower for key in ["amount", "balance", "total", "price"]):
            return format_amount(value)
        if float(value).is_integer():
            return f"{int(value):,}"
        return f"{value:,.2f}"

    return str(value)


def build_single_value_reply(question: str, column: str, value: Any) -> str:
    q = question.lower()
    formatted = format_value(column, value)

    if "how many users" in q:
        return f"There are {formatted} users in total."
    if "how many merchants" in q:
        return f"There are {formatted} merchants in total."
    if "how many transactions" in q:
        return f"There are {formatted} transactions in total."
    if "wallet" in q and any(key in column.lower() for key in ["balance", "amount", "total"]):
        return f"The wallet figure is {formatted}."
    if any(key in q for key in ["how many", "count", "total number"]):
        return f"The total is {formatted}."
    return f"The {humanize_name(column)} is {formatted}."


def build_record_summary(columns: list[str], row: tuple) -> str:
    parts = []

    for col, value in zip(columns, row):
        if value is None:
            continue
        formatted = format_value(col, value)
        parts.append(f"{humanize_name(col)}: {formatted}")

    return ", ".join(parts[:4])


def build_table_intro(question: str, row_count: int) -> str:
    q = question.lower()

    if any(word in q for word in ["latest", "last", "recent"]):
        return f"Here are the latest {row_count} matching records."
    return f"I found {row_count} matching records."


def serialize_rows(columns: list[str], rows: list[tuple]) -> list[dict[str, Any]]:
    serialized_rows = []

    for row in rows[:AI_PREVIEW_ROWS]:
        serialized_row = {}
        for column, value in zip(columns, row):
            serialized_row[column] = serialize_value(value)
        serialized_rows.append(serialized_row)

    return serialized_rows


def build_chat_response(question: str, columns: list[str], rows: list[tuple]) -> ChatResponse:
    if not rows:
        return text_response("I couldn’t find any matching records for that.")

    if len(rows) == 1 and len(columns) == 1:
        return text_response(build_single_value_reply(question, columns[0], rows[0][0]))

    if len(rows) == 1:
        summary = build_record_summary(columns, rows[0])
        return text_response(f"I found one matching record. {summary}.")

    return ChatResponse(
        answer=build_table_intro(question, len(rows)),
        response_type="table",
        columns=columns,
        rows=serialize_rows(columns, rows),
    )


def compact_error_message(exc: Exception) -> str:
    return " ".join(str(exc).split())[:400]


def log_sql(question: str, sql: str, label: str = "SQL") -> None:
    print("\n" + "=" * 80)
    print("QUESTION:")
    print(question)
    print("-" * 80)
    print(label + ":")
    print(sql)
    print("=" * 80 + "\n")


def generate_sql(
    model: ChatOllama,
    schema_context: str,
    question: str,
    previous_error: str | None = None,
) -> tuple[str, dict]:
    error_section = ""
    if previous_error:
        error_section = f"""
Previous SQL failed with this database error:
{previous_error}

Fix the SQL using that error.
""".strip()

    prompt = f"""
You are writing ONE MySQL query for the CashFlash database.

Rules:
- Return only raw SQL.
- No markdown.
- No explanation.
- Read-only only.
- Use only SELECT, WITH, SHOW, DESCRIBE, or EXPLAIN.
- Never use INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, REPLACE, GRANT, REVOKE, MERGE, or CALL.
- If the question asks for rows, keep the result small with LIMIT {DB_QUERY_LIMIT}.
- If the question asks for a total count, aggregate or summary, do not force LIMIT.
- Prefer simple, valid MySQL syntax.
- Use only the schema provided below.

Relevant schema:
{schema_context}

{error_section}

Question:
{question}
""".strip()

    response = model.invoke(prompt)
    sql = clean_sql(response.content)
    metadata = getattr(response, "response_metadata", {}) or {}
    return sql, metadata


def validate_sql_or_raise(sql: str) -> str:
    clean = maybe_add_limit(clean_sql(sql))
    is_safe, _ = is_safe_sql(clean)

    if not is_safe:
        print("\nBlocked SQL:")
        print(clean)
        raise HTTPException(
            status_code=400,
            detail="I couldn’t safely answer that request with a read-only query.",
        )

    return clean


def execute_query(sql: str) -> tuple[list[str], list[tuple]]:
    with engine.connect() as conn:
        result = conn.execute(text(sql))
        rows = result.fetchall() if result.returns_rows else []
        columns = list(result.keys()) if result.returns_rows else []
    return columns, rows


def run_query_with_retry(question: str, schema_context: str) -> tuple[list[str], list[tuple], dict]:
    sql, metadata = generate_sql(sql_model, schema_context, question)
    sql = validate_sql_or_raise(sql)
    log_sql(question, sql)

    try:
        columns, rows = execute_query(sql)
        return columns, rows, metadata
    except Exception as exc:
        retry_reason = compact_error_message(exc)
        print("Retrying SQL after DB error:", retry_reason)

        retry_sql, retry_metadata = generate_sql(
            model=sql_model,
            schema_context=schema_context,
            question=question,
            previous_error=retry_reason,
        )
        retry_sql = validate_sql_or_raise(retry_sql)
        log_sql(question, retry_sql, label="RETRY SQL")

        columns, rows = execute_query(retry_sql)
        return columns, rows, retry_metadata


def strip_code_fence(value: str) -> str:
    text_value = (value or "").strip()
    text_value = re.sub(r"^```(?:json|text)?\s*", "", text_value, flags=re.IGNORECASE)
    text_value = re.sub(r"\s*```$", "", text_value)
    return text_value.strip()


def sanitize_recommendation_text(value: str, max_length: int) -> str:
    text_value = strip_code_fence(value)

    if not text_value:
        return ""

    text_value = unicodedata.normalize("NFKC", text_value)
    text_value = re.sub(r"[\u0000-\u001f\u007f-\u009f]", " ", text_value)
    text_value = text_value.encode("ascii", "ignore").decode("ascii")
    text_value = re.sub(r"\s+", " ", text_value).strip()
    text_value = re.sub(r"^\s*[-*0-9.)(:\s]+", "", text_value)
    text_value = re.sub(r"^(title|message)\s*:\s*", "", text_value, flags=re.IGNORECASE)
    text_value = text_value.strip(" \"'`-:;,.")
    return text_value[:max_length].strip()


def try_parse_recommendation_json(content: str) -> dict[str, Any] | None:
    cleaned = strip_code_fence(content)
    candidates = [cleaned]

    match = re.search(r"\{[\s\S]*\}", cleaned)
    if match:
        candidates.append(match.group(0))

    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
            if isinstance(parsed, dict):
                return parsed
        except Exception:
            continue

    return None


def normalize_recommendation_title(value: str) -> str:
    title = sanitize_recommendation_text(value, 80)

    if not title:
        return DEFAULT_RECOMMENDATION_TITLE

    if title[-1] in ".!?":
        title = title[:-1].strip()

    words = re.findall(r"[A-Za-z0-9]+", title)
    if len(words) > 5:
        filtered_words = [
            word for word in words if word.lower() not in RECOMMENDATION_TITLE_FILLER_WORDS
        ]
        words = filtered_words or words
        title = " ".join(words[:5])

    title = title.strip()

    if not title:
        return DEFAULT_RECOMMENDATION_TITLE

    return title


def normalize_recommendation_message(value: str) -> str:
    message = sanitize_recommendation_text(value, 220)

    if not message:
        return DEFAULT_RECOMMENDATION_MESSAGE

    sentence_parts = re.split(r"(?<=[.!?])\s+", message)
    if sentence_parts:
        message = sentence_parts[0].strip()

    message = re.sub(r"\s+", " ", message).strip()

    if message[-1] not in ".!?":
        message = f"{message}."

    return message


def normalize_recommendation_signature(value: str) -> set[str]:
    tokens = re.findall(r"[a-z0-9]+", value.lower())
    return {
        token
        for token in tokens
        if len(token) > 2 and token not in RECOMMENDATION_SIMILARITY_STOPWORDS
    }


def is_recommendation_repetitive(title: str, message: str) -> bool:
    current = normalize_recommendation_signature(f"{title} {message}")

    if len(current) < 3:
        return True

    for previous in RECOMMENDATION_HISTORY:
        overlap = len(current & previous)
        baseline = max(1, min(len(current), len(previous)))
        if overlap / baseline >= 0.6:
            return True

    return False


def is_recommendation_well_formed(title: str, message: str) -> bool:
    title_words = re.findall(r"[A-Za-z0-9]+", title)
    sentence_count = len(re.findall(r"[.!?]", message))
    lowercase_message = message.lower()

    if not (2 <= len(title_words) <= 5):
        return False
    if len(title) > 40:
        return False
    if len(message) < 45 or len(message) > 160:
        return False
    if sentence_count > 1:
        return False
    if any(mark in lowercase_message for mark in ["{", "}", "[", "]", "title:", "message:"]):
        return False

    generic_phrases = [
        "payment recommendation",
        "user-friendly"
    ]
    if any(phrase in lowercase_message for phrase in generic_phrases):
        return False

    return True


def parse_recommendation_content(content: str) -> RecommendationResponse:
    parsed_json = try_parse_recommendation_json(content)

    if parsed_json:
        title = normalize_recommendation_title(str(parsed_json.get("title", "")))
        message = normalize_recommendation_message(str(parsed_json.get("message", "")))
        return RecommendationResponse(title=title, message=message)

    cleaned = strip_code_fence(content)
    lines = [line.strip() for line in cleaned.splitlines() if line.strip()]
    normalized_lines = [sanitize_recommendation_text(line, 220) for line in lines if line.strip()]
    normalized_lines = [line for line in normalized_lines if line]

    if len(normalized_lines) >= 2:
        title = normalize_recommendation_title(normalized_lines[0])
        message = normalize_recommendation_message(normalized_lines[1])
        return RecommendationResponse(title=title, message=message)

    if len(normalized_lines) == 1:
        return RecommendationResponse(
            title=DEFAULT_RECOMMENDATION_TITLE,
            message=normalize_recommendation_message(normalized_lines[0]),
        )

    return build_fallback_recommendation()


def build_fallback_recommendation() -> RecommendationResponse:
    available = [
        item
        for item in RECOMMENDATION_FALLBACKS
        if not is_recommendation_repetitive(item["title"], item["message"])
    ]
    selected = random.choice(available or RECOMMENDATION_FALLBACKS)
    RECOMMENDATION_HISTORY.append(
        normalize_recommendation_signature(f"{selected['title']} {selected['message']}")
    )
    return RecommendationResponse(
        title=selected["title"],
        message=selected["message"],
    )


def generate_recommendation() -> RecommendationResponse:
    topics = random.sample(RECOMMENDATION_TOPICS, k=len(RECOMMENDATION_TOPICS))

    for topic in topics[:6]:
        prompt = f"""
You are writing one product tip for the CashFlash payments app.

Return valid JSON only in exactly this format:
{{"title":"...","message":"..."}}

Rules:
- Use plain ASCII characters only.
- Write like an in-app recommendation card, not a chatbot reply.
- Stay strictly inside the CashFlash product context.
- Title must be 2 to 5 words and under 40 characters.
- Message must be exactly 1 sentence and between 45 and 160 characters.
- Make it specific, practical, and action-oriented.
- Avoid overly generic lines, but do keep the advice natural and simple.
- Do not repeat the title wording inside the message.
- No markdown.
- No bullet points.
- No emojis.
- No extra keys.
- No extra text before or after the JSON.

Topic focus:
- Focus: {topic["focus"]}
- Goal: {topic["goal"]}
""".strip()

        response = recommendation_model.invoke(prompt)
        content = (response.content or "").strip()

        if not content:
            continue

        parsed = parse_recommendation_content(content)

        if not parsed.title or not parsed.message:
            continue

        if not is_recommendation_well_formed(parsed.title, parsed.message):
            print("Recommendation rejected by format check:", parsed)
            continue

        if is_recommendation_repetitive(parsed.title, parsed.message):
            print("Recommendation rejected as repetitive:", parsed)
            continue

        RECOMMENDATION_HISTORY.append(
            normalize_recommendation_signature(f"{parsed.title} {parsed.message}")
        )
        return parsed

    print("Recommendation generator fell back after all attempts.")
    return build_fallback_recommendation()


def strip_json_wrappers(value: str) -> str:
    cleaned = (value or "").strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def normalize_voice_identifier(value: Any) -> str | None:
    if value is None:
        return None

    normalized = str(value).strip()
    if not normalized or normalized.lower() in {"null", "none", "unknown"}:
        return None

    normalized = re.sub(r"\s+", " ", normalized)
    return normalized[:80]


def normalize_spoken_email_fragment(value: str) -> str:
    normalized = value.strip().lower()
    normalized = re.sub(r"\s+dot\s+", ".", normalized)
    normalized = re.sub(r"\s+underscore\s+", "_", normalized)
    normalized = re.sub(r"\s+hyphen\s+", "-", normalized)
    normalized = re.sub(r"\s+dash\s+", "-", normalized)
    normalized = re.sub(r"\s+plus\s+", "+", normalized)
    normalized = re.sub(r"\s+at\s+", "@", normalized)
    normalized = re.sub(r"\s+", "", normalized)
    return normalized


def extract_email_from_transcript(transcript: str) -> str | None:
    normalized = transcript.strip()
    if not normalized:
        return None

    explicit_email_patterns = [
        r"\bto\s+([A-Za-z0-9._%+\-\s]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,})\b",
        r"\bto\s+([A-Za-z0-9._%+\-\s]+?\s+at\s+[A-Za-z0-9.\-\s]+(?:\s+dot\s+[A-Za-z]{2,}|\.[A-Za-z]{2,}))\b",
    ]

    for pattern in explicit_email_patterns:
        match = re.search(pattern, normalized, re.IGNORECASE)
        if not match:
            continue

        candidate = normalize_spoken_email_fragment(match.group(1))
        if re.fullmatch(r"[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}", candidate):
            return candidate

    return None


def normalize_voice_amount(value: Any) -> int | None:
    if value is None or value == "":
        return None

    if isinstance(value, bool):
        return None

    if isinstance(value, (int, float)):
        amount = int(value)
        return amount if amount > 0 else None

    digits_only = re.sub(r"[^\d]", "", str(value))
    if not digits_only:
        return None

    amount = int(digits_only)
    return amount if amount > 0 else None


def extract_identifier_from_transcript(transcript: str) -> str | None:
    normalized = transcript.strip()
    if not normalized:
        return None

    email_candidate = extract_email_from_transcript(normalized)
    if email_candidate:
        return email_candidate

    patterns = [
        r"\bto\s+([A-Za-z][A-Za-z0-9@._+\-\s]{1,60}?)(?=\s+(?:via|using|from|with)\b|$)",
        r"\bsend\s+(?:\d+(?:\s+rupees?)?\s+)?to\s+([A-Za-z][A-Za-z0-9@._+\-\s]{1,60}?)(?=\s+(?:via|using|from|with)\b|$)",
    ]

    for pattern in patterns:
        match = re.search(pattern, normalized, re.IGNORECASE)
        if not match:
            continue

        candidate = normalize_voice_identifier(match.group(1))
        if candidate:
            return candidate

    return None


def extract_payment_method_from_transcript(transcript: str) -> (
    Literal["WALLET", "BANK", "CARD"] | None
):
    lowered = transcript.lower()

    if "wallet" in lowered:
        return "WALLET"
    if "bank" in lowered or "bank account" in lowered or re.search(
        r"\bfrom account\b|\bvia account\b", lowered
    ):
        return "BANK"
    if "card" in lowered:
        return "CARD"

    return None


def apply_voice_transcript_fallbacks(
    transcript: str, parsed: VoiceParserResult
) -> VoiceParserResult:
    identifier = parsed.identifier or extract_identifier_from_transcript(transcript)
    amount = parsed.amount or normalize_voice_amount(transcript)
    explicit_payment_method = extract_payment_method_from_transcript(transcript)
    payment_method = explicit_payment_method if explicit_payment_method else None

    return VoiceParserResult(
        identifier=identifier,
        amount=amount,
        paymentMethod=payment_method,
    )


def parse_voice_parser_result(content: str) -> VoiceParserResult:
    cleaned = strip_json_wrappers(content)

    candidates = [cleaned]
    match = re.search(r"\{[\s\S]*\}", cleaned)
    if match:
        candidates.append(match.group(0))

    for candidate in candidates:
        try:
            parsed = json.loads(candidate)
            if not isinstance(parsed, dict):
                continue

            normalized = {
                "identifier": normalize_voice_identifier(parsed.get("identifier")),
                "amount": normalize_voice_amount(parsed.get("amount")),
                "paymentMethod": parsed.get("paymentMethod"),
            }
            return VoiceParserResult.model_validate(normalized)
        except (json.JSONDecodeError, ValidationError):
            continue

    return VoiceParserResult()


def validate_audio_extension(filename: str | None) -> str:
    suffix = Path(filename or "voice-input.webm").suffix.lower()

    if suffix not in VOICE_ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail="Unsupported audio format. Please upload wav, mp3, m4a, mp4, webm, or ogg audio.",
        )

    return suffix


def ensure_voice_dependencies_available() -> None:
    if WhisperModel is None:
        raise HTTPException(
            status_code=503,
            detail="Voice service dependencies are not installed. Please install the AI server requirements.",
        )


voice_asr_model = None
voice_parser_model = ChatOllama(
    model=OLLAMA_VOICE_MODEL,
    temperature=0,
    keep_alive=OLLAMA_KEEP_ALIVE,
)


def get_voice_asr_model():
    global voice_asr_model

    ensure_voice_dependencies_available()

    if voice_asr_model is None:
        voice_asr_model = WhisperModel(
            VOICE_ASR_MODEL_SIZE,
            device=VOICE_ASR_DEVICE,
            compute_type=VOICE_ASR_COMPUTE_TYPE,
        )

    return voice_asr_model


def transcribe_audio_file(audio_path: str) -> str:
    model = get_voice_asr_model()
    attempts = [
        {
            "label": "english_vad",
            "kwargs": {
                "language": "en",
                "vad_filter": True,
            },
        },
        {
            "label": "english_no_vad",
            "kwargs": {
                "language": "en",
                "vad_filter": False,
            },
        },
    ]

    for attempt in attempts:
        try:
            segments, info = model.transcribe(audio_path, **attempt["kwargs"])
            transcript = " ".join(
                segment.text.strip() for segment in segments if segment.text
            ).strip()

            print(
                "Voice ASR attempt:",
                {
                    "mode": attempt["label"],
                    "language": getattr(info, "language", None),
                    "language_probability": getattr(
                        info, "language_probability", None
                    ),
                    "transcript": transcript,
                },
            )

            if transcript:
                return transcript
        except Exception as exc:
            print(f"Voice ASR attempt failed ({attempt['label']}):", exc)

    try:
        segments, info = model.transcribe(audio_path, vad_filter=False)
        transcript = " ".join(
            segment.text.strip() for segment in segments if segment.text
        ).strip()

        print(
            "Voice ASR attempt:",
            {
                "mode": "auto_no_vad",
                "language": getattr(info, "language", None),
                "language_probability": getattr(
                    info, "language_probability", None
                ),
                "transcript": transcript,
            },
        )

        if transcript:
            return transcript
    except Exception as exc:
        print("Voice ASR attempt failed (auto_no_vad):", exc)

    raise HTTPException(
        status_code=400,
        detail="Could not detect a clear voice command in the audio. Try speaking a little longer and closer to the mic.",
    )


def extract_send_money_payload(transcript: str) -> VoiceParserResult:
    prompt = f"""
Extract a CashFlash send-money intent from this transcript.

Return valid JSON only in exactly this shape:
{{"identifier":string|null,"amount":integer|null,"paymentMethod":"WALLET"|"BANK"|"CARD"|null}}

Rules:
- Use ASCII characters only.
- Do not guess missing values.
- If receiver is unclear, identifier must be null.
- If amount is unclear, amount must be null.
- If payment source is unclear, paymentMethod must be null.
- If the transcript contains an email like "virat at yahoo.com" or "virat at yahoo dot com", convert it to "virat@yahoo.com".
- Map "wallet" to WALLET.
- Map "bank", "bank account", or "account" to BANK.
- Map "card", "credit card", or "debit card" to CARD.
- Return JSON only with no markdown and no explanation.

Transcript:
{transcript}
""".strip()

    response = voice_parser_model.invoke(prompt)
    parsed = parse_voice_parser_result(response.content or "")
    return apply_voice_transcript_fallbacks(transcript, parsed)


db_url = build_db_url()
engine = create_engine(db_url, pool_pre_ping=True, pool_recycle=3600)
schema_map: dict[str, list[dict[str, str]]] = {}

sql_model = ChatOllama(
    model=OLLAMA_SQL_MODEL,
    temperature=0,
    keep_alive=OLLAMA_KEEP_ALIVE,
)

recommendation_model = ChatOllama(
    model=OLLAMA_RECOMMENDATION_MODEL,
    temperature=0.2,
    keep_alive=OLLAMA_KEEP_ALIVE,
)


def warm_up_models():
    try:
        sql_model.invoke("Reply with exactly: ready")
    except Exception as exc:
        print("SQL model warmup failed:", exc)

    try:
        recommendation_model.invoke("Reply with exactly: ready")
    except Exception as exc:
        print("Recommendation model warmup failed:", exc)

    try:
        voice_parser_model.invoke("Reply with exactly: ready")
    except Exception as exc:
        print("Voice parser model warmup failed:", exc)


def refresh_schema_map():
    global schema_map

    try:
        schema_map = load_schema_map(engine)
    except Exception as exc:
        schema_map = {}
        print("Schema load failed:", exc)


@asynccontextmanager
async def lifespan(app: FastAPI):
    refresh_schema_map()
    warm_up_models()
    yield


app = FastAPI(title="CashFlash AI Chat API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=AI_ALLOWED_ORIGINS,
    allow_origin_regex=r"^http://(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/ai/health")
def health():
    return {
        "status": "ok",
        "schema_loaded": bool(schema_map),
    }


@app.post("/api/ai/warmup")
def warmup():
    warm_up_models()
    return {"status": "ready"}


@app.get("/api/ai/recommendation", response_model=RecommendationResponse)
def recommendation():
    try:
        return generate_recommendation()
    except Exception as exc:
        print("Recommendation error:", exc)
        return build_fallback_recommendation()


@app.post("/api/ai/chat", response_model=ChatResponse)
def chat(payload: ChatRequest):
    question = payload.message.strip()

    if not question:
        raise HTTPException(status_code=400, detail="Message is required.")

    if is_small_talk(question):
        return text_response(small_talk_reply(question))

    if is_noise_prompt(question):
        return text_response(invalid_prompt_reply())

    if not looks_like_cashflash_question(question):
        return text_response(
            "I can help with CashFlash data questions about users, wallets, merchants, transactions, audit logs, cards, and bank accounts. Try asking something like “Show the latest 5 transactions”."
        )

    try:
        if not schema_map:
            refresh_schema_map()

        if not schema_map:
            raise HTTPException(
                status_code=503,
                detail="CashFlash database schema is not available right now.",
            )

        schema_context = build_schema_context(question, schema_map)
        columns, rows, metadata = run_query_with_retry(question, schema_context)
        answer = build_chat_response(question, columns, rows)

        print(
            "AI timings:",
            {
                "load_duration": metadata.get("load_duration"),
                "prompt_eval_duration": metadata.get("prompt_eval_duration"),
                "eval_duration": metadata.get("eval_duration"),
                "total_duration": metadata.get("total_duration"),
            },
        )

        return answer

    except HTTPException:
        raise
    except Exception as exc:
        print("AI chat error:", exc)
        raise HTTPException(
            status_code=500,
            detail="Something went wrong while generating the reply.",
        )


@app.post("/api/ai/voice/send-money/parse", response_model=VoiceSendMoneyResponse)
async def parse_send_money_voice(audio: UploadFile = File(...)):
    suffix = validate_audio_extension(audio.filename)

    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_path = temp_file.name
            temp_file.write(await audio.read())

        transcript = transcribe_audio_file(temp_path)
        payload = extract_send_money_payload(transcript)
        return VoiceSendMoneyResponse(
            transcript=transcript,
            payload=VoiceSendMoneyPayload(**payload.model_dump()),
        )

    except HTTPException:
        raise
    except Exception as exc:
        print("Voice send money parse error:", exc)
        raise HTTPException(
            status_code=500,
            detail="Something went wrong while processing the voice command.",
        )
    finally:
        await audio.close()
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


if __name__ == "__main__":
    uvicorn.run("ai_chat_api:app", host=AI_HOST, port=AI_PORT, reload=False)
