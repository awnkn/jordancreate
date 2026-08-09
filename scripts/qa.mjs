// End-to-end QA suite. Run against a freshly seeded dev server:
//   npm run db:seed && npm run dev   (in one terminal)
//   npm run qa                       (in another)
// Requires playwright once: npm i --no-save playwright
import { existsSync } from "node:fs";
import { chromium } from "playwright";

// The Claude sandbox ships a system Chromium; elsewhere Playwright's own is used.
const executablePath = existsSync("/opt/pw-browsers/chromium")
  ? "/opt/pw-browsers/chromium"
  : undefined;

const B = "http://localhost:3000";
const browser = await chromium.launch({ executablePath });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();

const fails = [];
const consoleErrors = [];
let passCount = 0;
page.on("dialog", (d) => d.accept());
page.on("pageerror", (e) => consoleErrors.push(e.message));
page.on("console", (m) => {
  const t = m.text();
  if (m.type() === "error" && !t.includes("favicon") && !t.includes("the server responded with a status of 404"))
    consoleErrors.push(t);
});

const ok = (label, cond, extra = "") => {
  if (cond) { passCount++; console.log(`PASS  ${label}`); }
  else { fails.push(label); console.log(`FAIL  ${label} ${extra}`); }
};

const go = async (path) => {
  const res = await page.goto(`${B}${path}`, { waitUntil: "networkidle", timeout: 30000 });
  return res?.status() ?? 0;
};

const has = async (text) => (await page.content()).includes(text);

const poll = async (fn, timeout = 8000) => {
  const start = Date.now();
  for (;;) {
    if (await fn()) return true;
    if (Date.now() - start > timeout) return false;
    await page.waitForTimeout(250);
  }
};
// Rendered text, case-insensitively: raw HTML retains stale flight payloads
// after soft navigations, and CSS text-transform uppercases labels.
const visible = (text) =>
  page.evaluate(
    (t) => document.body.innerText.toLowerCase().includes(t),
    text.toLowerCase(),
  );
const gone = (text) => poll(async () => !(await visible(text)));
const appeared = (text) => poll(() => visible(text));

const submit = () => page.locator('button.btn-primary[type="submit"]').first().click();

/* ================================================================= A0. auth */
console.log("\n--- A0. Authentication ---");
ok("login page is public", (await go("/login")) === 200);

await page.goto(`${B}/sponsors`, { waitUntil: "networkidle" });
ok("unauthenticated visit bounces to login", page.url().includes("/login"));

// first-run setup: the seed leaves nobody with credentials
ok("first-run setup offered", await has("Create the first login"));
const jordanValue = await page
  .locator('select[name="personId"] option', { hasText: "Jordan Avery" })
  .getAttribute("value");
await page.selectOption('select[name="personId"]', jordanValue);
await page.fill('input[name="username"]', "jordan");
await page.fill('input[name="password"]', "qa-password-123");
await submit();
await page.waitForURL(/\/people\?welcome=1$/);
ok("first login created and signed in", await appeared("Jordan Avery"));

// sign out, wrong password, right password
await page.getByRole("button", { name: "Sign out" }).click();
await page.waitForURL(/\/login$/);
ok("sign out returns to login", true);
await page.fill('input[name="username"]', "jordan");
await page.fill('input[name="password"]', "wrong-password");
await submit();
ok("wrong password rejected", await appeared("don't match"));
await page.fill('input[name="username"]', "jordan");
await page.fill('input[name="password"]', "qa-password-123");
await submit();
await page.waitForURL(`${B}/`);
ok("correct password signs in", await appeared("The Frame, today"));

// a separate unauthenticated browser still can't get in
{
  const ctx2 = await browser.newContext();
  const p2 = await ctx2.newPage();
  await p2.goto(`${B}/operations`, { waitUntil: "networkidle" });
  ok("second browser without cookie is walled out", p2.url().includes("/login"));
  await ctx2.close();
}

/* ================================================================ A. routes */
console.log("\n--- A. Route sweep ---");
for (const p of ["/", "/operations", "/operations/new", "/operations/tasks", "/operations/tasks/new",
  "/content", "/content/new", "/experience", "/experience/new", "/experience/speakers",
  "/experience/speakers/new", "/experience/topics", "/experience/topics/new",
  "/public-relations", "/public-relations/general-guests", "/public-relations/executives",
  "/public-relations/government", "/public-relations/creators", "/public-relations/artists",
  "/public-relations/designers", "/public-relations/guests/new",
  "/sponsors", "/sponsors/new", "/tickets", "/tickets/new", "/people", "/people/new", "/access",
  "/vendors", "/vendors/suppliers", "/vendors/space-partners", "/vendors/new",
  "/people/responsibilities"]) {
  ok(`GET ${p}`, (await go(p)) === 200);
}
ok("bad guest category 404s", (await go("/public-relations/nonsense")) === 404);
ok("bad record id 404s", (await go("/sponsors/cmnotarealid0000000000000")) === 404);

/* =========================================================== B. operations */
console.log("\n--- B. Operations CRUD ---");
await go("/operations/new");
await page.fill('input[name="name"]', "QA Project");
await page.fill('input[name="client"]', "QA Client");
await page.fill('input[name="budget"]', "12345");
await submit();
await page.waitForURL(/\/operations\/c[a-z0-9]{20,}$/);
const projectUrl = page.url();
ok("project created", await has("QA Project"));
ok("project budget formatted", await has("$12,345"));

await go(`${projectUrl.replace(B, "")}?edit`);
await page.selectOption('select[name="status"]', "Blocked");
await submit();
await page.waitForURL(projectUrl);
ok("project edit persists", await appeared("Blocked"));

await go("/operations/tasks/new");
await page.fill('input[name="title"]', "QA Task One");
await page.selectOption('select[name="projectId"]', { label: "QA Project" });
await page.selectOption('select[name="priority"]', "Urgent");
await submit();
await page.waitForURL(/\/operations\/tasks\/c[a-z0-9]{20,}$/);
const taskUrl = page.url();
ok("task created with project link", await has("QA Project"));

await go(projectUrl.replace(B, ""));
ok("task listed on project page", await has("QA Task One"));

await go("/operations/tasks?status=Todo");
const rowsBefore = await page.locator("tbody tr").count();
await page.locator('tr', { hasText: "QA Task One" }).locator('button:has-text("Mark done")').click();
await page.waitForTimeout(1500);
await go("/operations/tasks?status=Todo");
ok("mark-done removes from Todo filter", (await page.locator("tbody tr").count()) === rowsBefore - 1);
await go("/operations/tasks?status=Done");
ok("task shows under Done filter", await has("QA Task One"));

await go(taskUrl.replace(B, ""));
await page.click('button:has-text("Delete")');
await page.waitForURL(/\/operations\/tasks(\?.*)?$/);
ok("task deleted", await gone("QA Task One"));

/* ============================================================== C. content */
console.log("\n--- C. Content CRUD + topic link ---");
await go("/content/new");
await page.fill('input[name="title"]', "QA Article");
await page.selectOption('select[name="format"]', "Report");
await page.selectOption('select[name="projectId"]', { label: "QA Project" });
await page.locator('label', { hasText: "Brand Systems" }).locator('input').check();
await page.locator('label', { hasText: /^LinkedIn$/ }).locator('input').check();
await page.locator('label', { hasText: /^Website$/ }).locator('input').check();
await submit();
await page.waitForURL(/\/content\/c[a-z0-9]{20,}$/);
const contentUrl = page.url();
ok("content created", await has("QA Article"));
ok("content topic linked", await has("Brand Systems"));
ok("content format saved", await has("Report"));
ok("content platforms chip: LinkedIn", await has("LinkedIn"));
ok("content platforms chip: Website", await has("Website"));

await go("/experience/topics");
await page.locator('a', { hasText: /^Brand Systems$/ }).first().click();
await page.waitForURL(/\/experience\/topics\/c[a-z0-9]{20,}$/);
ok("topic page lists the new content", await appeared("QA Article"));

/* =========================================================== D. experience */
console.log("\n--- D. Event + booking ---");
await go("/experience/new");
await page.fill('input[name="name"]', "QA Gathering");
await page.selectOption('select[name="format"]', "Dinner");
await page.fill('input[name="capacity"]', "20");
await page.locator('label', { hasText: "Creative Burnout" }).locator('input').check();
await submit();
await page.waitForURL(/\/experience\/c[a-z0-9]{20,}$/);
const eventUrl = page.url();
ok("event created", await has("QA Gathering"));
ok("event topic attached", await has("Creative Burnout"));
ok("booking select groups topic matches", await has("Cover this event\'s topics"));

// the topic page should now list this experience, and support speaker matching
await go("/experience/topics");
await page.locator('a', { hasText: /^Creative Burnout$/ }).first().click();
await page.waitForURL(/\/experience\/topics\/c[a-z0-9]{20,}$/);
ok("topic page lists the experience", await appeared("QA Gathering"));
const matchedBefore = await page.locator('ul li', { hasText: "Unmatch" }).count();
await page.selectOption('select[name="speakerId"]', { index: 0 });
await page.getByRole("button", { name: "Match", exact: true }).click();
ok("speaker matched from topic page",
  await poll(async () => (await page.locator('button:has-text("Unmatch")').count()) === matchedBefore + 1));
await page.locator('button:has-text("Unmatch")').first().click();
ok("speaker unmatched from topic page",
  await poll(async () => (await page.locator('button:has-text("Unmatch")').count()) === matchedBefore));

await go(eventUrl.replace(B, ""));

// book a speaker onto it
await page.selectOption('select[name="speakerId"]', { index: 0 });
await page.fill('input[name="slotTitle"]', "QA keynote slot");
await page.fill('input[name="fee"]', "1000");
await page.locator('button:has-text("Add to bill")').click();
ok("booking appears in line-up", await appeared("QA keynote slot"));
ok("booking fee shows", await has("$1,000"));

await page.locator('tr', { hasText: "QA keynote slot" }).locator('button:has-text("Remove")').click();
ok("booking removed", await gone("QA keynote slot"));

/* ======================================================= E. public relations */
console.log("\n--- E. Guest pipeline + category ---");
await go("/public-relations/guests/new");
await page.fill('input[name="firstName"]', "Quinn");
await page.fill('input[name="lastName"]', "Qatester");
await page.selectOption('select[name="category"]', "Executives");
await page.fill('input[name="outlet"]', "QA Outlet");
await submit();
await page.waitForURL(/\/public-relations\/guests\/c[a-z0-9]{20,}$/);
const guestUrl = page.url();
ok("guest created with full name", await has("Quinn Qatester"));

await go("/public-relations/executives");
ok("guest appears in its category roster", await has("Quinn Qatester"));
await go("/public-relations/creators");
ok("guest absent from other rosters", !(await has("Quinn Qatester")));

await go(guestUrl.replace(B, ""));
await page.locator('button:has-text("Booked")').click();
ok("stage stepper advances guest",
  await poll(async () => (await page.locator('button[disabled]:has-text("Booked")').count()) === 1));

// interaction log on the guest
await page.selectOption('select[name="kind"]', "Pitch");
await page.fill('textarea[name="summary"]', "QA guest pitch logged.");
await page.locator('button:has-text("Log it")').click();
ok("guest interaction logged", await appeared("QA guest pitch logged."));

await page.click('button:has-text("Delete")');
await page.waitForURL(/\/public-relations(\?.*)?$/);
ok("guest deleted", await gone("Quinn Qatester"));

/* ============================================================= F. sponsors */
console.log("\n--- F. Sponsor CRM ---");
await go("/sponsors/new");
await page.fill('input[name="company"]', "QA Industries");
await page.fill('input[name="contactFirstName"]', "Casey");
await page.fill('input[name="contactLastName"]', "Contact");
await page.fill('input[name="value"]', "50000");
await page.selectOption('select[name="eventId"]', { label: "QA Gathering" });
await submit();
await page.waitForURL(/\/sponsors\/c[a-z0-9]{20,}$/);
const sponsorUrl = page.url();
ok("sponsor created", await has("QA Industries"));
ok("sponsor contact full name", await has("Casey Contact"));

await page.locator('button:has-text("Negotiation")').click();
ok("sponsor stage advanced",
  await poll(async () => (await page.locator('button[disabled]:has-text("Negotiation")').count()) === 1));

await page.selectOption('select[name="kind"]', "Call");
await page.fill('textarea[name="summary"]', "QA sponsor call logged.");
await page.locator('button:has-text("Log it")').click();
ok("sponsor interaction logged", await appeared("QA sponsor call logged."));

await go("/sponsors?status=Negotiation");
ok("pipeline filter finds sponsor", await has("QA Industries"));

await go(sponsorUrl.replace(B, ""));
await page.click('button:has-text("Delete")');
await page.waitForURL(/\/sponsors(\?.*)?$/);
ok("sponsor deleted", await gone("QA Industries"));

/* ============================================================== G. tickets */
console.log("\n--- G. Ticket orders ---");
await go("/tickets/new");
await page.fill('input[name="buyerFirstName"]', "Tess");
await page.fill('input[name="buyerLastName"]', "Ticket");
await page.selectOption('select[name="eventId"]', { label: "QA Gathering" });
await page.fill('input[name="quantity"]', "3");
await page.fill('input[name="amount"]', "900");
await submit();
await page.waitForURL(/\/tickets\/c[a-z0-9]{20,}$/);
const orderUrl = page.url();
ok("order created", await has("Tess Ticket"));
ok("order lede shows qty/type/event", await has("3 × General — QA Gathering"));

await page.locator('button:has-text("Check in")').click();
ok("check-in from detail", await appeared("Checked In"));

await go("/tickets?status=Checked In".replace(" ", "%20"));
ok("checked-in filter finds order", await has("Tess Ticket"));

await go(orderUrl.replace(B, ""));
await page.click('button:has-text("Delete")');
await page.waitForURL(/\/tickets(\?.*)?$/);
ok("order deleted", await gone("Tess Ticket"));

/* ======================================================== H. people/access */
console.log("\n--- H. People + access ---");
await go("/people/new");
await page.fill('input[name="firstName"]', "Pat");
await page.fill('input[name="lastName"]', "Person");
await page.selectOption('select[name="status"]', "Freelance");
await submit();
await page.waitForURL(/\/people\/c[a-z0-9]{20,}$/);
const personUrl = page.url();
ok("person created", await has("Pat Person"));

// assign a responsibility from the person page
await page.fill('input[name="area"]', "QA Ownership Area");
await page.selectOption('select[name="level"]', "Owner");
await page.getByRole("button", { name: "Add", exact: true }).click();
ok("responsibility added from person page", await appeared("QA Ownership Area"));

// it shows on the register, grouped under the person
await go("/people/responsibilities");
ok("register lists the responsibility", await has("QA Ownership Area"));
ok("register groups under the person", await has("Pat Person"));

// assign a second one from the register itself
await page.fill('input[name="area"]', "QA Second Area");
await page.selectOption('select[name="personId"]', { label: "Pat Person" });
await page.selectOption('select[name="level"]', "Backup");
await page.getByRole("button", { name: "Assign", exact: true }).click();
ok("responsibility assigned from register", await appeared("QA Second Area"));

await go(personUrl.replace(B, ""));
// grant access from the person page
await page.fill('input[name="system"]', "QA System");
await page.locator('button:has-text("Grant")').click();
ok("grant added from person page", await appeared("QA System"));

await page.locator('tr', { hasText: "QA System" }).locator('button:has-text("Revoke")').click();
await page.waitForTimeout(1200);
ok("grant revoked", (await page.locator('tr', { hasText: "QA System" }).locator('button:has-text("Restore")').count()) === 1);

await go("/access");
ok("access register lists the grant", await has("QA System"));
ok("access register links the person", await has("Pat Person"));

// grant from the access page itself
await page.fill('input[name="system"]', "QA Second System");
await page.selectOption('select[name="personId"]', { label: "Pat Person" });
await page.locator('button:has-text("Grant")').click();
ok("grant added from access page", await appeared("QA Second System"));

await go(personUrl.replace(B, ""));
await page.click('button:has-text("Delete")');
await page.waitForURL(/\/people(\?.*)?$/);
ok("person deleted", await gone("Pat Person"));
await go("/access");
ok("person's grants cascaded away", !(await has("QA System")));
await go("/people/responsibilities");
ok("person's responsibilities cascaded away", !(await has("QA Ownership Area")));

/* ========================================================= I. project cleanup */
console.log("\n--- I. Cleanup + cascade checks ---");
await go(eventUrl.replace(B, ""));
await page.click('button:has-text("Delete")');
await page.waitForURL(/\/experience(\?.*)?$/);
ok("event deleted", await gone("QA Gathering"));

await go(contentUrl.replace(B, ""));
await page.click('button:has-text("Delete")');
await page.waitForURL(/\/content(\?.*)?$/);
ok("content deleted", await gone("QA Article"));

await go(projectUrl.replace(B, ""));
await page.click('button:has-text("Delete")');
await page.waitForURL(/\/operations(\?.*)?$/);
ok("project deleted", await gone("QA Project"));

/* ============================================================= I2. vendors */
console.log("\n--- I2. Vendors ---");
await go("/vendors/new");
await page.fill('input[name="company"]', "QA Rentals Co");
await page.selectOption('select[name="kind"]', "Space Partner");
await page.selectOption('select[name="status"]', "Active");
await page.fill('input[name="spaceName"]', "QA Loft");
await page.fill('input[name="monthlyRent"]', "1500");
await submit();
await page.waitForURL(/\/vendors\/c[a-z0-9]{20,}$/);
const vendorUrl = page.url();
ok("vendor created", await has("QA Rentals Co"));
ok("partner rent annualised", await has("$18,000"));

await go("/vendors/space-partners");
ok("partner appears in Space Partners", await has("QA Rentals Co"));
ok("rent roll includes new partner", await has("$6,050"));
await go("/vendors/suppliers");
ok("partner absent from Suppliers", !(await has("QA Rentals Co")));

await go(vendorUrl.replace(B, ""));
await page.selectOption('select[name="kind"]', "Call");
await page.fill('textarea[name="summary"]', "QA vendor call logged.");
await page.locator('button:has-text("Log it")').click();
ok("vendor interaction logged", await appeared("QA vendor call logged."));

await page.click('button:has-text("Delete")');
await page.waitForURL(/\/vendors(\?.*)?$/);
ok("vendor deleted", await gone("QA Rentals Co"));

/* ============================================================== J. guards */
console.log("\n--- J. Guards + search ---");
const seedNoToken = await page.request.get(`${B}/api/seed`);
ok("seed disabled without SETUP_TOKEN", seedNoToken.status() === 404);

await go("/experience/speakers?q=Okonkwo");
ok("speaker search by last name", await has("Maya Okonkwo"));
await go("/experience/speakers?q=Maya");
ok("speaker search by first name", await has("Maya Okonkwo"));
await go("/sponsors?q=Braun");
ok("sponsor search by contact last name", await has("Mono Type Foundry"));
await go("/tickets?q=Wren");
ok("buyer search by first name", await has("Wren Taylor"));
await go("/people?q=Rivera");
ok("people search by last name", await has("Sam Rivera"));
await go("/access?q=Kowalski");
ok("access search by holder", await has("Instagram"));
await go("/experience/speakers?status=Confirmed&q=zzznomatch");
ok("filtered empty state renders", await has("Nothing matches that filter"));

/* ================================================================== report */
await browser.close();
console.log(`\n=== ${passCount} passed, ${fails.length} failed ===`);
if (consoleErrors.length) {
  console.log("--- console errors ---");
  for (const e of [...new Set(consoleErrors)].slice(0, 10)) console.log(" ", e.slice(0, 200));
} else {
  console.log("no console errors");
}
if (fails.length) { console.log("FAILED:", fails.join(" | ")); process.exit(1); }
