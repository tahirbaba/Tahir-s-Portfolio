import re

EMAIL = re.compile(r"([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})")
PHONE = re.compile(r"\+\d[\d\s-]{7,}\d|\b0\d{9,10}\b")


def redact(v):
    if isinstance(v, str):
        return PHONE.sub("[phone]", EMAIL.sub(r"\1***@\2", v))
    if isinstance(v, list):
        return [redact(x) for x in v]
    if isinstance(v, dict):
        return {k: redact(x) for k, x in v.items()}
    return v
