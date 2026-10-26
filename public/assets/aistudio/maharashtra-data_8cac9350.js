/* =========================================================
   GRAMVIKAS — maharashtra-data.js
   State > District > Taluka > Village dataset used to power
   the cascading dropdowns in the registration forms.

   NOTE ON DATA COMPLETENESS
   ---------------------------------------------------------
   - Districts and Talukas below are real administrative
     divisions of Maharashtra.
   - Village lists are a SAMPLE (a handful of well-known
     villages per taluka) — not the full official list.
     Maharashtra has ~40,000+ villages across 36 districts,
     which is impractical to hand-author reliably here.

   TO EXTEND / COMPLETE THIS DATA:
   - Add more districts/talukas/villages by following the
     exact same nested structure below.
   - For an authoritative, complete dataset, pull from:
       • LGD (Local Government Directory): https://lgdirectory.gov.in
       • Census of India village directory / handbooks
       • Maharashtra govt's Mahabhulekh / village codes list
     Then just paste the generated JSON into MAHARASHTRA_DATA.
   ========================================================= */

const MAHARASHTRA_DATA = {
    "Kolhapur": {
        "Karvir": ["Kolhapur", "Uchgaon", "Nigave Dumala", "Kanere", "Vadange"],
        "Panhala": ["Panhala", "Kodoli", "Kotoli", "Pohale", "Asurle"],
        "Hatkanangale": ["Ichalkaranji", "Hatkanangale", "Rukadi", "Peth Vadgaon", "Shirdhon"],
        "Shirol": ["Jaysingpur", "Shirol", "Kurundwad", "Nrusinhawadi", "Datwad"],
        "Gadhinglaj": ["Gadhinglaj", "Ajra Road", "Nesari", "Hitni", "Kadgaon"],
        "Radhanagari": ["Radhanagari", "Kasba Bavda", "Sherewadi", "Kaudal", "Gargoti Road"]
    },

    "Pune": {
        "Haveli": ["Wagholi", "Uruli Kanchan", "Kharadi", "Hadapsar", "Lonikand"],
        "Mulshi": ["Paud", "Lavasa", "Pirangut", "Hinjawadi", "Mulshi"],
        "Maval": ["Vadgaon Maval", "Lonavala Rural", "Kamshet", "Talegaon Dabhade", "Bhaje"],
        "Baramati": ["Baramati", "Malegaon Budruk", "Supe", "Katewadi", "Wadgaon Nimbalkar"],
        "Junnar": ["Junnar", "Narayangaon", "Otur", "Rajur", "Alephata"],
        "Shirur": ["Shirur", "Ranjangaon", "Ghodnadi", "Talegaon Dhamdhere", "Nimgaon"]
    },

    "Satara": {
        "Satara": ["Satara", "Kadegaon", "Degaon", "Godoli", "Kshetra Mahuli"],
        "Karad": ["Karad", "Kale", "Umbraj", "Shenoli", "Rethare Budruk"],
        "Wai": ["Wai", "Bavdhan", "Menavali", "Pasarni", "Kelghar"],
        "Phaltan": ["Phaltan", "Girvi", "Sasewadi", "Tardaf", "Nimbhore"],
        "Mahabaleshwar": ["Mahabaleshwar", "Panchgani", "Bhilar", "Met Indawali", "Godavali"]
    },

    "Sangli": {
        "Miraj": ["Miraj", "Bedag", "Erandoli", "Sangliwadi", "Kavthe Mahankal Road"],
        "Tasgaon": ["Tasgaon", "Manjarde", "Dahiwadi", "Vaste", "Kavathe Ekand"],
        "Walwa": ["Islampur", "Ashta", "Peth", "Bhilawadi", "Kasegaon"],
        "Jat": ["Jat", "Umadi", "Digraj", "Sanjane", "Kolgiri"],
        "Khanapur": ["Vita", "Khanapur", "Bhalewadi", "Palus Road", "Bilashi"]
    },

    "Solapur": {
        "North Solapur": ["Solapur", "Hotgi", "Vinchur", "Kumbhari", "Aadgaon"],
        "South Solapur": ["Akkalkot Road", "Boramani", "Nannaj", "Mandrup", "Wadala"],
        "Pandharpur": ["Pandharpur", "Bhandishegaon", "Loni Budruk", "Kasegaon", "Gopalpur"],
        "Barshi": ["Barshi", "Vairag", "Killari Road", "Pangri", "Sonand"],
        "Akkalkot": ["Akkalkot", "Jewargi Road", "Naikwadi", "Karajgi", "Konheri"]
    },

    "Nashik": {
        "Nashik": ["Nashik Road", "Panchavati", "Deolali", "Adgaon", "Chehedi"],
        "Sinnar": ["Sinnar", "Dodi Budruk", "Musalgaon", "Vadangali", "Bhojapur"],
        "Malegaon": ["Malegaon", "Sayane", "Nimgaon", "Dabhadi", "Zodage"],
        "Niphad": ["Niphad", "Ozar", "Pimpalgaon Baswant", "Lasalgaon", "Chandori"],
        "Igatpuri": ["Igatpuri", "Ghoti", "Talegaon", "Vaitarna", "Kasara"]
    },

    "Ahmednagar": {
        "Ahmednagar": ["Ahmednagar", "Bhingar", "Savedi", "Vambori", "Nagapur"],
        "Shrirampur": ["Shrirampur", "Belapur", "Harigaon", "Dhamangaon", "Nimon"],
        "Sangamner": ["Sangamner", "Ghargaon", "Ashvi", "Rahata Road", "Talegaon"],
        "Kopargaon": ["Kopargaon", "Kokamthan", "Sonai", "Pohegaon", "Chas"],
        "Shrigonda": ["Shrigonda", "Belwandi", "Pargaon", "Devade", "Wadgaon"]
    },

    "Nagpur": {
        "Nagpur Urban": ["Nagpur", "Jaripatka", "Wathoda", "Kalamna", "Besa"],
        "Nagpur Rural": ["Kamptee", "Wadi", "Butibori", "Kanhan", "Mouda"],
        "Hingna": ["Hingna", "Wanadongri", "Digdoh", "Isasani", "Bharatwada"],
        "Kamptee": ["Kamptee", "Kondhali", "Yerkheda", "Mahalgaon", "Girad"],
        "Ramtek": ["Ramtek", "Mansar", "Khindsi", "Salai", "Umri"]
    },

    "Aurangabad (Chhatrapati Sambhajinagar)": {
        "Aurangabad": ["Chhatrapati Sambhajinagar", "Padegaon", "Satara Parisar", "Chikalthana", "Waluj"],
        "Paithan": ["Paithan", "Bidkin", "Dhorkin", "Bindusara", "Tondoli"],
        "Gangapur": ["Gangapur", "Wadwali", "Andhalgaon", "Fardapur Road", "Dawalwadi"],
        "Vaijapur": ["Vaijapur", "Shivur", "Rotegaon", "Lasur Station", "Manur"],
        "Sillod": ["Sillod", "Anandnagar", "Golegaon", "Bhambora", "Amba"]
    },

    "Thane": {
        "Thane": ["Thane", "Kalwa", "Mumbra", "Diva", "Kolshet"],
        "Kalyan": ["Kalyan", "Dombivli", "Titwala", "Vasind", "Ambivli"],
        "Bhiwandi": ["Bhiwandi", "Anjur", "Padgha", "Kongaon", "Purna"],
        "Murbad": ["Murbad", "Malshej Ghat Road", "Tokawade", "Dahagaon", "Sawarne"],
        "Shahapur": ["Shahapur", "Kinhavali", "Asangaon", "Vashind", "Doltha"]
    },

    "Mumbai City": {
        "Mumbai City": ["Colaba", "Fort", "Girgaon", "Dadar", "Mahim"]
    },

    "Mumbai Suburban": {
        "Andheri": ["Andheri East", "Andheri West", "Versova", "Jogeshwari", "Sahar"],
        "Borivali": ["Borivali East", "Borivali West", "Kandivali", "Dahisar", "Gorai"],
        "Kurla": ["Kurla", "Chembur", "Ghatkopar", "Vidyavihar", "Tilak Nagar"]
    }
};

/* All Maharashtra districts (for the State→District dropdown).
   Districts not yet in MAHARASHTRA_DATA above will show up in
   the dropdown but have no taluka/village data wired in yet —
   add them to MAHARASHTRA_DATA using the same structure. */
const MAHARASHTRA_ALL_DISTRICTS = [
    "Ahmednagar", "Akola", "Amravati", "Aurangabad (Chhatrapati Sambhajinagar)",
    "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gadchiroli",
    "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur",
    "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded", "Nandurbar",
    "Nashik", "Osmanabad (Dharashiv)", "Palghar", "Parbhani", "Pune",
    "Raigad", "Ratnagiri", "Sangli", "Satara", "Sindhudurg", "Solapur",
    "Thane", "Wardha", "Washim", "Yavatmal"
];
