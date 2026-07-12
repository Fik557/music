const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "..", "data", "rooms.json");

const DESCRIPTIONS = {
  "air gear": "Ikki trafia do swiata Air Treckow, gdzie uliczne wyscigi na napedzanych rolkach zmieniaja sie w walke o styl, wolnosc i pozycje wsrod rywali.",
  "anohana the flower we saw that day": "Grupa dawnych przyjaciol wraca do bolesnych wspomnien z dziecinstwa, gdy pojawia sie szansa na pozegnanie osoby, ktorej strata ich rozdzielila.",
  "arifureta from commonplace to worlds strongest": "Uczen przeniesiony do fantasy-swiata po zdradzie schodzi na samo dno lochu i zaczyna brutalna droge od slabszego czlonka klasy do poteznego wojownika.",
  "assassination classroom second season": "Klasa 3-E kontynuuje nietypowa nauke pod opieka niezwyklego nauczyciela, laczac szkolna komedie, akcje i coraz trudniejsze wybory.",
  "attack on titan season 2": "Ludzkosc walczy o przetrwanie za murami, gdy kolejne sekrety tytanow i zdrady wstrzasaja oddzialem zwiadowcow.",
  "baka and test summon the beasts": "Komedia szkolna, w ktorej uczniowie walcza awatarami zaleznymi od wynikow w nauce, a najgorsza klasa probuje odmienic swoj los.",
  "beelzebub": "Niepokonany licealny awanturnik zostaje opiekunem demonicznego niemowlaka, co miesza szkolne bijatyki z absurdalna komedia.",
  "black clover": "Asta, chlopak bez magii w swiecie magow, walczy mieczami antymagii, by dogonic rywala i zostac Krolem Magow.",
  "blend s": "Komedia o kawiarni tematycznej, gdzie pracownicy odgrywaja rozne osobowosci, a niesmiala Maika przypadkiem zostaje mistrzynia surowej obslugi.",
  "bleach": "Ichigo Kurosaki zdobywa moce shinigami i zaczyna chronic ludzi przed duchowymi zagrozeniami, wchodzac w coraz wieksze konflikty Soul Society.",
  "bokurano": "Grupa dzieci podpisuje kontrakt na pilotowanie ogromnego robota, nie wiedzac, ze kazda walka ma dramatyczna cene.",
  "call of the night": "Bezseny nastolatek poznaje w nocy wampirzyce i odkrywa miasto pelne wolnosci, samotnosci oraz dziwnych zasad milosci.",
  "dan da dan": "Momo i Okarun wpadaja w szalona mieszanke duchow, kosmitow i szkolnej komedii, probujac udowodnic sobie nawzajem, co naprawde istnieje.",
  "darling in the franxx": "W postapokaliptycznym swiecie mlodzi piloci walcza w mechach, odkrywajac prawde o sobie, dorastaniu i systemie, ktory nimi steruje.",
  "demon slayer kimetsu no yaiba": "Tanjiro rusza na droge pogromcy demonow, by uratowac siostre i odnalezc sprawce tragedii swojej rodziny.",
  "dont toy with me miss nagatoro": "Niesmialy uczen i zaczepna Nagatoro tworza relacje pelna dokuczania, niezrecznosci i coraz cieplejszych momentow.",
  "dr stone": "Po tajemniczym skamienieniu ludzkosci Senku odbudowuje cywilizacje za pomoca nauki, wynalazkow i sprytu.",
  "dragon ball z": "Goku i jego sojusznicy mierza sie z coraz potezniejszymi przeciwnikami, chroniac Ziemie w klasycznej sadze akcji i treningu.",
  "erased": "Satoru zostaje cofnięty do dziecinstwa i probuje zapobiec tragedii, ktora laczy sie z morderstwami z przeszlosci.",
  "ergo proxy": "Mroczne science fiction o sledztwie w zamknietym miescie, sztucznej inteligencji i pytaniach o tozsamosc czlowieka.",
  "eromanga sensei": "Mlody autor light novel odkrywa, ze jego anonimowa ilustratorka to wlasna siostra, co prowadzi do komedii o tworcach i rodzinnych napieciach.",
  "fate zero": "Magowie i historyczni bohaterowie walcza w bezlitosnej Wojnie o Swietego Graala, gdzie idealizm szybko zderza sie z cena zwyciestwa.",
  "fire force": "Specjalne oddzialy strazakow walcza z ludzmi zmieniajacymi sie w plonace istoty, odkrywajac spisek wokol tajemniczego ognia.",
  "fullmetal alchemist": "Bracia Elric szukaja Kamienia Filozoficznego po zakazanym rytuale alchemii, ktory odebral im ciala i spokojne zycie.",
  "fullmetal alchemist brotherhood": "Edward i Alphonse Elric odkrywaja wielki spisek panstwowy, szukajac sposobu na odzyskanie cial po tragicznym eksperymencie alchemicznym.",
  "gantz": "Po naglej smierci ludzie trafiaja do brutalnej gry przetrwania, w ktorej musza wykonywac misje przeciw nadnaturalnym przeciwnikom.",
  "gintama": "Absurdalna komedia samurajska w alternatywnym Edo, gdzie Gintoki i jego ekipa biora dziwne zlecenia i przypadkiem wpadaja w wielkie konflikty.",
  "gleipnir": "Shuichi potrafi zmieniac sie w dziwna maskotkowa forme bojowa, a spotkanie z Claire wciaga go w mroczna gre o tajemnicze monety.",
  "goblin slayer ii": "Mroczne fantasy o drużynie poszukiwaczy przygod, ktora podejmuje niebezpieczne zlecenia i mierzy sie z konsekwencjami przemocy.",
  "go go loser ranger": "W swiecie pokazowych walk z bohaterami jeden z przegranych zolnierzy postanawia obalic system od srodka.",
  "gto great teacher onizuka": "Byly czlonek gangu zostaje nauczycielem i pomaga problematycznej klasie w najbardziej niekonwencjonalny sposob.",
  "haikyu": "Hinata i Kageyama odbudowuja siatkowkowa druzyne Karasuno, walczac o miejsce na szczycie mimo roznic charakterow.",
  "hajime no ippo the fighting rising": "Ippo kontynuuje kariere bokserska, rozwijajac technike, sile i pewnosc siebie w kolejnych wymagajacych walkach.",
  "happy sugar life": "Pozornie slodka historia o obsesyjnej milosci, sekretach i narastajacym niepokoju ukrytym pod pastelowa powierzchnia.",
  "himouto umaru chan": "Umaru na zewnatrz jest idealna uczennica, a w domu zamienia sie w leniwa fanke gier, przekasek i wygodnego zycia.",
  "hunter x hunter 1999": "Gon wyrusza zostac Hunterem i odnalezc ojca, poznajac przyjaciol, rywali oraz niebezpieczny swiat egzaminow i przygod.",
  "interspecies reviewers": "Prowokacyjna komedia fantasy dla starszej widowni, w ktorej bohaterowie recenzuja lokale i obyczaje roznych fantastycznych ras.",
  "jojos bizarre adventure diamond is unbreakable": "Josuke i mieszkancy Morioh mierza sie z posiadaczami Standow oraz tajemnica serii dziwnych wydarzen w spokojnym miescie.",
  "jujutsu kaisen season 2": "Historia czarownikow jujutsu wraca do przeszlosci Gojo i prowadzi ku dramatycznym wydarzeniom w Shibuyi.",
  "kaguya sama love is war": "Dwoje genialnych uczniow prowadzi psychologiczna wojne milosna, bo zadne z nich nie chce pierwsze wyznac uczuc.",
  "kaiju no 8": "Kafka Hibino marzy o walce z potworami, ale po niespodziewanej przemianie sam staje sie tajna bronia i zagrozeniem zarazem.",
  "kakegurui": "Elitarna szkola rzadzona hazardem staje sie scena ryzykownych pojedynkow, gdy Yumeko wprowadza chaos swoim uzaleznieniem od gry.",
  "kenichi the mightiest disciple": "Slaby uczen trafia do dojo pelnego mistrzow i zaczyna morderczy trening, by obronic siebie oraz bliskich.",
  "kill me baby": "Krótka komedia szkolna o zwyczajnej dziewczynie i jej kolezance-zabojczyni, ktorej codziennosc stale konczy sie chaosem.",
  "kiss x sis": "Komedia romantyczna dla starszej widowni o niezrecznych relacjach rodzenstwa przybranego i przesadzonych szkolnych sytuacjach.",
  "konosuba gods blessing on this wonderful world": "Kazuma trafia do fantasy-swiata z grupa skrajnie problematycznych towarzyszek, zamieniajac przygode w komediowa katastrofe.",
  "kurokos basketball": "Niewidoczny rozgrywajacy Kuroko i utalentowany Kagami walcza z dawnymi geniuszami koszykowki z Pokolenia Cudow.",
  "little witch academia": "Akko trafia do szkoly czarownic, mimo braku magicznych podstaw, i probuje udowodnic, ze marzenia moga dogonic talent.",
  "made in abyss the golden city of the scorching sun": "Riko i jej towarzysze schodza glebiej do Otchlani, odkrywajac piekne, okrutne i bolesne tajemnice zaginionego miasta.",
  "magi the kingdom of magic": "Aladyn rozwija magiczne zdolnosci w Magnostadt, gdy polityka, wojna i magia splataja losy wielu krolestw.",
  "mushoku tensei jobless reincarnation season 2": "Rudeus probuje odbudowac zycie po traumach, uczac sie bliskosci, odpowiedzialnosci i dojrzewania w fantasy-swiecie.",
  "my dress up darling": "Wakana, pasjonat tradycyjnych lalek, pomaga energicznej Marin tworzyc stroje cosplayowe, a ich relacja szybko nabiera ciepla.",
  "naruto": "Naruto Uzumaki, odrzucony chlopak z ukryta sila, trenuje jako ninja, by zdobyc uznanie i zostac Hokage.",
  "no game no life": "Genialne rodzenstwo graczy trafia do swiata, gdzie wszystkie konflikty rozstrzygaja gry, blefy i strategia.",
  "nyan koi": "Chlopak uczulony na koty zostaje przeklety i musi pomagac kotom, by uniknac przemiany, co prowadzi do romantycznego chaosu.",
  "nyaruko san another crawling chaos w": "Parodia mitologii Lovecrafta i komedii romantycznej, w ktorej kosmiczna dziewczyna wprowadza chaos do zycia zwyklego ucznia.",
  "onimai im now your sister": "Mahiro budzi sie w nowym ciele po eksperymencie siostry i musi odnalezc sie w codziennosci, szkole oraz nowych relacjach.",
  "one punch man": "Saitama pokonuje kazdego przeciwnika jednym ciosem, ale w swiecie bohaterow szuka sensu, emocji i godnego wyzwania.",
  "oreshura": "Eita chce spokojnie skupic sie na nauce, lecz falszywy zwiazek i szkolne intrygi wciagaja go w romantyczny wielokat.",
  "oshi no ko": "Historia idolek, aktorstwa i show-biznesu pokazuje blask sceny, mroczne tajemnice branzy oraz pragnienie zemsty.",
  "overlord iii": "Ainz rozwija potege Nazarick, prowadzac polityczne i wojenne gry w swiecie, ktory zaczyna traktowac go jak wladce.",
  "plastic memories": "Tsukasa pracuje przy odzyskiwaniu androidow u kresu zycia, poznajac cene wspomnien, milosci i pozegnania.",
  "psycho pass": "W przyszlosci system ocenia psychike obywateli, a inspektorzy mierza sie z pytaniem, czy algorytm moze decydowac o winie.",
  "radiant season 2": "Seth kontynuuje poszukiwanie Radiantu i poznaje nowe krolestwa, konflikty oraz konsekwencje bycia czarownikiem.",
  "ragna crimson": "Lowca smokow i tajemniczy Crimson lacza sily, by zmienic przeznaczenie i uderzyc w potezne smocze rody.",
  "rascal does not dream of bunny girl senpai": "Sakuta pomaga dziewczynom dotknietym Syndromem Dojrzewania, laczac romans, dramat i nadnaturalne metafory problemow nastolatkow.",
  "re zero starting life in another world season 4": "Subaru, obdarzony powrotem po smierci, walczy o ocalenie bliskich, placac za kazda porazke wspomnieniami i cierpieniem.",
  "rokka braves of the six flowers picture drama": "Fantasy o wybranych bohaterach, ktorzy maja pokonac wielkie zlo, lecz najpierw musza odkryc, kto wsrod nich klamie.",
  "saga of tanya the evil": "Bezwzgledny urzednik odradza sie jako mloda zolnierka w alternatywnej wojnie magicznej i walczy z losem narzuconym przez byt wyzszy.",
  "senpai is an otokonoko": "Delikatna historia szkolna o tozsamosci, zauroczeniu i relacjach trojga uczniow, ktorzy ucza sie mowic szczerze o sobie.",
  "shiki": "W odizolowanej wiosce seria smierci prowadzi do narastajacej paranoi i pytan o granice miedzy ofiara a potworem.",
  "shuffle": "Komedia romantyczna fantasy, w ktorej zwykly uczen zostaje kandydatem do malzenstwa z dziewczynami z niezwyklych swiatow.",
  "slam dunk": "Hanamichi Sakuragi zaczyna grac w koszykowke z powodu zauroczenia, ale szybko odkrywa pasje i ducha zespolowej rywalizacji.",
  "solo leveling": "Sung Jin-Woo, najslabszy lowca, po tajemniczym wydarzeniu zdobywa system rozwoju i zaczyna wspinac sie na szczyt swiata dungeonow.",
  "soul eater": "Uczniowie akademii Shibusena tworza pary broni i meisterow, polujac na zepsute dusze w stylowej mieszance akcji i gotyckiej komedii.",
  "spy x family": "Szpieg, zabojczyni i dziewczynka czytajaca w myslach tworza udawana rodzine, nie znajac nawzajem swoich sekretow.",
  "steins gate": "Grupa znajomych przypadkiem odkrywa sposob ingerencji w czas, co prowadzi do dramatycznej walki o naprawienie konsekwencji.",
  "strike the blood": "Uczen o mocy poteznego wampira i mloda obserwatorka organizacji magicznej zostaja wciagnieci w konflikty nadnaturalnego miasta.",
  "sword art online": "Gracze uwiezieni w wirtualnym MMORPG musza przejsc smiertelna gre, a Kirito walczy o przetrwanie i wolnosc.",
  "sword art online alicization": "Kirito trafia do zaawansowanego wirtualnego swiata Underworld, gdzie granica miedzy sztuczna dusza a czlowiekiem staje sie nieostra.",
  "sword art online ii": "Kirito bada incydenty w grze Gun Gale Online, gdzie wirtualna przemoc zaczyna miec realne konsekwencje.",
  "the apothecary diaries": "Maomao, sprytna zielarka na dworze cesarskim, rozwiazuje medyczne i polityczne zagadki, ukrywajac wlasne ambicje.",
  "the day i became a god": "Dziewczyna oglaszajaca sie boginia pojawia sie u zwyklego ucznia, zapowiadajac koniec swiata i zmieniajac jego lato.",
  "the familiar of zero knight of the twin moons": "Saito i Louise kontynuuja magiczne przygody w swiecie arystokratycznych czarodziejow, romansow i narastajacych konfliktow.",
  "the fruit of grisaia": "Yuuji trafia do zamknietej szkoly dla dziewczyn z trudna przeszloscia i stopniowo odkrywa ich traumy oraz sekrety.",
  "the future diary": "Yukiteru zostaje wciagniety w smiertelna gre posiadaczy dziennikow przyszlosci, gdzie obsesyjna Yuno jest sojuszniczka i zagrozeniem.",
  "the promised neverland": "Dzieci z pozornie idealnego sierocinca odkrywaja przerazajaca prawde o swoim domu i planuja ucieczke.",
  "the rising of the shield hero season 4": "Naofumi, bohater tarczy, walczy o zaufanie i ochrone sojusznikow w swiecie pelnym polityki, zdrad i potworow.",
  "to love ru darkness": "Kosmiczna komedia romantyczna dla starszej widowni, w ktorej szkolne uczucia mieszaja sie z chaosem obcych księżniczek.",
  "tokyo ghoul": "Kaneki po tragicznym spotkaniu staje sie polczlowiekiem i musi przetrwac w brutalnym swiecie ghouli ukrytym pod Tokio.",
  "toradora": "Ryuji i Taiga pomagaja sobie w milosnych planach, lecz ich udawany sojusz przeradza sie w szczera, trudna relacje.",
  "unbreakable machine doll": "Raishin i automaton Yaya biora udzial w magicznym turnieju akademii, szukajac zemsty i prawdy o rodzinnej tragedii.",
  "vinland saga": "Saga o wojownikach, zemscie i dojrzewaniu, w ktorej Thorfinn konfrontuje marzenie o chwale z brutalnoscia wojny.",
  "violet evergarden": "Byla zolnierka uczy sie emocji, piszac listy dla innych ludzi i probujac zrozumiec znaczenie slow o milosci.",
  "welcome to the n h k": "Satou, zamkniety w mieszkaniu hikikomori, mierzy sie z samotnoscia, teoriami spiskowymi i trudna proba powrotu do zycia.",
  "wind breaker": "Haruka Sakura trafia do szkoly znanej z bijatyk, gdzie sila sluzy ochronie miasta i budowaniu druzyny.",
  "wotakoi love is hard for otaku": "Komedia romantyczna o doroslych otaku, ktorzy probuja pogodzic prace, hobby i zwiazki bez udawania kogos innego.",
  "ya boy kongming": "Legendarny strateg odradza sie we wspolczesnym Tokio i wykorzystuje taktyke wojskowa, by pomoc mlodej piosenkarce zdobyc scene.",
  "your lie in april": "Pianista po traumie spotyka pelna energii skrzypaczke, ktora pomaga mu na nowo uslyszec muzyke i emocje.",
  "yu yu hakusho ghostfiles": "Yusuke po niespodziewanej smierci zostaje detektywem swiata duchow, walczac z nadnaturalnymi zagrozeniami i wlasnym charakterem.",
  "zom 100 bucket list of the dead": "Akira po wybuchu zombie apokalipsy odkrywa wolnosc od pracy i tworzy liste rzeczy, ktore chce zrobic przed koncem."
};

function normalize(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function detectVideoId(value) {
  const text = String(value || "");
  const direct = text.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return direct ? direct[1] : "";
}

function thumbnail(track) {
  const id = track.videoId || detectVideoId(track.audioUrl);
  return /^[A-Za-z0-9_-]{11}$/.test(id) ? "https://i.ytimg.com/vi/" + id + "/hqdefault.jpg" : "";
}

function descriptionFor(anime) {
  const text = String(anime || "");
  const candidates = [
    text,
    text.split(" / ")[0],
    text.split(" / ").slice(-1)[0],
    text.replace(/\[[^\]]+\]/g, ""),
    text.replace(/\([^)]*\)/g, "")
  ].map(normalize).filter(Boolean);

  for (const candidate of candidates) {
    if (DESCRIPTIONS[candidate]) return DESCRIPTIONS[candidate];
  }

  for (const candidate of candidates) {
    const key = Object.keys(DESCRIPTIONS).find(function (entry) {
      return candidate.includes(entry) || entry.includes(candidate);
    });
    if (key) return DESCRIPTIONS[key];
  }

  const title = text.split(" / ")[0] || "To anime";
  return title + " to anime z wyrazistym klimatem, rozpoznawalnymi postaciami i openingiem, ktory dobrze sprawdza sie w quizie.";
}

function enrichTrack(track) {
  if (!track || typeof track !== "object") return false;
  let changed = false;
  if (!track.coverUrl) {
    const cover = thumbnail(track);
    if (cover) {
      track.coverUrl = cover;
      changed = true;
    }
  }
  if (!String(track.description || "").trim()) {
    track.description = descriptionFor(track.anime || track.title);
    changed = true;
  }
  return changed;
}

const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
let changedTracks = 0;

Object.values(data).forEach(function (room) {
  ["tracks", "libraryTracks"].forEach(function (listName) {
    if (!Array.isArray(room[listName])) return;
    room[listName].forEach(function (track) {
      if (enrichTrack(track)) changedTracks += 1;
    });
  });
});

const backupFile = DATA_FILE + ".bak-meta-" + new Date().toISOString().replace(/[:.]/g, "-");
fs.copyFileSync(DATA_FILE, backupFile);
fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");

console.log("Zaktualizowano wpisy:", changedTracks);
console.log("Kopia zapasowa:", backupFile);
