# Bibliography manual actions and suggested fixes

This file lists bibliography entries that need manual verification or corrective edits (generated after running scripts/check_bib.sh). For each entry: recommended checks and suggested replacements.

1) 10.12738/estp.2013.2.1624 — key: vural2013
- Status: DOI resolved -> HTTP 404 via doi.org in automated check.
- Action: Search CrossRef/Google Scholar for "Vural 2013 question-embedded video"; verify journal 'Educational Sciences: Theory & Practice' indexing. If DOI incorrect, replace with correct DOI or replace citation with an alternative peer-reviewed article on question-embedded video (e.g., Merkt 2011 or Zhang 2006).

2) 10.1073/pnas.1319030111 — key: freeman2014
- Status: DOI -> HTTP 403 (publisher blocking automated requests).
- Action: Keep citation (PNAS is authoritative). For readers, add a stable URL (https://www.pnas.org/) or library proxy link if needed. No replacement required; note paywall in report.

3) 10.1145/77481.77486 — key: molich1990
- Status: DOI -> HTTP 403 (ACM older DOI redirect blocked).
- Action: Verify via ACM Digital Library; add URL to ACM page or DOI link via CrossRef. If institutional access unavailable, keep entry but note access restrictions.

4) 10.1207/* and other Taylor & Francis DOIs (sweller, chandler, paas, etc.)
- Status: many returned HTTP 403 due to publisher blocking automated requests.
- Action: Keep entries; add publisher URLs or DOI links for manual access. If a DOI is malformed, lookup via CrossRef and correct.

5) 10.1145/1721654.1721672 (Armbrust 2010)
- Status: DOI -> HTTP 403.
- Action: Verify via ACM or publisher page; add stable URL (Communications of the ACM article page).

6) 10.1017/CBO9780511811678 (Mayer 2009)
- Status: DOI -> HTTP 429 (rate limited by resolver).
- Action: No immediate change; re-run check later or provide publisher/book URL (Cambridge University Press page) in the BibTeX entry.

7) thuvienphapluat.vn (Vietnamese government decision)
- Status: HTTP 403 (site blocks automated requests).
- Action: Verify manually in browser and, if required, replace with an official government PDF or a stable archived link.

General recommended manual steps
- Use CrossRef (https://search.crossref.org) or Google Scholar to confirm DOI and metadata for each problematic entry.
- For paywalled sources, add publisher landing-page URLs to the BibTeX (field `howpublished` or `url`) so human readers can see the source even if the DOI redirects are blocked for scripts.
- Remove or replace any citations that cannot be verified as real academic sources. If a reference appears AI-generated or unverifiable, remove it and replace with a confirmed alternative.
- After manual edits, re-run `bash scripts/check_bib.sh` to regenerate `thesis 3/data/bib_check_report.md` and confirm status.

If you want, I can:
- Attempt automated CrossRef lookup for the problematic DOIs and propose corrected BibTeX entries (may be rate-limited).
- Open each BibTeX entry and suggest an exact replacement URL or corrected DOI where available.
