/* ============================================================
   main.js
   Jedina skripta sajta. Dve stvari, obe male:
   1) status "Otvoreno sada" u hero-u (02), iz stvarnog radnog vremena
   2) pojavljivanje sekcija pri skrolu (03-06)
   Bez biblioteka. Učitava se sa defer, pa DOM već postoji.

   SADRŽAJ
   00. KONSTANTE
   02. HERO          Status rada
   03-06. SEKCIJE    Pojavljivanje pri skrolu
   99. POKRETANJE
   Brojevi prate index.html. HEADER (01) i POZIV TRAKA (07) nemaju JS.
   ============================================================ */

/* ============================================
   00. KONSTANTE
   ============================================ */

// Radno vreme sa Google profila (brief.md, druga runda, pitanje 8).
// Indeks je dan u nedelji kako ga vraća Date: 0 = nedelja ... 6 = subota.
// null = ne radimo. Ako se vreme promeni, menja se OVDE i u index.html (02 i 06).
const WORKING_HOURS = {
  0: { open: 10, close: 16 },
  1: null,
  2: { open: 10, close: 20 },
  3: { open: 10, close: 20 },
  4: { open: 10, close: 20 },
  5: { open: 10, close: 20 },
  6: { open: 10, close: 16 },
};

// Nazivi dana u padežu koji treba za "otvaramo u ..."
const DAY_ACCUSATIVE = ['nedelju', 'ponedeljak', 'utorak', 'sredu', 'četvrtak', 'petak', 'subotu'];

// Salon je u Beogradu: vreme se uvek računa po beogradskom satu, ne po satu
// posetioca. Bez ovoga bi neko sa telefonom u drugoj zoni video pogrešan status.
const SALON_TIME_ZONE = 'Europe/Belgrade';

/* ============================================
   02. HERO
   Status rada
   ============================================ */

// Vraća { day, minutes } za dati trenutak u beogradskoj zoni.
// Prima: Date. Poziva: renderOpenStatus().
// RAZUMI: zašto Intl.DateTimeFormat sa timeZone umesto now.getDay() i now.getHours()?
function getSalonTime(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SALON_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type).value;
  const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return { day: days[get('weekday')], minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

// Vraća tekst statusa i da li je otvoreno.
// Prima: { day, minutes }. Vraća: { isOpen, text }. Poziva: renderOpenStatus().
function buildStatus({ day, minutes }) {
  const today = WORKING_HOURS[day];

  if (today && minutes >= today.open * 60 && minutes < today.close * 60) {
    return { isOpen: true, text: `Otvoreno sada, do ${today.close}:00` };
  }

  // Zatvoreno: tražimo prvi sledeći dan kada radimo. Petlja ide do 7 da
  // pokrije i slučaj kada je danas jedini radni dan (nikad, ali ne pada).
  if (today && minutes < today.open * 60) {
    return { isOpen: false, text: `Zatvoreno. Otvaramo danas u ${today.open}:00` };
  }
  for (let i = 1; i <= 7; i++) {
    const nextDay = (day + i) % 7;
    const hours = WORKING_HOURS[nextDay];
    if (hours) {
      const when = i === 1 ? 'sutra' : `u ${DAY_ACCUSATIVE[nextDay]}`;
      return { isOpen: false, text: `Zatvoreno. Otvaramo ${when} u ${hours.open}:00` };
    }
  }
  return { isOpen: false, text: 'Zatvoreno' };
}

// Upisuje status u hero. Prima: ništa. Poziva: init().
// Element #status-rada ima rezervisanu visinu u markupu, pa se layout ne pomera.
function renderOpenStatus() {
  const el = document.getElementById('status-rada');
  if (!el) return;
  const { isOpen, text } = buildStatus(getSalonTime(new Date()));
  el.querySelector('[data-status-text]').textContent = text;
  // Zelena = otvoreno, crvena = zatvoreno. Prsten oko tačke je providna verzija iste boje.
  // Tekst uz lampicu kaže isto, da status ne zavisi samo od boje.
  el.querySelector('[data-status-dot]').className = isOpen
    ? 'inline-block h-3 w-3 rounded-full bg-status-open ring-4 ring-status-open/25'
    : 'inline-block h-3 w-3 rounded-full bg-status-closed ring-4 ring-status-closed/25';
  el.classList.remove('invisible');
}

/* ============================================
   03-06. SEKCIJE
   Pojavljivanje pri skrolu (brief.md, pitanje 20). Stilovi su u
   src/input.css, sekcija "00. POJAVLJIVANJE PRI SKROLU".
   ============================================ */

// Dodaje klasu is-visible kad element uđe u vidno polje.
// Prima: ništa. Poziva: init(). Hvata sve elemente sa data-reveal.
// RAZUMI: šta radi IntersectionObserver i zašto je bolji od slušanja "scroll" događaja?
function initReveal() {
  const items = document.querySelectorAll('[data-reveal]');

  // Fallback za stare pregledače: pokaži sve odmah umesto da ostane sakriveno
  if (!('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // jednom je dovoljno, ne animira se opet
      });
    },
    // 0.1 = dovoljno je 10% elementa; visoka kartica (usluge) inače ne bi
    // stigla do 50% na malom ekranu i ostala bi nevidljiva.
    { threshold: 0.1 }
  );

  items.forEach((el) => observer.observe(el));
}

/* ============================================
   99. POKRETANJE
   ============================================ */

function init() {
  renderOpenStatus();
  initReveal();
}

init();
