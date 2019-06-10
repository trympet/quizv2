document.querySelector("#rente").addEventListener("submit", e => {
  e.preventDefault(); // forhindrer post
  beregnRente(); // kalkulerer rente
});


function beregnRente() {
  let total; // sum av startkapital geninst og innskuddgevinst

  let input = document.querySelectorAll("#rente input"); // nodelist med inputelementer
  
  let startKapital = parseFloat(input[0].value);
  let mndInnskudd = parseFloat(input[1].value);
  let sparehorisont = parseFloat(input[2].value);
  let renteSats = parseFloat(input[3].value);
  let utbetalingsRate = parseFloat(input[4].value);
  


  let gevinstEtterÅr = []; // array med fortjeneste pr år 

  for (let i = 0; i <= sparehorisont; i++) {
    let startKapitalGevinst;
    let innskuddGevinst;
    // A = P(1+r/n)^(nt)
    startKapitalGevinst =
      startKapital *
      Math.pow(
        1 + renteSats / 100 / utbetalingsRate,
        utbetalingsRate * i
      );
    // A = ((1+r/n)^(nt)-1)/(r/n)
    innskuddGevinst =
      mndInnskudd *
      ((Math.pow(
        1 + renteSats / 100 / utbetalingsRate,
        utbetalingsRate * i
      ) -
        1) /
        (renteSats / 100 / utbetalingsRate));

    total = startKapitalGevinst + innskuddGevinst;
    gevinstEtterÅr.push(total)
  }

  let personligInnskudd = Math.round(mndInnskudd * 12 * sparehorisont)
  document.querySelector('.output')
    .innerHTML = `<p>Etter ${sparehorisont} år vil den totale saldoen din være kr ${Math.round(total)},-.</p>
      <p>Ditt totale innskudd er på kr ${personligInnskudd}.</p>
      <p>Det betyr at du sitter igjen med en total fortjeneste på kr ${Math.round(total - personligInnskudd)}
    `
  tegnGraf(sparehorisont, gevinstEtterÅr, total)

/*   test1 = startKapital * Math.pow(1+((renteSats/100)/utbetalingsRate), utbetalingsRate * sparehorisont);
  test2 = mndInnskudd * ((Math.pow((1+((renteSats/100)/utbetalingsRate)), (utbetalingsRate * sparehorisont)) - 1) / ((renteSats/100)/utbetalingsRate))
  tot1 = test1 + test2;
  console.log(test1, test2, tot1); */
  
  
}
function tegnGraf(sparehorisont, gevinstEtterÅr, total) {
  let plottVerdier = '' // grafen starter x=100, y=500
  let yAkseLabels = '' // tekst langs y-aksen
  let xAkseLabels = '' // tekst langs x-aksen
  let yAkseLinjer = '' // horisontale linjer langs yaksen


  for (let i = 1; i <= 10; i++) {
    let labelVerdi = (Math.round((total / 10) * i))
    labelVerdi = Math.round(labelVerdi/100)*100
    let yVerdi = 500 - (40 * i);
    yAkseLabels += `<text x="50" y="${yVerdi + 4}">${labelVerdi}</text>`;
    yAkseLinjer += `
      <path
        stroke="#e6e6e6"
        stoke-width="1"
        class="akse-linje"
        d="M 100 ${yVerdi} L 800 ${yVerdi}"
        opacity="1"
      ></path>
    `



  }



  for (let i = 0; i <= sparehorisont; i++) {
    if (sparehorisont < 15) {
      let LabelxVerdi = 100 + (600 / sparehorisont) * i 
      xAkseLabels += `<text x="${LabelxVerdi}" y="540" transform="translate(0,0) rotate(-45 ${LabelxVerdi} 540)">år ${i}</text>`;
    } else if (!(i % 2)){
      let LabelxVerdi = 100 + (600 / sparehorisont) * i 
      xAkseLabels += `<text x="${LabelxVerdi}" y="540" transform="translate(0,0) rotate(-45 ${LabelxVerdi} 540)">år ${i}</text>`;
    }


    // let yVerdi = 500 - (500 * gevinstEtterÅr[i] * Math.pow(10, parseInt('-' + (parseInt(total).toString().length))))
    let yVerdi = 500 - (400 / total) * gevinstEtterÅr[i]
    let xVerdi = 100 + (600 / sparehorisont) * i
    if (i === 0) plottVerdier += `M ${xVerdi} ${yVerdi} `;
    plottVerdier += `L ${xVerdi} ${yVerdi} `

    

  }

  console.log(plottVerdier);
  


  let svgWrapper = document.createElement("div");
  svgWrapper.innerHTML = `
  <svg
    version="1.2"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink"
    class="graph"
    aria-labelledby="title"
    role="img"
    preserveAspectRatio
    viewBox="0 0 800 600"
    height="600"
    width="800"
  >
  <title>Sparing</title>
  <desc>Du har tjent ... over en periode på 10 år</desc>
  <polyline></polyline>
  <g class="akse y-akse">
    <!-- høyde: 400 -->
    <line x1="100" x2="100" y1="100" y2="500"></line>
  </g>
  <g>
    ${yAkseLabels}
    <text
      x="30"
      y="260"
      class="akse-navn"
      transform="translate(0,0) rotate(270 50 280)"
    >
      Fortjenteste (kr)
    </text>
  </g>
  <g>
  ${yAkseLinjer}

    
  </g>
  <g class="akse x-akse">
    <!-- bredde: 600 -->
    <line x1="100" x2="800" y1="500" y2="500"></line>
  </g>
  <g>
    ${xAkseLabels}
    <text x="650" y="590" class="akse-navn">Tid (år)</text>
  </g>

  <g>
    <path
      fill="none"
      d="${plottVerdier}"
      stroke="rgba(0,50,91,1)"
      stroke-width="2"
      stroke-linejoin="round"
      stroke-linecap="round"
      role="region"
    ></path>
  </g>
</svg>
  `;

  document.querySelector('.graf').innerHTML = '';
  document.querySelector('.graf').appendChild(svgWrapper);
}
