// @ts-check
/*
https://developer.mozilla.org/en-US/docs/Web/API/History_API
*/

class HjelpeFunksjoner {
  skjulElement(element) {
    element.classList.add('skjult');
  }
  visElement(element) {
    element.classList.remove('skjult');
    element.hidden = false;
  }
  /** Viser introview med mindre bruker allerede er på introview */
  gåHjem() {
    if (window.history.state.seksjon !== 'intro') {
      window.history.go(-1);
    }
  }
}
class Quiz extends HjelpeFunksjoner {
  /**
   * Deklarerer variabler.
   * Henter quiz fra ajax forespørsel.
   * @constructor
   */
  constructor() {
    super();
    /**
     * Objekt som inneholder dynamiske elementer for hvert view
     * samt tilhørende metoder for disse dynamiske elementene
     * @constant {Object} - HTML elementer for ulike views
     * @property {Object} intro - Dynamiske elementer i intro view
     * @property {Object} quiz - Dynamiske elementer i quiz view
     * @property {Object} oppsummering - Dynamiske elementer i oppsummering view
     * @property {Element} intro.main - View wrapper
     * @property {Element} quiz.main - View wrapper
     * @property {Element} oppsummering.main - View wrapper
     */
    this.seksjoner = {
      intro: {
        main: document.querySelector('.intro'),
        overskrift: document.querySelector('.overskrift'),
        quizListe: document.querySelector('.intro-quiz-liste'),
        /** Genererer klikkbar link for hvert tema i introview
         * @param {Array} spørsmål - Array med ulike quizer
         */
        generer: spørsmål => {
          spørsmål.forEach(quiz => {
            // for hvert temasett
            const quizTema = document.createElement('li');
            quizTema.innerText = quiz.tema;
            quizTema.dataset.quiz = quiz.tema;
            quizTema.addEventListener('click', () => q.startNyQuiz(quiz.tema)); // starter quiz
            this.seksjoner.intro.quizListe.appendChild(quizTema); // legger til listeelement
          });
        },
      },
      quiz: {
        main: document.querySelector('.quiz'),
        nav: {
          element: document.querySelector('.quiz-nav'),
          /**
           * Genererer navigasjonsbar basert på antall spørsmål
           * @param {Array} oppgavesett - array med spørsmål for valgt quiz
           */
          generer: oppgavesett => {
            // @ts-ignore
            for (let i = 0; i < oppgavesett.length; i++) {
              const span = document.createElement('span');
              span.dataset.indeks = i.toString();
              span.addEventListener(
                'click',
                q.navigerTilSpørsmål.bind(this, { indeks: i })
              );
              span.innerText = (i + 1).toString();
              this.seksjoner.quiz.nav.element.appendChild(span);
            }
          },
          /**
           * Henter span basert på indeks
           * @param {Number} indeks - Indeksen tilknyttet span
           * @returns {HTMLElement} - Span som matcher indeks
           */
          hentSpan: indeks =>
            document.querySelector(`span[data-indeks="${indeks}"]`),
          /**
           * Fjerner gammel aktiv span og markerer ny span som aktiv
           * @param {Number} indeks - indeks til ny aktiv span
           */
          settNavAktiv: indeks => {
            if (document.querySelector(`span.aktiv`))
              document.querySelector(`span.aktiv`).classList.remove('aktiv'); //fjerner element som er aktiv fra før
            this.seksjoner.quiz.nav.hentSpan(indeks).classList.add('aktiv'); // setter span som tilsvarer ny indeks aktiv
          },
          /** Legger til besøktklasse på element som er aktivt i nav */
          settNavBesøkt: () => {
            document.querySelector(`span.aktiv`).classList.add('besøkt');
          },
          /** Fjerner besøktklasse på element som er aktivt i nav */
          fjernNavBesøkt: () => {
            document.querySelector(`span.aktiv`).classList.remove('besøkt');
          },
          /**
           * Metode for å oppdatere navbaren basert på aktiv indeks
           * @param {Number} indeks - Indeks på nytt aktivt spørsmål
           * @param {Number} lengde - Antall spørsmål i valgt tema - 1
           */
          oppdater: (indeks, lengde) => {
            if (this.seksjoner.quiz.svar.valg().length)
              this.seksjoner.quiz.nav.settNavBesøkt();

            this.seksjoner.quiz.nav.settNavAktiv(indeks);
            this.seksjoner.quiz.nav.sentrer(
              document.querySelector(`span.aktiv`)
            ); // sentrer aktiv span
            indeks === lengde // TODO
              ? this.seksjoner.quiz.visAvslutt(true)
              : this.seksjoner.quiz.visAvslutt(false);
            indeks === 0 // TODO
              ? this.seksjoner.quiz.forrigeDisabled(true)
              : this.seksjoner.quiz.forrigeDisabled(false);

            this.seksjoner.quiz.nav.sentrer(
              document.querySelector(`span.aktiv`)
            );
          },
          /**
           * Sentrerer element ved å justere scroll-x verdi
           * @param {HTMLElement} e - Element som skal sentreres
           */
          sentrer: e => {
            if (e.parentElement.offsetWidth / 2 < e.offsetLeft) {
              e.parentElement.scrollLeft =
                e.offsetLeft - e.parentElement.offsetWidth / 2 + e.offsetWidth;
            } else {
              e.parentElement.scrollLeft = 0;
            }
          },
        },
        spørsmål: document.querySelector('.quiz-spørsmål'),
        svar: {
          element: document.querySelector('.quiz-svar'),
          /** @returns {NodeList} - NodeList over valgte inputelementer */
          valg: () => {
            return document.querySelectorAll('input:checked');
          },
          /** fjerner checked property fra valgt(e) svar */
          fjernValg: () => {
            this.seksjoner.quiz.svar.valg().forEach(e => (e.checked = false));
            this.seksjoner.quiz.nav.fjernNavBesøkt();
          },
          /** @returns {Array} - IDen til valgt(e) svar */
          valgId: () => {
            let akkSvar = [];
            this.seksjoner.quiz.svar.valg().forEach(element => {
              akkSvar.push(element.id);
            });
            return akkSvar;
          },
        },
        /** Viser avsluttknapp
         * @param {Boolean} bool - hvis true, vises avsluttknapp
         */
        visAvslutt: bool => {
          const nesteSpørsmålKnapp = document.querySelector('#neste');
          const avsluttKnapp = document.querySelector('#avslutt');
          bool
            ? this.skjulElement(nesteSpørsmålKnapp)
            : this.visElement(nesteSpørsmålKnapp);
          bool
            ? this.visElement(avsluttKnapp)
            : this.skjulElement(avsluttKnapp);
        },
        /** Legger til disabled atributt på forrige spm. knapp
         * @param {Boolean} bool - hvis true, forrige = disabled
         */
        forrigeDisabled: bool => {
          const forrigeSpørsmålKnapp = document.querySelector('#forrige');
          // @ts-ignore
          forrigeSpørsmålKnapp.disabled = bool;
        },
        /** Nullstiller navbar, spørsmål, svaralternativer og oppsummering */
        nullstill: () => {
          this.seksjoner.quiz.nav.element.innerHTML = '';
          this.seksjoner.quiz.spørsmål.innerHTML = '';
          this.seksjoner.quiz.svar.innerHTML = '';
          this.seksjoner.oppsummering.spørsmål.innerHTML = '';
        },
      },
      oppsummering: {
        main: document.querySelector('.oppsummering'),
        spørsmål: document.querySelector('.spørsmål-liste'),
        /**
         * Generer liste med spørsmål og tilhørende svar
         * Markerer korrekte og gale svar
         * @param {Array} oppgavesett - array med oppgaver for valgt tema
         * @param {function} markerRiktigeSvar - lagrer riktige svar
         */
        generer: (oppgavesett, markerRiktigeSvar) => {
          oppgavesett.forEach(spm => {
            markerRiktigeSvar(spm);
            const ul = document.createElement('ul');
            ul.classList.add('alternativer');
            spm.svaralternativer.forEach(alt => {
              const li = document.createElement('li');
              li.classList.add('alternativ');
              li.innerHTML = alt;
              if (spm.riktig.includes(alt)) {
                li.classList.add('riktig');
              } else if (spm.svar.includes(alt)) {
                li.classList.add('galt');
              } else if (spm.fasit.includes(alt)) {
                li.classList.add('fasit');
              }
              ul.appendChild(li);
            });
            const span = document.createElement('span');
            span.addEventListener('click', e =>
              // @ts-ignore
              e.target.parentNode.classList.toggle('aktiv')
            );
            span.innerText = spm.spørsmål;
            span.dataset.content = `${spm.riktig.length} / ${spm.fasit.length}`;

            const spørsmål = document.createElement('div');
            spørsmål.classList.add('spørsmål');
            spørsmål.appendChild(span);
            spørsmål.appendChild(ul);
            this.seksjoner.oppsummering.spørsmål.appendChild(spørsmål);
          });
        },
      },
    };

    window.history.replaceState({ seksjon: 'intro' }, 'Hjem');

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

    // henter spørsmål fra fil
    fetch('assets/spørsmål.json')
      .then(response => response.json()) // parser json
      .then(json => (this.spørsmål = json))
      .catch(error => console.debug('noe gikk galt', error))
      .then(this.seksjoner.intro.generer.bind(this.spørsmål)) // gjøres kun en gang
      .then(this.visSeksjon.bind(this, 'intro')); // anonymt function call, men bindes til klassen
  }

  /* DOM Manipulasjon */

  /** Bytter overskrift samt tittel. */
  endreOverskriftOgTittel(emne) {
    // TODO
    const suffix = emne ? ` - ${emne}` : '';
    this.seksjoner.intro.overskrift.nextSibling.innerHTML = suffix ? emne : ''; // setter tittel span
    document.title = 'JavaScript Quiz' + suffix; // setter faneoverskrift
  }

  /**
   * Skjuler alle seksjoner untatt valgt view
   * @param {string} seksjon - Navn på seksjon som skal vises
   * @param {string} [tema] - Navn på valgt tema
   */
  visSeksjon(seksjon, tema) {
    // skjuler alle elementer
    for (const seksjon in this.seksjoner) {
      const main = this.seksjoner[seksjon].main;
      this.skjulElement(main);
    }
    // viser valgt element
    switch (seksjon) {
      case 'intro':
        this.visElement(this.seksjoner[seksjon].main);
        window.history.replaceState({ seksjon: 'intro' }, 'Hjem');
        break;
      case 'quiz':
        this.visElement(this.seksjoner[seksjon].main);
        break;
      case 'oppsummering':
        this.visElement(this.seksjoner[seksjon].main);
        window.history.replaceState(
          { seksjon: 'oppsummering' },
          'Oppsummering'
        );
        break;
    }
    this.endreOverskriftOgTittel(tema); // endrer overskrift og tittel
  }

  /* GENERASJON AV INNHOLD */

  /** Genererer spørsmål + svaralternativer iht. quizSpørsmålIndeks */
  genererSpørsmål() {
    const gjeldendeSpørsmål = this.oppgavesett[this.quizSpørsmålIndeks]; // objekt med spørsmål+svaralternativer
    this.seksjoner.quiz.spørsmål.innerText = gjeldendeSpørsmål.spørsmål; // spørsmålstring
    const svaralternativer = gjeldendeSpørsmål.svaralternativer;
    const type = gjeldendeSpørsmål.type; // radio eller select
    this.seksjoner.quiz.svar.element.innerHTML = ''; // nullstiller svaralternativer
    for (const indeks in svaralternativer) {
      // for hvert svaralternativ
      const alternativTekst = svaralternativer[indeks];
      const alternativ = document.createElement('label'); // wrapper
      const input = document.createElement('input'); // radio eller select
      input.type = type;
      input.name = 'svaralternativer';
      input.id = alternativTekst; // unik id
      input.checked = this.sammenliknSvar(
        alternativTekst,
        this.quizSpørsmålIndeks
      );
      input.dataset.indeks = indeks;
      alternativ.appendChild(input);
      alternativ.appendChild(document.createTextNode(alternativTekst));
      alternativ.setAttribute('for', alternativTekst); // assosioserer med input
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
    const valgtTema = this.spørsmål.find(e => e.tema === tema); // henter temaobjekt
    this.oppgavesett = valgtTema.oppgavesett; // array med oppgaver
    /** Muterer hvert spørsmålsobject til å ha egenskap om korrekt/ikke + avgitt svar */
    this.oppgavesett.forEach(spørsmål =>
      Object.assign(spørsmål, { svar: [], riktig: [] })
    );
    this.visSeksjon('quiz', tema); // viser quiz elementer
    this.seksjoner.quiz.nullstill(); // nullstiller quiz elementer
    this.genererSpørsmål(); // genererer quiz innhold
    this.seksjoner.quiz.nav.generer(this.oppgavesett);
    this.navigerTilSpørsmål({ indeks: 0 });

    window.history.pushState({ seksjon: 'quiz', tema: tema }, 'Quiz');
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
  /** Muterer oppgavesett-objektet med array som inneholder
   * svar som bruker svarte korrekt på
   */
  lagreRiktigeSvar(spm) {
    spm.svar.forEach(svar => {
      spm.fasit.forEach(fasit => {
        if (svar === fasit) {
          spm.riktig.push(fasit);
        }
      });
    });
  }

  /** Rutine for å avslutte påbegynt quiz */
  avsluttQuiz() {
    this.lagreSvar();
    this.visSeksjon('oppsummering');
    this.seksjoner.oppsummering.generer(
      this.oppgavesett,
      this.lagreRiktigeSvar
    );
  }
}

let q = new Quiz();
document
  .querySelector('#forrige')
  .addEventListener('click', () => q.navigerTilSpørsmål({ forrige: true }));
document
  .querySelector('#neste')
  .addEventListener('click', () => q.navigerTilSpørsmål({ neste: true }));
document
  .querySelector('#nullstill')
  .addEventListener('click', () => q.seksjoner.quiz.svar.fjernValg());
const avsluttKnapp = document.querySelector('#avslutt');
avsluttKnapp.addEventListener('click', q.avsluttQuiz.bind(q));

window.onpopstate = event => {
  if (!q.oppgavesett) {
    return q.visSeksjon('intro');
  }
  switch (event.state.seksjon) {
    case 'intro':
      q.visSeksjon('intro'); // viser hjemskjerm
      break;
    case 'quiz':
      q.visSeksjon('quiz'); // viser forrige genererte quiz
      break;
    case 'oppsummering':
      q.visSeksjon('oppsummering');
      break;
  }
};
