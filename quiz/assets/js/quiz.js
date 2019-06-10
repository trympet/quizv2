class HjelpeFunksjoner {
  skjulElement(element) {
    element.classList.add("skjult");
  }
  visElement(element) {
    element.classList.remove("skjult");
    element.hidden = false;
  }
}

export default class Quiz extends HjelpeFunksjoner {
  /**
   * Deklarerer variabler.
   * Henter quiz fra ajax forespørsel.
   * @constructor
   */
  constructor(seksjoner) {
    super();
    /**
     * @constant {Object} - HTML elementer for ulike views
     * @property {Object} intro - Dynamiske elementer i intro view
     * @property {Object} quiz - Dynamiske elementer i quiz view
     * @property {Object} oppsummering - Dynamiske elementer i oppsummering view
     * @property {Element} intro.main - View wrapper
     * @property {Element} quiz.main - View wrapper
     * @property {Element} oppsummering.main - View wrapper
     */

    this.seksjoner = seksjoner

    window.history.replaceState({ seksjon: "intro" }, "Hjem");

    /** @member {Element} - HTMLElement/viewet som skal vises av brukeren nå */
    this.aktivSeksjon; // aktiv view element

    /** @member {Number} - indeks som viser spørsmålet som er synlig for brukeren */
    this.quizSpørsmålIndeks = 0;

    /** @member {Array} - Array som inneholder spørsmål tilknyttet valgt tema av brukeren  */
    this.oppgavesett = [];

    /**
     * @member {Array.<{tema: String, oppgavesett: Array}>} - JSON respons fra ajax med quizer
     * Et hvert spørsmål kan ha to typer: 'radio' eller 'checkbox'
     * Ett oppgavesett kan ha ubegrenset mengder med spørsmål
     * Hvert spørsmål kan ha ubegrensede mengder svaralternativer
     * Fasiten til hvert spørsmål er en string som er lik det riktige svaralternativet
     * @property {string}
     */
    this.spørsmål = [];

    // henter spørsmål fra
    fetch("assets/spørsmål.json")
      .then(response => response.json()) // parser json
      .then(json => (this.spørsmål = json))
      .catch(error => console.error("noe gikk galt", error))
      .then(this.genererTemaListe.bind(this)) // gjøres kun en gang
      .then(this.visIntro.bind(this)); // anonymt function call, men bindes til klassen
  }

  /* DOM Manipulasjon */



  /**
   * Skjuler alle seksjoner untatt this.aktivSeksjon
   * @param {string} [tema] - temanavn
   */
  visSeksjon(tema) { // TODO
    // skjuler alle seksjoner
    for (const seksjon in this.seksjoner) {
      const main = this.seksjoner[seksjon].main;
      this.skjulElement(main);
    }
    this.seksjoner.quiz.endreOverskriftOgTittel(tema); // endrer overskrift og tittel
    this.visElement(this.aktivSeksjon); // viser definert seksjon
  }

  visIntro() {
    this.aktivSeksjon = this.seksjoner.intro.main;
    window.history.replaceState({ seksjon: "intro" }, "Hjem");
    this.visSeksjon();
  }

  visQuiz(tema) {
    this.aktivSeksjon = this.seksjoner.quiz.main;
    this.visSeksjon(tema);
    //window.history.replaceState({ seksjon: "quiz", tema: tema }, "Quiz");
  }

  visOppsummering() {
    this.aktivSeksjon = this.seksjoner.oppsummering.main;
    this.visSeksjon();
    window.history.replaceState({ seksjon: "oppsummering" }, "Oppsummering");
  }

  /** Viser introview med mindre bruker allerede er på introview */
  gåHjem() {
    if (window.history.state.seksjon !== "intro") {
      window.history.go(-1);
    }
  }

  /* GENERASJON AV INNHOLD */

  /** Genererer klikkbar link for hvert tema i introview  */
  genererTemaListe() {
    this.spørsmål.forEach(quiz => {
      // for hvert temasett
      const quizTema = document.createElement("li");
      quizTema.innerText = quiz.tema;
      quizTema.dataset.quiz = quiz.tema;
      quizTema.addEventListener("click", () => this.startNyQuiz(quiz.tema)); // starter quiz
      this.seksjoner.intro.quizListe.appendChild(quizTema); // legger til listeelement
    });
  }

  /** Genererer spørsmål + svaralternativer iht. quizSpørsmålIndeks */
  genererSpørsmål() {
    // objekt med spørsmål+svaralternativer
    let gjeldendeSpørsmål = this.oppgavesett[this.quizSpørsmålIndeks];
    let spørsmål = gjeldendeSpørsmål.spørsmål; // spørsmålstring
    this.seksjoner.quiz.spørsmål.innerText = spørsmål;
    let svaralternativer = gjeldendeSpørsmål.svaralternativer;
    let type = gjeldendeSpørsmål.type; // radio eller select
    this.seksjoner.quiz.svar.element.innerHTML = ""; // nullstiller svaralternativer
    for (const indeks in svaralternativer) {
      // for hvert svaralternativ
      const alternativTekst = svaralternativer[indeks];
      let alternativ = document.createElement("label"); // wrapper
      let input = document.createElement("input"); // radio eller select
      input.type = type;
      input.name = "svaralternativer";
      input.id = alternativTekst; // unik id
      input.checked = this.sammenliknSvar(
        alternativTekst,
        this.quizSpørsmålIndeks
      );
      input.dataset.indeks = indeks;
      alternativ.appendChild(input);
      alternativ.appendChild(document.createTextNode(alternativTekst));
      alternativ.setAttribute("for", alternativTekst); // assosioserer med input
      alternativ.appendChild(input);
      this.seksjoner.quiz.svar.element.appendChild(alternativ);
    }
  }

  /**
   * Starter NY quiz basert på temastring
   * F.eks. startNyQuiz('dom');
   * @param {String} tema
   */
  startNyQuiz(tema) {
    // rutine for å starte ny quiz
    this.quizSpørsmålIndeks = 0; // starter på null - nullstilles
    let valgtTema = this.spørsmål.find(e => e.tema === tema); // henter temaobjekt
    this.oppgavesett = valgtTema.oppgavesett; // array med oppgaver
    /** Muterer hvert spørsmålsobject til å ha egenskap om korrekt/ikke + avgitt svar */
    this.oppgavesett.forEach(spørsmål =>
      Object.assign(spørsmål, { svar: [], riktig: [] })
    );
    this.visQuiz(tema); // viser quiz elementer
    this.seksjoner.quiz.nullstill(); // nullstiller quiz elementer
    this.genererSpørsmål(); // genererer quiz innhold
    this.seksjoner.quiz.nav.generer(this.oppgavesett)
    this.navigerTilSpørsmål({ indeks: 0 });

    window.history.pushState({ seksjon: "quiz", tema: tema }, "Quiz");
  }

  /* NAVIGASJON */
  /**
   * Skjuler nesteknapp + viser avsluttklapp
   * @param {Boolean} bool - true = vis avslutt + skjul neste
   */

  /**
   * Rutine for å navigere mellom spørsmål
   * @param {Object} params - valgfrie parametere ()
   * @param {Boolean} [params.forrige = false] - naviger 1 tilbake
   * @param {Boolean} [params.neste = false] - naviger forover, tilbake eller bestemt indeks
   * @param {Number} [params.indeks = -1] - naviger forover, tilbake eller bestemt indeks
   */
  navigerTilSpørsmål({ forrige = false, neste = false, indeks = -1 }) {
    this.lagreSvar();
    /* endrer spørsmålsindeksen basert på params */
    if (indeks >= 0) {
      this.quizSpørsmålIndeks = indeks;
    }
    if (neste) {
      this.quizSpørsmålIndeks++;
    }
    if (forrige) {
      this.quizSpørsmålIndeks--;
    }

    this.seksjoner.quiz.nav.oppdater(
      this.quizSpørsmålIndeks,
      this.oppgavesett.length - 1
    );
    this.genererSpørsmål();
  }

  /**
   * Evaluerer om string finnes i tidligere avgitte svar
   * @returns {Boolean} - Retunerer true hvis det finnes match
   */
  sammenliknSvar(string, spmIndeks) {
    return this.oppgavesett[spmIndeks].svar.includes(string);
  }

  /** Lagrer valgt element i array */
  lagreSvar() {
    const svar = this.seksjoner.quiz.svar.valg();
    if (!svar) {
      return false;
    }
    let akkSvar = [];
    svar.forEach(element => {
      akkSvar.push(element.id);
    });
    this.oppgavesett[this.quizSpørsmålIndeks].svar = akkSvar;
  }

  /* -------------- OPPSUMMERING */
  /** Rutine for å avslutte påbegynt quiz */
  avsluttQuiz() {
    this.lagreSvar();
    this.visOppsummering();
    this.genererOppsummering();
  }
  /** Muterer oppgavesett-objektet med array som inneholder
   * svar som bruker svarte korrekt på
   */
  evaluerSvar(spm) {
    spm.svar.forEach(svar => {
      spm.fasit.forEach(fasit => {
        if (svar === fasit) {
          spm.riktig.push(fasit);
        }
      });
    });
  }
  /**
   * Generer liste med spørsmål og tilhørende svar
   * Markerer korrekte og gale svar
   */
  genererOppsummering() {
    this.oppgavesett.forEach(spm => {
      this.evaluerSvar(spm);
      let ul = document.createElement("ul");
      ul.classList.add("alternativer");
      spm.svaralternativer.forEach(alt => {
        let li = document.createElement("li");
        li.classList.add("alternativ");
        li.innerHTML = alt;
        if (spm.riktig.includes(alt)) {
          li.classList.add("riktig");
        } else if (spm.svar.includes(alt)) {
          li.classList.add("galt");
        } else if (spm.fasit.includes(alt)) {
          li.classList.add("fasit");
        }
        ul.appendChild(li);
      });
      let span = document.createElement("span");
      span.addEventListener("click", e =>
        // @ts-ignore
        e.target.parentNode.classList.toggle("aktiv")
      );
      span.innerText = spm.spørsmål;
      span.dataset.content = `${spm.riktig.length} / ${spm.fasit.length}`;

      let spørsmål = document.createElement("div");
      spørsmål.classList.add("spørsmål");
      spørsmål.appendChild(span);
      spørsmål.appendChild(ul);
      this.seksjoner.oppsummering.spørsmål.appendChild(spørsmål);
    });
  }
}