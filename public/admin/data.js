/* mise admin — sample data (placeholder; safe to replace with live data later) */
(function () {
  "use strict";

  // Plans are placeholders until pricing is finalised — names/prices editable in the Subscriptions screen.
  var PLANS = {
    core:  { id: "core",  name: "mise Core",       price: 49,  blurb: "Allergens, menus & QR for a single site." },
    plus:  { id: "plus",  name: "HospoPilot Plus",       price: 79,  blurb: "Adds recipe costing, GP% and staff training." },
    multi: { id: "multi", name: "mise Multi-site", price: 129, blurb: "Everything in Plus across up to 5 venues." }
  };

  function d(s) { return s; } // dates as ISO strings

  var CUSTOMERS = [
    { id: "c01", name: "The Harbour Kitchen", contact: "Ana Whitfield", email: "ana@harbourkitchen.co.uk", city: "Whitby",      plan: "plus",  status: "active",   since: d("2025-11-04"), lastActive: d("2026-06-03"), seats: 9,  sites: 1, dishes: 64 },
    { id: "c02", name: "Saffron & Salt",       contact: "Dev Patel",       email: "dev@saffronsalt.com",      city: "Leicester",   plan: "multi", status: "active",   since: d("2025-10-18"), lastActive: d("2026-06-04"), seats: 22, sites: 3, dishes: 140 },
    { id: "c03", name: "Birch & Bramble",      contact: "Holly Reed",      email: "holly@birchbramble.co.uk", city: "Bristol",     plan: "plus",  status: "active",   since: d("2026-01-09"), lastActive: d("2026-06-02"), seats: 7,  sites: 1, dishes: 48 },
    { id: "c04", name: "The Copper Pot",       contact: "Marcus Lang",     email: "hello@copperpot.uk",       city: "York",        plan: "core",  status: "trial",    since: d("2026-05-22"), lastActive: d("2026-06-03"), seats: 4,  sites: 1, dishes: 19 },
    { id: "c05", name: "Olive & Thyme",        contact: "Sofia Greco",     email: "sofia@olivethyme.co.uk",   city: "Bath",        plan: "plus",  status: "past_due", since: d("2025-12-01"), lastActive: d("2026-05-28"), seats: 11, sites: 1, dishes: 72 },
    { id: "c06", name: "Tinder Box BBQ",       contact: "Reece Donnelly",  email: "reece@tinderbox.co.uk",    city: "Glasgow",     plan: "core",  status: "active",   since: d("2026-02-14"), lastActive: d("2026-06-01"), seats: 6,  sites: 1, dishes: 31 },
    { id: "c07", name: "Masala House",         contact: "Priya Anand",     email: "priya@masalahouse.co.uk",  city: "Birmingham",  plan: "multi", status: "active",   since: d("2025-09-30"), lastActive: d("2026-06-04"), seats: 18, sites: 2, dishes: 118 },
    { id: "c08", name: "The Wonky Carrot",     contact: "Tom Friel",       email: "tom@wonkycarrot.co.uk",    city: "Brighton",    plan: "core",  status: "active",   since: d("2026-03-02"), lastActive: d("2026-05-31"), seats: 5,  sites: 1, dishes: 27 },
    { id: "c09", name: "Nonna's Table",        contact: "Lucia Romano",    email: "lucia@nonnas.co.uk",       city: "Manchester",  plan: "plus",  status: "active",   since: d("2025-11-21"), lastActive: d("2026-06-03"), seats: 10, sites: 1, dishes: 58 },
    { id: "c10", name: "Drift Coffee Co.",     contact: "Jamie Okafor",    email: "jamie@driftcoffee.co",     city: "Newquay",     plan: "core",  status: "trial",    since: d("2026-05-29"), lastActive: d("2026-06-02"), seats: 3,  sites: 1, dishes: 14 },
    { id: "c11", name: "The Greenhouse",       contact: "Erin Mills",      email: "erin@greenhouse-ldn.com",  city: "London",      plan: "multi", status: "active",   since: d("2025-08-12"), lastActive: d("2026-06-04"), seats: 26, sites: 4, dishes: 161 },
    { id: "c12", name: "Pier 7 Seafood",       contact: "Gareth Pryce",    email: "gareth@pier7.co.uk",       city: "Cardiff",     plan: "plus",  status: "paused",   since: d("2025-12-15"), lastActive: d("2026-04-20"), seats: 8,  sites: 1, dishes: 41 },
    { id: "c13", name: "Bao & Bun",            contact: "Mei Chen",        email: "mei@baoandbun.co.uk",      city: "Liverpool",   plan: "core",  status: "active",   since: d("2026-01-27"), lastActive: d("2026-06-01"), seats: 6,  sites: 1, dishes: 23 },
    { id: "c14", name: "The Stag Inn",         contact: "Rory Buchanan",   email: "rory@staginn.co.uk",       city: "Inverness",   plan: "plus",  status: "active",   since: d("2025-10-05"), lastActive: d("2026-06-02"), seats: 12, sites: 1, dishes: 67 },
    { id: "c15", name: "Forage & Co.",         contact: "Nadia Hussain",   email: "nadia@forage.co.uk",       city: "Sheffield",   plan: "core",  status: "past_due", since: d("2026-02-09"), lastActive: d("2026-05-25"), seats: 5,  sites: 1, dishes: 29 },
    { id: "c16", name: "The Salt Yard",        contact: "Ben Castle",      email: "ben@saltyard.co.uk",       city: "Newcastle",   plan: "plus",  status: "active",   since: d("2025-11-30"), lastActive: d("2026-06-03"), seats: 9,  sites: 1, dishes: 53 },
    { id: "c17", name: "Lemongrass",           contact: "Anh Tran",        email: "anh@lemongrass.co.uk",     city: "Nottingham",  plan: "core",  status: "active",   since: d("2026-03-18"), lastActive: d("2026-05-30"), seats: 7,  sites: 1, dishes: 36 },
    { id: "c18", name: "Hearth & Hops",        contact: "Will Adeyemi",    email: "will@hearthhops.co.uk",    city: "Leeds",       plan: "multi", status: "trial",    since: d("2026-05-19"), lastActive: d("2026-06-03"), seats: 15, sites: 2, dishes: 44 },
    { id: "c19", name: "The Little Loaf",      contact: "Grace O'Neill",   email: "grace@littleloaf.co.uk",   city: "Belfast",     plan: "core",  status: "cancelled",since: d("2025-09-14"), lastActive: d("2026-03-11"), seats: 4,  sites: 1, dishes: 18 },
    { id: "c20", name: "Smoke & Barrel",       contact: "Liam Foster",     email: "liam@smokebarrel.co.uk",   city: "Edinburgh",   plan: "plus",  status: "active",   since: d("2025-12-22"), lastActive: d("2026-06-01"), seats: 11, sites: 1, dishes: 61 },
    { id: "c21", name: "Cinnamon Lane",        contact: "Zara Iqbal",      email: "zara@cinnamonlane.co.uk",  city: "Bradford",    plan: "core",  status: "active",   since: d("2026-04-06"), lastActive: d("2026-05-29"), seats: 6,  sites: 1, dishes: 33 },
    { id: "c22", name: "The Oyster Shed",      contact: "Fin Mackay",      email: "fin@oystershed.co.uk",     city: "Oban",        plan: "plus",  status: "active",   since: d("2025-10-29"), lastActive: d("2026-06-02"), seats: 8,  sites: 1, dishes: 39 },
    { id: "c23", name: "Verde Vegan",          contact: "Maya Lindqvist",  email: "maya@verde.co.uk",         city: "Cambridge",   plan: "core",  status: "trial",    since: d("2026-05-31"), lastActive: d("2026-06-04"), seats: 4,  sites: 1, dishes: 21 },
    { id: "c24", name: "The Iron Skillet",     contact: "Owen Pritchard",  email: "owen@ironskillet.co.uk",   city: "Swansea",     plan: "plus",  status: "active",   since: d("2025-11-12"), lastActive: d("2026-06-03"), seats: 10, sites: 1, dishes: 56 }
  ];

  // Recent invoices (newest first). status: paid | failed | refunded | pending
  var INVOICES = [
    { id: "INV-2061", cust: "c02", amount: 129, date: d("2026-06-01"), status: "paid" },
    { id: "INV-2060", cust: "c11", amount: 129, date: d("2026-06-01"), status: "paid" },
    { id: "INV-2059", cust: "c05", amount: 79,  date: d("2026-06-01"), status: "failed" },
    { id: "INV-2058", cust: "c07", amount: 129, date: d("2026-06-01"), status: "paid" },
    { id: "INV-2057", cust: "c15", amount: 49,  date: d("2026-06-01"), status: "failed" },
    { id: "INV-2056", cust: "c01", amount: 79,  date: d("2026-06-01"), status: "paid" },
    { id: "INV-2055", cust: "c09", amount: 79,  date: d("2026-05-31"), status: "paid" },
    { id: "INV-2054", cust: "c14", amount: 79,  date: d("2026-05-31"), status: "paid" },
    { id: "INV-2053", cust: "c20", amount: 79,  date: d("2026-05-30"), status: "paid" },
    { id: "INV-2052", cust: "c16", amount: 79,  date: d("2026-05-30"), status: "paid" },
    { id: "INV-2051", cust: "c22", amount: 79,  date: d("2026-05-29"), status: "paid" },
    { id: "INV-2050", cust: "c08", amount: 49,  date: d("2026-05-28"), status: "paid" },
    { id: "INV-2049", cust: "c13", amount: 49,  date: d("2026-05-27"), status: "paid" },
    { id: "INV-2048", cust: "c17", amount: 49,  date: d("2026-05-26"), status: "paid" },
    { id: "INV-2047", cust: "c06", amount: 49,  date: d("2026-05-25"), status: "paid" },
    { id: "INV-2046", cust: "c21", amount: 49,  date: d("2026-05-24"), status: "paid" },
    { id: "INV-2045", cust: "c12", amount: 79,  date: d("2026-05-20"), status: "refunded" },
    { id: "INV-2044", cust: "c24", amount: 79,  date: d("2026-05-18"), status: "paid" },
    { id: "INV-2043", cust: "c19", amount: 49,  date: d("2026-03-11"), status: "refunded" },
    { id: "INV-2042", cust: "c03", amount: 79,  date: d("2026-05-09"), status: "paid" }
  ];

  // Waitlist / early access. status: pending | invited | joined
  var WAITLIST = [
    { id: "w01", name: "Imogen Carr",     restaurant: "The Velvet Fig",     email: "imogen@velvetfig.co.uk",   city: "Exeter",      date: d("2026-06-03"), status: "pending" },
    { id: "w02", name: "Sanjay Mehta",    restaurant: "Chai & Chaat",       email: "sanjay@chaichaat.co.uk",   city: "Hounslow",    date: d("2026-06-03"), status: "pending" },
    { id: "w03", name: "Eleanor Voss",    restaurant: "The Plough",         email: "ellie@theplough.co.uk",    city: "Ludlow",      date: d("2026-06-02"), status: "pending" },
    { id: "w04", name: "Kofi Mensah",     restaurant: "Accra Nights",       email: "kofi@accranights.co.uk",   city: "London",      date: d("2026-06-02"), status: "invited" },
    { id: "w05", name: "Bryn Davies",     restaurant: "Mynydd Kitchen",     email: "bryn@mynydd.cymru",        city: "Aberystwyth", date: d("2026-06-01"), status: "pending" },
    { id: "w06", name: "Tara Sull",       restaurant: "The Anchorage",      email: "tara@anchorage.co.uk",     city: "Plymouth",    date: d("2026-06-01"), status: "invited" },
    { id: "w07", name: "Marco Bianchi",   restaurant: "Trattoria Sette",    email: "marco@sette.co.uk",        city: "London",      date: d("2026-05-31"), status: "pending" },
    { id: "w08", name: "Heidi Lawson",    restaurant: "Birch House Café",   email: "heidi@birchhouse.co.uk",   city: "Harrogate",   date: d("2026-05-31"), status: "pending" },
    { id: "w09", name: "Femi Bello",      restaurant: "Suya Spot",          email: "femi@suyaspot.co.uk",      city: "Peckham",     date: d("2026-05-30"), status: "invited" },
    { id: "w10", name: "Cara Nolan",      restaurant: "The Sea Glass",      email: "cara@seaglass.co.uk",      city: "Galway",      date: d("2026-05-30"), status: "pending" },
    { id: "w11", name: "Daniel Reyes",    restaurant: "El Pequeño",         email: "daniel@elpequeno.co.uk",   city: "Reading",     date: d("2026-05-29"), status: "joined" },
    { id: "w12", name: "Susanna Vale",    restaurant: "Vale & Vine",        email: "sue@valeandvine.co.uk",    city: "Tunbridge",   date: d("2026-05-28"), status: "pending" },
    { id: "w13", name: "Aiden Walsh",     restaurant: "The Hungry Otter",   email: "aiden@hungryotter.co.uk",  city: "Kendal",      date: d("2026-05-28"), status: "pending" },
    { id: "w14", name: "Noor Haddad",     restaurant: "Levant",             email: "noor@levant.co.uk",        city: "Manchester",  date: d("2026-05-27"), status: "invited" },
    { id: "w15", name: "Polly Frost",     restaurant: "Frost & Feather",    email: "polly@frostfeather.co.uk", city: "Norwich",     date: d("2026-05-26"), status: "joined" },
    { id: "w16", name: "Hamish Roy",      restaurant: "The Bothy",          email: "hamish@thebothy.scot",     city: "Fort William",date: d("2026-05-25"), status: "pending" },
    { id: "w17", name: "Lena Petrova",    restaurant: "Babushka",           email: "lena@babushka.co.uk",      city: "London",      date: d("2026-05-24"), status: "pending" },
    { id: "w18", name: "George Mbeki",    restaurant: "Cape Table",         email: "george@capetable.co.uk",   city: "Bristol",     date: d("2026-05-23"), status: "pending" }
  ];

  // MRR trend, last 9 months (£)
  var MRR_TREND = [
    { m: "Oct", v: 642 },
    { m: "Nov", v: 879 },
    { m: "Dec", v: 1166 },
    { m: "Jan", v: 1334 },
    { m: "Feb", v: 1492 },
    { m: "Mar", v: 1650 },
    { m: "Apr", v: 1729 },
    { m: "May", v: 1808 },
    { m: "Jun", v: 1966 }
  ];

  // Recent activity feed
  var ACTIVITY = [
    { t: "2h",  who: "Verde Vegan",     what: "started a free trial",            kind: "trial" },
    { t: "5h",  who: "The Harbour Kitchen", what: "added 6 dishes to the matrix", kind: "neutral" },
    { t: "8h",  who: "Saffron & Salt",  what: "paid invoice INV-2061 (£129)",    kind: "good" },
    { t: "1d",  who: "Olive & Thyme",   what: "payment failed (£79)",            kind: "bad" },
    { t: "1d",  who: "Drift Coffee Co.",what: "started a free trial",            kind: "trial" },
    { t: "2d",  who: "Forage & Co.",    what: "payment failed (£49)",            kind: "bad" },
    { t: "3d",  who: "Pier 7 Seafood",  what: "paused their subscription",       kind: "warn" },
    { t: "4d",  who: "Cinnamon Lane",   what: "upgraded to HospoPilot Plus",           kind: "good" }
  ];

  window.MISE_DATA = {
    PLANS: PLANS,
    CUSTOMERS: CUSTOMERS,
    INVOICES: INVOICES,
    WAITLIST: WAITLIST,
    MRR_TREND: MRR_TREND,
    ACTIVITY: ACTIVITY
  };
})();
