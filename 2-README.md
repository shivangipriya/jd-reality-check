# JD Reality Check

Paste a job description. Get back what the posting actually states, the questions worth asking about it, and a worksheet for your own evidence. No score, no verdict on whether you should apply.

## What it does

- **Stated requirements, as stated.** Extracts the requirement lines from the posting's own sections. Labels like Minimum or Preferred come only from the posting's own section words, never guessed. Every list is editable: remove what does not belong, add what it missed.
- **Facts, quoted.** Salary and deadline lines are quoted verbatim from the posting. Salary detection explicitly rejects revenue, funding and valuation lines. Deadlines are shown with their parsed dates; multiple possible deadline lines get an ambiguity warning, a date without a year is flagged as year-unspecified, and the tool never claims a posting is open or closed.
- **Questions worth asking, not verdicts.** Spots mismatches worth clarifying, for example junior-level wording next to a multi-year experience ask, or big ownership language next to "under guidance". These are interview questions, not conclusions.
- **Broad wording flags.** Buzzword-heavy requirement lines ("rockstar", "fast-paced", "wear many hats") are flagged so you can ask what they mean in practice.
- **The posting's own gap policy.** If the posting says "apply even if you don't meet every requirement", that line is surfaced.
- **Your evidence worksheet.** Mark each requirement Can point to this / Partial / Gap, add your own line of evidence, and copy a clean record. The record never totals your marks and never says whether to apply.

## Privacy

Everything runs in the page on your device. Nothing you paste is sent anywhere, saved, or kept after you leave.

## What this tool does not do

- Finding requirements is pattern-based and will misread some postings. That is why every list is editable.
- Flags are questions to ask the employer, never verdicts about one.
- It makes no claims about how any applicant tracking system screens resumes.
- It never marks a requirement as met, never totals your marks, and never says whether you should apply.

## Testing

The parser is checked against standard product postings plus adversarial cases: junior-level wording next to multi-year asks, ownership language next to guidance language, buzzword-heavy requirements, deadlines without a year, multiple conflicting deadline lines, revenue and funding lines that must not read as salary, postings with no clear section headers, and prose-only postings with no bullets. The page makes no external requests; everything runs on your device.

## Status and roadmap

v1. Ideas under consideration: saving a session, sharing an analysis, more posting formats.

## Credits

Maintained by Shivangi Priya. This project was built with AI assistance.
