"""Runs pytest and writes evals/results/rules.json for the dashboard (no model calls)."""
import json, os, subprocess, sys, time
import xml.etree.ElementTree as ET

here = os.path.dirname(__file__); root = os.path.join(here, "..")
xml = os.path.join(here, "results", "_junit.xml"); os.makedirs(os.path.dirname(xml), exist_ok=True)
subprocess.run([sys.executable, "-m", "pytest", "-q", f"--junitxml={xml}"], cwd=root, check=False)
tests = []
for tc in ET.parse(xml).getroot().iter("testcase"):
    failed = any(ch.tag in ("failure", "error") for ch in tc)
    tests.append({"name": tc.get("name").removeprefix("test_").replace("_", " "), "file": tc.get("classname").split(".")[-1], "pass": not failed})
os.remove(xml)
out = {"runAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "total": len(tests), "passed": sum(t["pass"] for t in tests), "tests": tests}
json.dump(out, open(os.path.join(here, "results", "rules.json"), "w"), indent=2)
print(f"{out['passed']}/{out['total']} tests passed")
