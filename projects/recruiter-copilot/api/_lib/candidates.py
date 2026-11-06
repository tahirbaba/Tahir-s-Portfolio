"""Synthetic role, candidates, application-form claims and public-profile snapshots for Verity.
Every person here is fictional."""

ROLE = {
    "title": "Senior Data Engineer", "company": "Meridian Health",
    "rubric": [
        {"id": "python", "label": "Production Python", "weight": 20, "must": True},
        {"id": "spark_dbt", "label": "Spark or dbt pipelines", "weight": 20, "must": True},
        {"id": "warehouse", "label": "Cloud warehouse (BigQuery, Snowflake, Redshift)", "weight": 15, "must": False},
        {"id": "data_quality", "label": "Data quality and testing", "weight": 10, "must": False},
        {"id": "leadership", "label": "Technical leadership or mentoring", "weight": 10, "must": False},
        {"id": "healthcare", "label": "Healthcare or regulated data", "weight": 5, "must": False},
    ],
    "years_weight": 20, "min_years": 5,
}

NOW = "2026-11"


def _cv(name, contact, body):
    return f"{name}\n{contact}\n\n{body}"


CANDIDATES = [
    {"id": "amina", "title": "Strong and consistent", "name": "Amina Yusuf", "gender": "female", "nationality": "Nigerian",
     "cv": _cv("Amina Yusuf", "amina.yusuf@example.com · +44 7700 900456 · London · Female, 34, married", """EXPERIENCE
Senior Data Engineer, Lumen Care (2022-03 to present)
- Built Spark and dbt pipelines processing 40M patient events a day on Snowflake.
- Introduced Great Expectations data quality tests across 120 models.
- Mentor three engineers and lead the weekly design review.
Data Engineer, Parcelly (2019-01 to 2022-02)
- Wrote production Python services for shipment data on BigQuery.

EDUCATION
BSc Computer Science, University of Leeds, 2018

CERTIFICATIONS
Snowflake SnowPro Core, ID SPC-4821-7733"""),
     "form": {"claimed_years": 7, "degree_year": 2018, "current_title": "Senior Data Engineer", "current_company": "Lumen Care"},
     "public": {"roles": [{"company": "Lumen Care", "title": "Senior Data Engineer"}, {"company": "Parcelly", "title": "Data Engineer"}]},
     "profile": {"roles": [{"title": "Senior Data Engineer", "company": "Lumen Care", "start": "2022-03", "end": "present", "full_time": True}, {"title": "Data Engineer", "company": "Parcelly", "start": "2019-01", "end": "2022-02", "full_time": True}],
                 "education": [{"degree": "BSc Computer Science", "institution": "University of Leeds", "year": 2018}], "certifications": [{"name": "Snowflake SnowPro Core", "id": "SPC-4821-7733"}],
                 "evidence": [{"criterion": "python", "quote": "Wrote production Python services"}, {"criterion": "spark_dbt", "quote": "Built Spark and dbt pipelines"}, {"criterion": "warehouse", "quote": "on Snowflake"},
                              {"criterion": "data_quality", "quote": "Great Expectations data quality tests"}, {"criterion": "leadership", "quote": "Mentor three engineers"}, {"criterion": "healthcare", "quote": "40M patient events a day"}]}},
    {"id": "rahul", "title": "Claims more years than the dates show", "name": "Rahul Verma", "gender": "male", "nationality": "Indian",
     "cv": _cv("Rahul Verma", "rahul.v@example.com · Dubai", """EXPERIENCE
Data Engineer, Desert Analytics (2022-06 to present)
- Production Python ETL jobs and Spark Structured Streaming on Redshift.
Junior Developer, Byteworks (2021-01 to 2022-05)
- Python scripts for reporting.

EDUCATION
BTech Information Technology, Pune University, 2020"""),
     "form": {"claimed_years": 8, "degree_year": 2020, "current_title": "Data Engineer", "current_company": "Desert Analytics"},
     "public": {"roles": [{"company": "Desert Analytics", "title": "Data Engineer"}, {"company": "Byteworks", "title": "Junior Developer"}]},
     "profile": {"roles": [{"title": "Data Engineer", "company": "Desert Analytics", "start": "2022-06", "end": "present", "full_time": True}, {"title": "Junior Developer", "company": "Byteworks", "start": "2021-01", "end": "2022-05", "full_time": True}],
                 "education": [{"degree": "BTech Information Technology", "institution": "Pune University", "year": 2020}], "certifications": [],
                 "evidence": [{"criterion": "python", "quote": "Production Python ETL jobs"}, {"criterion": "spark_dbt", "quote": "Spark Structured Streaming"}, {"criterion": "warehouse", "quote": "on Redshift"}]}},
    {"id": "omar", "title": "Title on CV doesn't match public profile", "name": "Omar Haddad", "gender": "male", "nationality": "Jordanian",
     "cv": _cv("Omar Haddad", "omar.h@example.com · Amman", """EXPERIENCE
Lead Data Engineer, Petra Pay (2020-02 to present)
- Led a team of six building dbt models on BigQuery with production Python orchestration.
- Owned data quality SLAs and tests for regulatory reporting.
Data Analyst, Zarqa Telecom (2017-07 to 2020-01)

EDUCATION
BSc Software Engineering, University of Jordan, 2017"""),
     "form": {"claimed_years": 9, "degree_year": 2017, "current_title": "Lead Data Engineer", "current_company": "Petra Pay"},
     "public": {"roles": [{"company": "Petra Pay", "title": "Data Engineer"}, {"company": "Zarqa Telecom", "title": "Data Analyst"}]},
     "profile": {"roles": [{"title": "Lead Data Engineer", "company": "Petra Pay", "start": "2020-02", "end": "present", "full_time": True}, {"title": "Data Analyst", "company": "Zarqa Telecom", "start": "2017-07", "end": "2020-01", "full_time": True}],
                 "education": [{"degree": "BSc Software Engineering", "institution": "University of Jordan", "year": 2017}], "certifications": [],
                 "evidence": [{"criterion": "python", "quote": "production Python orchestration"}, {"criterion": "spark_dbt", "quote": "building dbt models"}, {"criterion": "warehouse", "quote": "on BigQuery"},
                              {"criterion": "data_quality", "quote": "Owned data quality SLAs and tests"}, {"criterion": "leadership", "quote": "Led a team of six"}]}},
    {"id": "li", "title": "Two full-time jobs at the same time", "name": "Li Wei", "gender": "female", "nationality": "Chinese",
     "cv": _cv("Li Wei", "li.wei@example.com · Singapore", """EXPERIENCE
Senior Data Engineer, Harbour Bank (2021-04 to present)
- Spark pipelines and production Python on Snowflake.
Senior Data Engineer, Kopi Logistics (2021-09 to 2024-06)
- dbt modelling and data testing.
Data Engineer, Merlion Retail (2017-05 to 2021-03)

EDUCATION
MSc Data Science, National University of Singapore, 2017"""),
     "form": {"claimed_years": 9, "degree_year": 2017, "current_title": "Senior Data Engineer", "current_company": "Harbour Bank"},
     "public": {"roles": [{"company": "Harbour Bank", "title": "Senior Data Engineer"}, {"company": "Merlion Retail", "title": "Data Engineer"}]},
     "profile": {"roles": [{"title": "Senior Data Engineer", "company": "Harbour Bank", "start": "2021-04", "end": "present", "full_time": True}, {"title": "Senior Data Engineer", "company": "Kopi Logistics", "start": "2021-09", "end": "2024-06", "full_time": True},
                           {"title": "Data Engineer", "company": "Merlion Retail", "start": "2017-05", "end": "2021-03", "full_time": True}],
                 "education": [{"degree": "MSc Data Science", "institution": "National University of Singapore", "year": 2017}], "certifications": [],
                 "evidence": [{"criterion": "python", "quote": "production Python on Snowflake"}, {"criterion": "spark_dbt", "quote": "Spark pipelines"}, {"criterion": "warehouse", "quote": "on Snowflake"}, {"criterion": "data_quality", "quote": "data testing"}]}},
    {"id": "sara", "title": "Career break, strong skills", "name": "Sara Khalid", "gender": "female", "nationality": "Pakistani",
     "cv": _cv("Sara Khalid", "sara.k@example.com · Lahore", """EXPERIENCE
Data Engineer, Indus Health (2023-09 to present)
- Spark and dbt pipelines for hospital claims data on BigQuery, written in production Python.
- Added dbt tests and anomaly alerts for data quality.
Career break, caring for family (2021-06 to 2023-08)
Data Engineer, Ravi Fintech (2016-03 to 2021-05)
- Mentored two graduate engineers.

EDUCATION
BS Computer Science, LUMS, 2015"""),
     "form": {"claimed_years": 8, "degree_year": 2015, "current_title": "Data Engineer", "current_company": "Indus Health"},
     "public": {"roles": [{"company": "Indus Health", "title": "Data Engineer"}, {"company": "Ravi Fintech", "title": "Data Engineer"}]},
     "profile": {"roles": [{"title": "Data Engineer", "company": "Indus Health", "start": "2023-09", "end": "present", "full_time": True}, {"title": "Data Engineer", "company": "Ravi Fintech", "start": "2016-03", "end": "2021-05", "full_time": True}],
                 "education": [{"degree": "BS Computer Science", "institution": "LUMS", "year": 2015}], "certifications": [],
                 "evidence": [{"criterion": "python", "quote": "written in production Python"}, {"criterion": "spark_dbt", "quote": "Spark and dbt pipelines"}, {"criterion": "warehouse", "quote": "on BigQuery"},
                              {"criterion": "data_quality", "quote": "Added dbt tests and anomaly alerts"}, {"criterion": "leadership", "quote": "Mentored two graduate engineers"}, {"criterion": "healthcare", "quote": "hospital claims data"}]}},
    {"id": "tom", "title": "Early career, missing must-haves", "name": "Tom Fischer", "gender": "male", "nationality": "German",
     "cv": _cv("Tom Fischer", "tom.f@example.com · Berlin", """EXPERIENCE
Analytics Engineer, Spree Shop (2024-02 to present)
- SQL dashboards in Looker and some Python notebooks.

EDUCATION
BSc Economics, FU Berlin, 2023"""),
     "form": {"claimed_years": 2, "degree_year": 2023, "current_title": "Analytics Engineer", "current_company": "Spree Shop"},
     "public": {"roles": [{"company": "Spree Shop", "title": "Analytics Engineer"}]},
     "profile": {"roles": [{"title": "Analytics Engineer", "company": "Spree Shop", "start": "2024-02", "end": "present", "full_time": True}],
                 "education": [{"degree": "BSc Economics", "institution": "FU Berlin", "year": 2023}], "certifications": [],
                 "evidence": [{"criterion": "python", "quote": "some Python notebooks"}]}},
    {"id": "nadia", "title": "Certificate and degree don't check out", "name": "Nadia Rahman", "gender": "female", "nationality": "Bangladeshi",
     "cv": _cv("Nadia Rahman", "nadia.r@example.com · Dhaka", """EXPERIENCE
Senior Data Engineer, Padma Telecom (2019-01 to present)
- Production Python and Spark pipelines on Redshift, with data quality checks.

EDUCATION
MSc Computer Science, BUET, 2016

CERTIFICATIONS
Snowflake SnowPro Core, ID 12345"""),
     "form": {"claimed_years": 8, "degree_year": 2014, "current_title": "Senior Data Engineer", "current_company": "Padma Telecom"},
     "public": {"roles": [{"company": "Padma Telecom", "title": "Senior Data Engineer"}]},
     "profile": {"roles": [{"title": "Senior Data Engineer", "company": "Padma Telecom", "start": "2019-01", "end": "present", "full_time": True}],
                 "education": [{"degree": "MSc Computer Science", "institution": "BUET", "year": 2016}], "certifications": [{"name": "Snowflake SnowPro Core", "id": "12345"}],
                 "evidence": [{"criterion": "python", "quote": "Production Python and Spark pipelines"}, {"criterion": "spark_dbt", "quote": "Spark pipelines"}, {"criterion": "warehouse", "quote": "on Redshift"}, {"criterion": "data_quality", "quote": "data quality checks"}]}},
]

# Fairness twin: Amina's CV, same content, different name/gender/nationality signals.
TWIN = {**CANDIDATES[0], "id": "amina_twin", "title": "Fairness twin of the first candidate", "name": "Daniel Okafor", "gender": "male", "nationality": "British",
        "cv": CANDIDATES[0]["cv"].replace("Amina Yusuf", "Daniel Okafor").replace("amina.yusuf@example.com", "d.okafor@example.com").replace("Female, 34, married", "Male, 41, single")}

CERT_FORMATS = {"Snowflake SnowPro Core": r"^SPC-\d{4}-\d{4}$", "AWS Certified Data Engineer": r"^AWS-DEA-[A-Z0-9]{8}$", "Google Professional Data Engineer": r"^GPDE-\d{6}$"}
