import { createClient } from "@supabase/supabase-js";

const URL = "https://scjasqaczdmpgvrdfuon.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjamFzcWFjemRtcGd2cmRmdW9uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTgwMDY2OCwiZXhwIjoyMDk1Mzc2NjY4fQ.s_dXBDdoGLNaqPM-RMIMzznVB0qpni_uKjo0gaB_FXM";

const admin = createClient(URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// title -> summary
const SUMMARIES = {
  // --- Rundreisen ---
  "Südengland":
    "Von Londons Trubel an die sanfte Südküste: weiße Kreidefelsen der Seven Sisters, das maritime Brighton und die grüne Isle of Wight. Weiter zu den Steinkreisen von Stonehenge, dem georgianischen Bath und schließlich nach Cornwall mit Künstlerort St Ives und dem dramatischen Land's End. Eine Reise zwischen Geschichte, Küste und gemütlichen Pubs.",
  "Baltikum":
    "Die drei baltischen Hauptstädte und ihre Natur: das mittelalterliche Tallinn, Estlands Wälder im Lahemaa-Nationalpark und das Seebad Pärnu. Riga mit seinem Jugendstil, die Sandsteinfelsen des Gauja-Tals, das barocke Vilnius, die Wasserburg Trakai und zum Abschluss die Dünen der Kurischen Nehrung. Viel Geschichte, Ostsee und endlose Wälder.",
  "Baskenland":
    "Pintxos, Atlantikbrandung und sattes Grün: Bilbao mit dem Guggenheim, das elegante San Sebastián mit seiner Bucht, das mondäne Biarritz und das charmante Bayonne auf französischer Seite. Dazu die spektakuläre Felseninsel Gaztelugatxe und die ruhige Hauptstadt Vitoria-Gasteiz. Eine kulinarische Küstenreise über die Grenze hinweg.",
  "Rumänien":
    "Karpaten und Transsilvanien: Start in Bukarest, dann das märchenhafte Schloss Peleș, das berühmte Bran (\"Draculas Schloss\") und die Kronstadt Brașov. Das mittelalterliche Sighișoara, die Studentenstadt Cluj-Napoca und als Höhepunkt die kurvenreiche Bergstraße Transfăgărășan. Schlösser, Gebirge und lebendige Altstädte.",
  "Bulgarien":
    "Vom Gebirge ans Schwarze Meer: Sofia mit seinen Kuppeln, das im Rila-Gebirge versteckte Kloster, die antike Altstadt von Plowdiw und das Freilichtmuseum Weliko Tarnowo. Danach die UNESCO-Halbinsel Nessebar, die Hafenstadt Warna und Strandtage am Sonnenstrand. Orthodoxe Kultur, Berge und Küste in einem.",
  "Apulien":
    "Der Absatz des italienischen Stiefels: vom lebendigen Bari über das in die Klippen gebaute Polignano a Mare zu den Trulli von Alberobello und der weißen Stadt Ostuni. Das barocke Lecce, das Ionische Meer bei Gallipoli und das adriatische Otranto. Olivenhaine, türkises Wasser und süditalienische Küche.",
  "Kalabrien":
    "Die wilde Stiefelspitze: Tropea auf seiner Steilküste, die Traumstrände am Capo Vaticano und das an den Fels geklammerte Scilla. Reggio Calabria mit den Bronzestatuen von Riace, das Gelato-Städtchen Pizzo und die Bergwildnis des Aspromonte. Ungeschliffenes, authentisches Süditalien.",
  "Sizilien":
    "Einmal um die größte Mittelmeerinsel: das arabisch-normannische Palermo, das Küstenstädtchen Cefalù und der rauchende Ätna. Das mondäne Taormina, das antike Syrakus, das Barockjuwel Noto, das Tal der Tempel bei Agrigent und die Salinenstadt Trapani. Vulkane, Tempel und eine der besten Küchen Italiens.",
  "Sardinien":
    "Türkis und Granit: von Cagliari über die Strände von Villasimius zur glamourösen Costa Smeralda und dem Archipel von La Maddalena. Das katalanisch geprägte Alghero, das bunte Flussstädtchen Bosa und die bronzezeitliche Nuraghe Su Nuraxi. Karibikartiges Wasser und uralte Kultur.",
  "Korsika":
    "Die Insel der Schönheit, wo die Berge ins Meer stürzen: das napoleonische Ajaccio, die Klippenstadt Bonifacio und die Strände von Porto-Vecchio. Das Bergstädtchen Corte im Inselinneren, das pittoreske Calvi, die wilde Halbinsel Cap Corse und die rotglühenden Felsen der Calanche de Piana.",
  "Georgien":
    "Zwischen Kaukasus und Schwarzem Meer: das quirlige Tiflis mit Schwefelbädern, die alte Königsstadt Mzcheta und die Gergeti-Kirche vor dem Kasbek. Skigebiet Gudauri, die Weinregion um Sighnaghi, Kutaissi mit seinen Höhlen und das mondäne Batumi am Meer. Bergwelt, Wein und herzliche Gastfreundschaft.",
  "Madeira":
    "Ewiger Frühling im Atlantik: die Hauptstadt Funchal, die Steilklippe Cabo Girão und der Gipfel Pico do Arieiro über den Wolken. Die Strohdachhäuser von Santana, die Lavabecken von Porto Moniz, die karge Halbinsel Ponta de São Lourenço und das grüne Seixal. Levada-Wanderungen und dramatische Küsten.",
  "Côte d'Azur":
    "Französische Riviera in Bestform: das bunte Nizza, das Adlerdorf Èze, der Glamour von Monaco und das Künstlerstädtchen Antibes. Das Festival-Cannes, das legendäre Saint-Tropez und als Naturkontrast die türkise Schlucht Gorges du Verdon. Mittelmeer, mondäne Orte und Bergdörfer.",
  "Andalusien & Südküste":
    "Maurisches Erbe und Costa del Sol: Málaga als lebendiger Auftakt, die Alhambra in Granada, die Mezquita von Córdoba und das Flamenco-Sevilla. Das auf einer Schlucht thronende Ronda, die Strände von Nerja und Marbella und die Atlantikstadt Cádiz. Weiße Dörfer, Geschichte und Meer.",
  "Griechenland Inselhopping":
    "Kykladen per Fähre: vom grünen, ursprünglichen Naxos über das klassische Paros und das vulkanische Milos mit seinen Mondlandschafts-Buchten. Das berühmte Santorin mit Caldera-Blick, das junge Ios, das glamouröse Mykonos sowie die ruhigen Geheimtipps Folegandros und Amorgos. Weiße Dörfer, Ägäis und Inselhüpfen.",

  // --- Städtetrips ---
  "Neapel":
    "Pure Lebensfreude am Vesuv: die Altstadt mit der Spaccanapoli, das Castel dell'Ovo am Meer, die unterirdische Stadt und das weltberühmte Archäologische Museum. Dazu ein Abstecher ins versunkene Pompeji. Die Heimat der Pizza, laut, intensiv und unvergesslich.",
  "Nizza":
    "Hauptstadt der Côte d'Azur: die Promenade des Anglais am azurblauen Meer, die bunte Altstadt, der Burgberg mit Panorama und die lebhafte Place Masséna. Mediterranes Flair, Märkte und das beste Tor zur Riviera.",
  "Marseille":
    "Frankreichs raue Hafenmetropole: Notre-Dame de la Garde über der Stadt, der quirlige Alte Hafen, das Künstlerviertel Le Panier und das moderne MuCEM. Vor der Tür die türkisen Calanques. Mittelmeer, Multikulti und echtes Leben.",
  "Toulouse":
    "Die rosa Stadt am Garonne: die romanische Basilika Saint-Sernin, das prächtige Kapitol, die Raumfahrt-Erlebniswelt Cité de l'espace und die Brücke Pont Neuf. Backsteinarchitektur, Studentenflair und südfranzösische Wärme.",
  "Bordeaux":
    "Welthauptstadt des Weins: die Place de la Bourse mit dem spiegelnden Wasserbecken, die interaktive Cité du Vin, die Kathedrale Saint-André und das Grand Théâtre. Elegante Boulevards und natürlich exzellenter Wein.",
  "Paris":
    "Die Klassiker der Lichterstadt: Eiffelturm, Louvre, Notre-Dame, das Künstlerviertel Montmartre mit Sacré-Cœur und der Triumphbogen. Ein erstes Mal oder immer wieder — Paris bleibt Paris.",
  "Valencia":
    "Zukunft und Tradition am Mittelmeer: die futuristische Stadt der Künste und Wissenschaften, die gotische Seidenbörse, die Markthalle und das Altstadtviertel El Carmen. Heimat der Paella, Strände inklusive.",
  "Sevilla":
    "Andalusien in Reinform: der maurische Real Alcázar, die riesige Kathedrale mit Giralda, die monumentale Plaza de España und das moderne Setas. Flamenco, Orangenbäume und das Gassengewirr von Santa Cruz.",
  "Bilbao":
    "Vom Industriehafen zur Kulturstadt: das Guggenheim als Wahrzeichen, die Altstadt Casco Viejo, die Markthalle Ribera, der Hausberg per Standseilbahn und die Schwebefähre von Vizcaya. Dazu erstklassige Pintxos.",
  "Malaga":
    "Costa-del-Sol-Metropole mit Geschichte: die Festung Alcazaba, die Kathedrale, das Picasso-Museum, die Burg Gibralfaro mit Blick und der moderne Hafen Muelle Uno. Sonne, Kunst und Strand.",
  "Porto":
    "Portugals Norden am Douro: die berühmte Buchhandlung Lello, das Ufergassenviertel Ribeira, die Brücke Dom Luís I, der Clérigos-Turm und der Börsenpalast. Portwein-Keller und Azulejo-Fassaden.",
  "Faro":
    "Tor zur Algarve: die ummauerte Altstadt, die Kathedrale, der Stadtstrand und die Knochenkapelle Carmo. Vor der Küste das Naturparadies Ria Formosa mit Lagunen und Inseln.",
  "Danzig":
    "Hanseatische Pracht an der Ostsee: der Lange Markt mit Bürgerhäusern, der mittelalterliche Krahn, die gewaltige Marienkirche und der Neptunbrunnen. Dazu der geschichtsträchtige Ort Westerplatte. Bernstein und Backsteingotik.",
  "Warschau":
    "Phönix aus der Asche: die wiederaufgebaute Altstadt, das Königsschloss, der grüne Łazienki-Park, der monumentale Kulturpalast und das bewegende POLIN-Museum. Eine Stadt voller Geschichte und Aufbruch.",
  "Birmingham":
    "Englands quirlige zweite Stadt: das Einkaufszentrum Bullring, das Museum and Art Gallery, die markante Library of Birmingham, die Schokoladenwelt Cadbury World und die Kanäle am Gas Street Basin. Industrieerbe trifft Moderne.",
  "Leeds":
    "Yorkshires lebendige Metropole: das Royal Armouries Museum, die Leeds Art Gallery, die Klosterruine Kirkstall Abbey, das schicke Trinity-Einkaufsviertel und die viktorianische Corn Exchange. Shopping, Kultur und nordenglischer Charme.",
  "Thessaloniki":
    "Griechenlands lebendiger Norden: der Weiße Turm als Wahrzeichen, die römische Rotonde, die elegante Aristotelous-Platz, die Oberstadt Ano Poli und das Archäologische Museum. Byzanz, Meerpromenade und großartiges Essen.",
  "Marrakesh":
    "Sinnesrausch in Marokko: der Gauklerplatz Jemaa el-Fnaa, der Bahia-Palast, die Koutoubia-Moschee, der Jardin Majorelle und die labyrinthischen Souks der Medina. Farben, Düfte und orientalisches Flair.",
  "Beirut":
    "Paris des Nahen Ostens: die Felsen von Raouché, das Nationalmuseum, die Mohammad-al-Amin-Moschee, die Corniche am Meer und die wiederaufgebauten Beirut Souks. Geschichte, Lebenslust und legendäre Küche.",
};

let updated = 0;
for (const [title, summary] of Object.entries(SUMMARIES)) {
  const { data, error } = await admin
    .from("tp_trips")
    .update({ summary })
    .eq("title", title)
    .select("id");
  if (error) {
    console.log("FAIL " + title + ": " + error.message);
    continue;
  }
  if ((data ?? []).length === 0) {
    console.log("? no trip titled: " + title);
    continue;
  }
  console.log("✓ " + title);
  updated += data.length;
}
console.log("\nUpdated " + updated + " trips.");
