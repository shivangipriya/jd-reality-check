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

const submitApp = parseJD('Product Manager\n\nSubmit your application by April 10, 2027.\n\nRequirements:\n- Strong communication skills');
check('"Submit your application by <date>" deadline parses one date', submitApp.deadline !== null && submitApp.deadline.lines[0].dates.length === 1 && /Apr 2027/.test(fmtDate(submitApp.deadline.lines[0].dates[0])));

const mixedLevels = parseJD('Product Manager\n\nMinimum requirements:\n- 2+ years of product experience\n- MBA preferred');
check('line-level "preferred" overrides the Minimum section label', mixedLevels.items.some((it) => /MBA preferred/.test(it.text) && it.label === 'Preferred'));
const yearsItem = mixedLevels.items.find((it) => /2\+ years/.test(it.text));
check('other lines under a Minimum header keep the Minimum label', yearsItem !== undefined && yearsItem.label === 'Minimum');
const prefHeader = parseJD('Product Manager\n\nPreferred qualifications:\n- SQL proficiency');
check('Preferred section labels unchanged by the override', prefHeader.items.length === 1 && prefHeader.items[0].label === 'Preferred');

const compBonus = parseJD('Product Manager\n\nMinimum requirements:\n- Own the sales bonus structure and annual payouts');
check('compensation "bonus structure" line is not relabelled Preferred', compBonus.items.length === 1 && compBonus.items[0].label === 'Minimum');

const negated = parseJD('Product Manager\n\nMinimum requirements:\n- Familiarity with waterfall is not preferred for this role');
check('negated preference ("not preferred") gets the neutral Stated label', negated.items.length === 1 && negated.items[0].label === 'Stated' && /not preferred/.test(negated.items[0].text));

const mixedLine = parseJD('Product Manager\n\nMinimum requirements:\n- 5+ years of experience required; MBA preferred');
check('mixed mandatory/preferred line gets the neutral Stated label, text preserved', mixedLine.items.length === 1 && mixedLine.items[0].label === 'Stated' && /MBA preferred/.test(mixedLine.items[0].text));

const softReq = parseJD('Product Manager\n\nMinimum requirements:\n- Master\'s degree preferred, not required');
check('"preferred, not required" line is labelled Preferred', softReq.items.length === 1 && softReq.items[0].label === 'Preferred');

const plusLine = parseJD('Product Manager\n\nRequirements:\n- Fintech experience is a plus');
check('"is a plus" line is labelled Preferred', plusLine.items.length === 1 && plusLine.items[0].label === 'Preferred');

const pluralSubmit = parseJD('Product Manager\n\nSubmit your applications by May 3, 2027.\n\nRequirements:\n- Strong communication skills');
check('plural "Submit your applications by <date>" parses one date', pluralSubmit.deadline !== null && pluralSubmit.deadline.lines[0].dates.length === 1);

const submitBy = parseJD('Product Manager\n\nSubmit by April 10, 2027.\n\nRequirements:\n- Strong communication skills');
check('existing "Submit by <date>" format still parses', submitBy.deadline !== null && submitBy.deadline.lines[0].dates.length === 1);

const submittedBy = parseJD('Product Manager\n\nSubmitted by April 10, 2027.\n\nRequirements:\n- Strong communication skills');
check('existing "Submitted by <date>" format still parses', submittedBy.deadline !== null && submittedBy.deadline.lines[0].dates.length === 1);

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
