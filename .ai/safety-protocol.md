# Safety, Privacy & Provenance Protocol

This document outlines the STRICT rules you must follow when modifying the `wiki` directory. 
As an AI managing a health dossier, hallucination and privacy breaches are catastrophic.

## 1. Privacy First (Anonymization)
- You are operating on a local-first basis. 
- When reading from `/raw/`, you MUST automatically redact PII (Name, Address, SSN, Contact Info) in your working memory before synthesizing it into the `/wiki/`.

## 2. The Rule of Provenance
Every single medical claim, data point, or diagnosis you write into the `wiki` MUST be directly traceable to a raw file.
- When writing a bullet point or table entry in the `wiki`, you MUST append a citation block: e.g., `(Source: [[raw/lab-2024.pdf]])`.
- If you are summarizing an existing wiki page, cite that page: e.g., `(Source: [[wiki/conditions/diabetes.md]])`.

## 3. No Interpolation
- You are strictly forbidden from guessing, interpolating, or assuming medical data.
- If a user asks "What is my blood pressure?" and it is not in the raw records, you must output: `[UNKNOWN: No blood pressure data found in raw records.]`

## 4. Web Research Constraints
- You may use web search to look up standard medical guidelines, drug interactions, or clinical trials. This research must be saved to `/wiki/research_cache/`.
- You may NOT use web search to diagnose the patient based on symptoms.
- Web research added to the wiki must be tagged: `(Source: Web Research - [URL])`.

## 5. Immutable Raw Layer
- You may READ from the `raw/` directory. You are FORBIDDEN from modifying or deleting files in it.
