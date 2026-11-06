"""Compass retrieval: BM25 over sections, with access control and freshness applied BEFORE ranking,
so restricted or outdated text can never reach the model. Plus citation checking for answers."""
from __future__ import annotations

import math
import re
from collections import Counter

from .docs import ROLES, chunks

STOP = set("halcyon was is am were been has have had get got me a an the and or of to in on for with is are be by at as it this that from up per can may must i we you my our your do does how what when where which who whom about into than then there their them they not no if".split())
SYN = {"vacation": "leave", "holiday": "leave", "pto": "leave", "holidays": "leave", "laptop": "device", "phone": "device", "stolen": "lost", "hotel": "hotels",
       "reimburse": "reimbursed", "pay": "salary", "salaries": "salary", "compensation": "salary", "discount": "discount", "outage": "sev1", "down": "sev1", "mfa": "multi-factor", "2fa": "multi-factor"}
MIN_SCORE = 1.2


def tokens(text: str) -> list[str]:
    out = []
    for w in re.findall(r"[a-z0-9][a-z0-9\-]*", text.lower()):
        w = SYN.get(w, w)
        if w in STOP:
            continue
        for suf in ("ing", "ed", "es", "s"):
            if len(w) > 4 and w.endswith(suf):
                w = w[: -len(suf)]
                break
        out.append(w)
    return out


class Index:
    def __init__(self):
        self.chunks = chunks()
        self.docs = [tokens(f"{c['title']} {c['heading']} {c['heading']} {c['text']}") for c in self.chunks]
        self.N = len(self.docs)
        self.avg = sum(len(d) for d in self.docs) / self.N
        df = Counter(t for d in self.docs for t in set(d))
        self.idf = {t: math.log(1 + (self.N - n + 0.5) / (n + 0.5)) for t, n in df.items()}

    def search(self, query: str, role: str, k: int = 4) -> dict:
        if role not in ROLES:
            raise ValueError("unknown role")
        q = tokens(query)
        hidden_access, hidden_stale, scored = 0, 0, []
        for c, d in zip(self.chunks, self.docs):
            tf = Counter(d)
            s = sum(self.idf.get(t, 0) * tf[t] * 2.2 / (tf[t] + 1.2 * (0.25 + 0.75 * len(d) / self.avg)) for t in q if t in tf)
            if s <= 0:
                continue
            if role not in c["access"]:
                hidden_access += 1
                continue
            if c["superseded_by"]:
                hidden_stale += 1
                continue
            scored.append((s, c))
        scored.sort(key=lambda x: -x[0])
        hits = [{**{k2: v for k2, v in c.items() if k2 != "access"}, "score": round(s, 2)} for s, c in scored[:k] if s >= MIN_SCORE]
        return {"hits": hits, "hidden_by_access": hidden_access, "hidden_as_outdated": hidden_stale, "answerable": bool(hits)}


INDEX = Index()
CITE = re.compile(r"\[([A-Z0-9\-]+#\d+)\]")


def check_citations(answer: str, retrieved_ids: list[str]) -> dict:
    cited = CITE.findall(answer or "")
    bad = [c for c in cited if c not in retrieved_ids]
    return {"cited": cited, "invalid": bad, "ok": bool(cited) and not bad}


def clean_answer(answer: str, retrieved_ids: list[str]) -> str:
    """Remove citations that don't point at retrieved, permitted chunks."""
    return CITE.sub(lambda m: m.group(0) if m.group(1) in retrieved_ids else "", answer or "").replace("  ", " ").strip()
