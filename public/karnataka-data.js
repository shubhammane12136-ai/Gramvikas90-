/* =========================================================
   GRAMVIKAS — karnataka-data.js
   State > District > Taluk > Village dataset used to power
   the cascading dropdowns in the registration forms.

   NOTE ON DATA COMPLETENESS
   ---------------------------------------------------------
   - Districts and Taluks below are real administrative
     divisions of Karnataka.
   - Village lists are a SAMPLE (a handful of well-known
     villages per taluk) — not the full official list.
     Karnataka has tens of thousands of villages across its
     districts, which is impractical to hand-author reliably
     here.

   TO EXTEND / COMPLETE THIS DATA:
   - Add more districts/taluks/villages by following the
     exact same nested structure below.
   - For an authoritative, complete dataset, pull from:
       • LGD (Local Government Directory): https://lgdirectory.gov.in
       • Census of India village directory / handbooks
       • Karnataka govt's Bhoomi / village codes list
     Then just paste the generated JSON into KARNATAKA_DATA.
   ========================================================= */

const KARNATAKA_DATA = {
    "Bengaluru Urban": {
        "Bengaluru North": ["Yelahanka", "Hebbal", "Jakkur", "Byatarayanapura", "Vidyaranyapura"],
        "Bengaluru South": ["Jayanagar", "Banashankari", "Bommanahalli", "Uttarahalli", "Gottigere"],
        "Bengaluru East": ["Whitefield", "K R Puram", "Mahadevapura", "Hoodi", "Varthur"],
        "Anekal": ["Anekal", "Attibele", "Jigani", "Sarjapura", "Bannerghatta"]
    },

    "Mysuru": {
        "Mysuru": ["Mysuru", "Jayapura", "Kadakola", "Ilawala", "Hebbal"],
        "Nanjangud": ["Nanjangud", "Hullahalli", "Tagadur", "Bilikere", "Debur"],
        "Hunsur": ["Hunsur", "Bilikere Road", "Ravandur", "Bilagere", "Gavadagere"],
        "T. Narasipura": ["Tirumakudalu Narasipura", "Talakadu", "Bannur", "Suttur", "Hampapura"]
    },

    "Dakshina Kannada": {
        "Mangaluru": ["Mangaluru", "Ullal", "Bantwal Road", "Surathkal", "Kavoor"],
        "Bantwal": ["Bantwal", "Vittal", "Kariangala", "Sajipanadu", "Puthige"],
        "Puttur": ["Puttur", "Uppinangady", "Kabaka", "Kedila", "Ariyadka"],
        "Belthangady": ["Belthangady", "Dharmasthala", "Ujire", "Venoor", "Guruvayanakere"]
    },

    "Udupi": {
        "Udupi": ["Udupi", "Manipal", "Malpe", "Kaup", "Brahmavara"],
        "Kundapura": ["Kundapura", "Gangolli", "Koteshwara", "Baindoor", "Hemmadi"],
        "Karkala": ["Karkala", "Hebri", "Mudabidri Road", "Bailoor", "Ajekar"]
    },

    "Belagavi": {
        "Belagavi": ["Belagavi", "Kangrali", "Angol", "Halaga", "Vantmuri"],
        "Chikodi": ["Chikodi", "Sadalga", "Nippani", "Kognoli", "Ankali"],
        "Gokak": ["Gokak", "Mudalgi", "Ghataprabha", "Kulgod", "Hukkeri Road"],
        "Athani": ["Athani", "Ugar Khurd", "Kagwad", "Kokatnur", "Shedbal"]
    },

    "Hubballi-Dharwad": {
        "Hubballi": ["Hubballi", "Gokul Road", "Vidyanagar", "Unkal", "Rayapur"],
        "Dharwad": ["Dharwad", "Kalghatgi Road", "Amargol", "Katnur", "Kelageri"]
    },

    "Kalaburagi": {
        "Kalaburagi": ["Kalaburagi", "Sedam Road", "Aland Road", "Wadi", "Farhatabad"],
        "Chittapur": ["Chittapur", "Wadi", "Kalgi", "Sanganakallur", "Chincholi Road"],
        "Sedam": ["Sedam", "Kamalapur", "Malkhed", "Motakpalli", "Yenegur"]
    },

    "Ballari": {
        "Ballari": ["Ballari", "Kamalapur", "Kudligi Road", "Torangallu", "Kurugodu"],
        "Hospet": ["Hosapete", "Kamalapura", "Kampli Road", "Munirabad", "Malapanagudi"],
        "Sandur": ["Sandur", "Toranagallu", "Narihalla", "Yeshwantnagar", "Subbarayanahalli"]
    },

    "Shivamogga": {
        "Shivamogga": ["Shivamogga", "Gopala", "Holalur", "Kote", "Chandragutti Road"],
        "Bhadravati": ["Bhadravathi", "Mahalingapura", "Kere Vaddar Hatti", "Holehonnur", "Anavatti"],
        "Sagara": ["Sagara", "Jog Falls", "Anandapuram", "Talaguppa", "Avinahalli"]
    },

    "Tumakuru": {
        "Tumakuru": ["Tumakuru", "Battuvanahalli", "Gubbi Road", "Antharasanahalli", "Kyathsandra"],
        "Tiptur": ["Tiptur", "Nonavinakere", "Halkurke", "Konehalli", "Banasandra"],
        "Sira": ["Sira", "Hagalavadi", "Bukkapatna", "Agasarahalli", "Bhaktarahalli"]
    },

    "Bagalkot": {
        "Bagalkot": ["Bagalkot", "Ilkal Road", "Guledgudda Road", "Sasalatti", "Kalkeri"],
        "Jamkhandi": ["Jamkhandi", "Terdal", "Savalgi", "Almatti", "Rabkavi Banhatti"]
    },

    "Vijayapura": {
        "Vijayapura": ["Vijayapura", "Almel Road", "Basavana Bagewadi Road", "Talikoti Road", "Managuli"],
        "Indi": ["Indi", "Chadchan", "Zalki", "Lachyan", "Salotgi"]
    }
};

/* All Karnataka districts (for the State→District dropdown).
   Districts not yet in KARNATAKA_DATA above will show up in
   the dropdown but have no taluk/village data wired in yet —
   add them to KARNATAKA_DATA using the same structure. */
const KARNATAKA_ALL_DISTRICTS = [
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban",
    "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga",
    "Dakshina Kannada", "Davanagere", "Dharwad", "Gadag", "Hassan",
    "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal",
    "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga",
    "Tumakuru", "Udupi", "Uttara Kannada", "Vijayapura", "Vijayanagara",
    "Yadgir", "Hubballi-Dharwad"
];
