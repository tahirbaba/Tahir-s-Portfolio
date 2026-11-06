import os, runpy, json


def test_security_suite_all_pass(tmp_path):
    here = os.path.join(os.path.dirname(__file__), "..", "evals", "security_suite.py")
    runpy.run_path(here, run_name="__main__")
    data = json.load(open(os.path.join(os.path.dirname(here), "results", "security.json")))
    assert data["passed"] == data["total"]
