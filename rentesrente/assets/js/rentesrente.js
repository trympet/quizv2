// @ts-check
/**
 * Validerer at input er gyldig i form
 * Hvis man supplerer paramenter fra eventlistner
 * vil inputelemenet bli markert som ugyldg hvis e.target er ugyldig
 * @param {Event} [e] - event fra eventlistener
 * @returns {Boolean} - returnerer true hvis input er ugyldig
 */
function ugyldigInput(e) {
  const inputs = document.querySelectorAll('#rente input');

  if (e) {
    // egne regler for inputelementer
    switch (e.target.name) {
      case 'rentesats':
        if (e.target.value > 100) {
          e.target.classList.add('ugyldig');
          return true;
        }
        break;
      case 'sparehorisont':
        if (e.target.value > 50) {
          e.target.classList.add('ugyldig');
          return true;
        }
        break;
      case 'tidsintervall':
        if (e.target.value > 365) {
          e.target.classList.add('ugyldig');
          return true;
        }
        break;
    }

    // generelle regler
    if (e.target.value < 1) {
      // ugyldig input
      e.target.classList.add('ugyldig');
      return true;
    }
    e.target.classList.remove('ugyldig'); // input er gyldig
  }

  // itererer over alle inputelementer
  for (let i = 0; i < inputs.length; i++) {
    if (inputs[i].value < 1 || inputs[i].value === '') {
      // ugyldig input
      return true;
    }
  }
  return false; // alt input er gyldig
}

/**
 * Beregner rente basert på input fra form
 * @param {Number} [nySparehorisont] - Egendefinert sparehorisont.
 * @returns {Object} - Returnerer sparehorisont, array med gevinst etter x år, og total
 */
function beregnRente(nySparehorisont) {
  // inputelementer fra form
  const input = document.querySelectorAll('#rente input');
  const startKapital = parseFloat(input[0].value);
  const mndInnskudd = parseFloat(input[1].value);
  const sparehorisont = nySparehorisont || parseFloat(input[2].value);
  const renteSats = parseFloat(input[3].value);
  const utbetalingsRate = parseFloat(input[4].value);

  let gevinstEtterÅr = []; // array med fortjeneste pr år
  let total; // sum av startkapital geninst og innskuddgevinst
  let innskuddUtenAvkastning = [];
  let totalInnskudd;

  for (let i = 0; i <= sparehorisont; i++) {
    let startKapitalGevinst; // A = P(1+r/n)^(nt)
    let innskuddGevinst; // A = ((1+r/n)^(nt)-1)/(r/n)

    startKapitalGevinst =
      startKapital *
      Math.pow(1 + renteSats / 100 / utbetalingsRate, utbetalingsRate * i);

    innskuddGevinst =
      mndInnskudd *
      ((Math.pow(1 + renteSats / 100 / utbetalingsRate, utbetalingsRate * i) -
        1) /
        (renteSats / 100 / 12));

    total = startKapitalGevinst + innskuddGevinst;
    totalInnskudd = mndInnskudd * 12 * i + startKapital;

    gevinstEtterÅr.push(total);
    innskuddUtenAvkastning.push(totalInnskudd);
  }

  document.querySelector('.output').innerHTML = `
    <div class="fortjeneste">Etter <h3>${sparehorisont} år</h3> vil den totale
     saldoen din være <h2>${Math.round(total)} kr</h2>
     <br>
     Det betyr at du har tjent <h3>${Math.round(total - totalInnskudd)} kr</h3> på avkastningen!</div>
  `;

  return {
    sparehorisont: sparehorisont,
    gevinstEtterÅr: gevinstEtterÅr,
    innskuddEtterÅr: innskuddUtenAvkastning,
    total: total,
  };
}

/**
 * Genererer SVG graf basert på inputparametere.
 * @param {Object} objekt - Object med følgende keys: sparehorisont, gevinstEtterÅr, total
 */
function tegnGraf({ sparehorisont, gevinstEtterÅr, innskuddEtterÅr, total }) {
  // viser glider
  const glider = document.querySelector('#sparehorisont-glider');
  glider.classList.remove('skjult');
  glider.value = sparehorisont;
  const graf = document.querySelector('.graf'); // wrapper til svg
  let plottVerdier = ''; // grafens origo ligger i x=100, y=500
  let plottInnskuddVerdier = ''; // linær graf som viser innskudd
  let yAkseLabels = ''; // tekst langs y-aksen
  let xAkseLabels = ''; // tekst langs x-aksen
  let yAkseLinjer = ''; // horisontale linjer langs yaksen

  // lager og avsetter verdier til 10 intervaller langs y-aksen
  for (let i = 1; i <= 10; i++) {
    let labelVerdi = Math.round((total / 10) * i);
    labelVerdi = Math.round(labelVerdi / 100) * 100;
    let yVerdi = 500 - 40 * i; // 40 unit mellomrom
    yAkseLabels += `<text x="40" y="${yVerdi + 4}">${labelVerdi}</text>`;
    yAkseLinjer += `
      <path
        stroke="#e6e6e6"
        stoke-width="1"
        class="akse-animasjon"
        d="M 100 ${yVerdi} L 800 ${yVerdi}"
        opacity="1"
      ></path>
    `;
  }

  // lager og avsetter år langs x-aksen, samt plottverier til grafen
  for (let i = 0; i <= sparehorisont; i++) {
    // labels langs x-aksen
    if (sparehorisont < 15) {
      // avsetter alle år
      let labelxVerdi = 100 + (600 / sparehorisont) * i;
      xAkseLabels += `<text x="${labelxVerdi}" y="540" transform="translate(0,0) rotate(-45 ${labelxVerdi} 540)">år ${i}</text>`;
    } else if (!(i % 2)) {
      // avsetter kun partallsår
      let LabelxVerdi = 100 + (600 / sparehorisont) * i;
      xAkseLabels += `<text x="${LabelxVerdi}" y="540" transform="translate(0,0) rotate(-45 ${LabelxVerdi} 540)">år ${i}</text>`;
    }

    // beregner plottverdiene med utgangspunkt i origo
    let yVerdi = 500 - (400 / total) * gevinstEtterÅr[i]; // 1 unit langs y-aksen representerer x antall penger
    let yInnskuddVerdi = 500 - (400 / total) * innskuddEtterÅr[i];
    let xVerdi = 100 + (600 / sparehorisont) * i; // x-intervall = 1 år
    if (i === 0) {
      plottVerdier += `M ${xVerdi} ${yVerdi} `;
      plottInnskuddVerdier += `M ${xVerdi} ${yInnskuddVerdi} `;
    }
    plottVerdier += `L ${xVerdi} ${yVerdi} `;
    plottInnskuddVerdier += `L ${xVerdi} ${yInnskuddVerdi} `;
  }

  let svgWrapper = document.createElement('div');
  svgWrapper.innerHTML = `
  <svg
    version="1.2"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    class="graph"
    role="img"
    preserveAspectRatio
    viewBox="0 80 750 500"
  >
    <title>Graf over avkastning</title>
    <desc>Du har tjent ... over en periode på 10 år</desc>
    <polyline></polyline>
    <defs>
      <clipPath id="graf-inner-clip">
        <rect id="graf-inner" x="100" y="100" height="400" width="700" fill="none" stroke="blue">
      </clipPath>
    </defs>
    <!-- y-aksen -->
    <g class="akse y-akse">
      <!-- høyde: 400 -->
      <line x1="100" x2="100" y1="100" y2="500"></line>
    </g>
    <!-- Verdilabels til y-aksen -->
    <g>
      ${yAkseLabels}
      <text
        x="30"
        y="250"
        class="akse-navn"
        transform="translate(0,0) rotate(270 50 280)"
      >
        Fortjenteste (kr)
      </text>
    </g>
    <!-- Horisontale linjer langs y-aksen -->
    <g clip-path="url(#graf-inner-clip)">
    ${yAkseLinjer}
    </g>
    <!-- x-aksen -->
    <g class="akse x-akse">
      <!-- bredde: 600 -->
      <line x1="100" x2="800" y1="500" y2="500"></line>
    </g>
    <!-- Verdilabels til x-aksen -->
    <g>
      ${xAkseLabels}
      <text x="600" y="570" class="akse-navn">Tid (år)</text>

      <rect x="250" y="559" width="12" height="12" style="fill:#005a29;"></rect>
      <text x="270" y="570" class="akse-navn">Innskudd</text>

      <rect x="400" y="559" width="12" height="12" style="fill:#2b4572;"></rect>
      <text x="420" y="570" class="akse-navn">Total verdi</text>
    </g>
    <!-- total fremtidig verdi linje -->
    <g clip-path="url(#graf-inner-clip)">
      <path
        fill="none"
        d="${plottVerdier}"
        stroke-width="2"
        stroke-linejoin="round"
        stroke-linecap="round"
        role="region"
        class="graf-animasjon total-linje"
      ></path>
    </g>
    <!-- innskudd uten avkastning linje -->
    <g clip-path="url(#graf-inner-clip)">
    <path
      fill="none"
      d="${plottInnskuddVerdier}"
      stroke-width="2"
      stroke-linejoin="round"
      stroke-linecap="round"
      role="region"
      class="graf-animasjon innskudd-linje"
    ></path>
  </g>
  </svg>
  `;
  // sletter gammel graf
  graf.innerHTML = '';
  // ny graf
  graf.appendChild(svgWrapper);
  // synliggjør grafen
  //graf.scrollIntoView({ behavior: "smooth", block: "center" });
}

document.querySelector('#rente').addEventListener('input', e => {
  // setter disabled attributt på submit hvis ugyldig input
  const submit = document.querySelector('button[type="submit"]');
  submit.disabled = ugyldigInput(e);
});

document.querySelector('#rente').addEventListener('submit', e => {
  e.preventDefault(); // forhindrer post
  tegnGraf(beregnRente()); // kalkulerer rente basert på input
  document
    .querySelector('.graf')
    .scrollIntoView({ behavior: 'smooth', block: 'center' });
});

document.querySelector('#sparehorisont-glider').addEventListener('input', e => {
  let nySparehorisont = e.target.value; // verdien til glider (år)
  if (!ugyldigInput()) {
    tegnGraf(beregnRente(nySparehorisont));
    document.querySelectorAll('.akse-animasjon').forEach( e => e.classList.remove('akse-animasjon'));
    document.querySelectorAll('.graf-animasjon').forEach( e => e.classList.remove('graf-animasjon'))

  }
});
document
  .querySelector('#sparehorisont-glider')
  .addEventListener('change', () => {
    // scroller kun når brukeren har stoppet å klikke
    document
      .querySelector('.graf')
      .scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
