'use strict';
// Tests the JD parser against the README's Testing section: standard postings,
// adversarial junior/ownership wording, buzzwords, deadline edge cases,
// revenue rejected as salary, and the prose-only fallback.
const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const prefix = script.slice(0, script.indexOf('// ===PARSE-END==='));
const { cleanLine, parseJD, fmtDate } = new Function(prefix + '; return { cleanLine, parseJD, fmtDate };')();

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log('ok   ' + name); }
  else { fail++; console.log('FAIL ' + name); }
}

const standard = [
  'Senior Product Manager', '',
  'About the role', 'We are hiring for our growth team.', '',
  'Minimum requirements:',
  '- 4+ years of product management experience',
  '- Experience with analytics tools', '',
  'Preferred qualifications:',
  '- SQL proficiency',
  '- Fintech background',
].join('\n');
const std = parseJD(standard);
check('standard posting extracts four requirements', std.items.length === 4);
check('minimum section is labelled Minimum', std.items.slice(0, 2).every((it) => it.label === 'Minimum'));
check('preferred section is labelled Preferred', std.items.slice(2).every((it) => it.label === 'Preferred'));
check('standard posting is not the fallback', std.usedFallback === false);

const junior = parseJD('Associate Product Manager\n\nThis entry level role suits fresh graduates.\n\nRequirements:\n- 5+ years of experience required\n- Strong communication skills');
check('junior wording next to multi-year ask raises a question', junior.questions.some((q) => /how much experience is actually expected/.test(q)));

const notJunior = parseJD('Product Manager\n\nThis is not an entry-level role.\n\nRequirements:\n- 5+ years of experience required\n- Strong communication skills');
check('"not an entry-level role" is not treated as a contradiction', !notJunior.questions.some((q) => /how much experience is actually expected/.test(q)));

const ownership = parseJD('Product Manager\n\nYou will be owning the product strategy end to end.\nYou will work under guidance of senior leaders.\n\nRequirements:\n- Strong communication skills\n- Analytical mindset');
check('ownership next to guidance raises a question', ownership.questions.some((q) => /how much independent ownership/.test(q)));

const buzz = parseJD('Product Manager\n\nRequirements:\n- Rockstar attitude and fast-paced energy\n- Analytical mindset');
check('buzzword requirement is flagged as broad wording', buzz.wording.some((w) => /rockstar/i.test(w)));

const salaried = parseJD('Product Manager\n\nSalary: ₹8,00,000 - ₹12,00,000 per annum\n\nRequirements:\n- Strong communication skills');
check('salary line is quoted as stated', salaried.salary !== null && salaried.salary.indexOf('₹8,00,000') !== -1);

const revenue = parseJD('Product Manager\n\nWe raised $50M in Series B funding last year.\n\nRequirements:\n- Strong communication skills');
check('funding line is not read as salary', revenue.salary === null);

const oneDeadline = parseJD('Product Manager\n\nApply by March 5, 2027.\n\nRequirements:\n- Strong communication skills');
check('single deadline line parses one date', oneDeadline.deadline !== null && oneDeadline.deadline.lines.length === 1 && oneDeadline.deadline.lines[0].dates.length === 1);
check('single deadline is not ambiguous', oneDeadline.deadline.multiple === false);

const twoDeadlines = parseJD('Product Manager\n\nApply by March 5, 2027.\nApplication deadline: April 10, 2027.\n\nRequirements:\n- Strong communication skills');
check('two deadline lines get an ambiguity warning', twoDeadlines.deadline.multiple === true);

// KNOWN LIMITATION (documents current behavior, not a bug fix): the deadline
// detector matches "Submit by April 10" but not "Submit your application by
// April 10" - words between "submit" and "by" are not yet accepted. This test
// pins the current miss so it is visible; flip it when the parser improves.
const submitMiss = parseJD('Product Manager\n\nSubmit your application by April 10, 2027.\n\nRequirements:\n- Strong communication skills');
check('known limitation: "Submit your application by <date>" is not yet detected', submitMiss.deadline === null);

const noYear = parseJD('Product Manager\n\nApply by March 5.\n\nRequirements:\n- Strong communication skills');
check('date without a year is flagged year-unspecified', noYear.deadline.lines[0].yearUnspecified === true && noYear.deadline.lines[0].dates.length === 0);

const proseOnly = parseJD('We are a small team building tools. You will work on interesting problems with great people.');
check('prose-only posting uses the fallback', proseOnly.usedFallback === true && proseOnly.items.length === 0);

const looseBullets = parseJD('- Two years of experience\n- Strong SQL skills');
check('bullets without headers are labelled Stated via fallback', looseBullets.items.length === 2 && looseBullets.items.every((it) => it.label === 'Stated') && looseBullets.usedFallback === true);

const gap = parseJD('Product Manager\n\nWe encourage you to apply even if you don\'t meet every requirement.\n\nRequirements:\n- Strong communication skills');
check('posting gap-policy line is surfaced', gap.gapLine !== null && /encourage you to apply/.test(gap.gapLine));

check('fmtDate renders a day-month-year string', /\d{1,2} \w{3} \d{4}/.test(fmtDate(new Date('2027-03-05T00:00:00Z'))));
check('cleanLine strips markdown bold', cleanLine('**Strong** skills') === 'Strong skills');

console.log('\n' + (pass + fail) + ' cases, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
