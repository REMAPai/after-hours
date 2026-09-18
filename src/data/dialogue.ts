// ALL text lines live here, keyed by ghost/beat (spec §6.2, §26 writing guide).
// Verbal tics: Marcus incident-report fragments; Priya meeting jargon; Ines trails off;
// Gary one-word justice; Kit critique vocabulary; Beatriz precise numbers; Doris small talk,
// calls everyone "love"; Sam plain, short, kind. Building: politely ominous -> warm.

export const D = {
  building: {
    coldOpen: 'Good evening, New Hire. The building is closed. You may leave when the work is done.',
    frag1: 'One task complete. The building thanks you. The building is… surprised, honestly.',
    frag3: 'Three. You are exceeding expectations. Expectations were, admittedly, filed in 2011.',
    frag5: 'Five. The building notes that the lights feel… lighter. The building did not adjust them.',
    preRooftop: 'The stairwell is open. The air up there is old, but it kept the view for you.',
    finaleClose: 'Goodnight. See you tomorrow.',
    postCredits: 'same time tomorrow?',
    liftDead: 'The lift is unavailable. The lift has always been unavailable. Please disregard the memory of it working.',
    workUnknown: 'Clarification: "the work" is not yours. It belongs to the ones who stayed. Ask the desk.'
  },

  doris: {
    greet: [
      'Oh! A face! A whole face, with a person attached. Come here, love.',
      'Back again? The lobby missed you. The lobby is me. I missed you.',
      'You look like you could use a mint. The mints expired in 2014. Character building.'
    ],
    intro: [
      "Welcome to Remap, love. I'm Doris — front desk, since 2009. Before you ask: yes, I know I'm see-through. It's slimming.",
      "The building's locked us in until 'the work is done.' Not YOUR work, love — theirs. The ones who stayed past closing time. Forever, as it turns out.",
      'Every one of them is stuck on one little thing. Finish it for them, they pop off like champagne. You collect the sparkly bit. Seven sparkly bits open that lift.',
      "Start with the Server Room or the Meeting Room, down the corridor. Marcus is the twitchy one; the Meeting Room is the loud one. You'll hear it."
    ],
    jokes: [
      "Visitor badge? Oh you poor thing. IT's ticket queue survived them, you know.",
      "The building isn't haunted, it's just *committed*.",
      "I'd offer you tea, but the kettle unionised in 2016 and we haven't spoken since.",
      'The plant by the copier died in 2013. We keep watering the memory of it.',
      "Don't mind the flickering lights, love. That's just the building thinking.",
      'We had a fire drill once. The fire was lovely. Very punctual. Unlike Gary.',
      'The photocopier prints things nobody sent. We call it "creative ownership."',
      "You're the first visitor since the auditor. He's fine. Probably. We never checked.",
      'I answered a phone in 2019. Wrong number. Still the highlight of the decade.',
      "Take the corridor slowly, love. It likes to be appreciated.",
      'Employee of the Month is decided by the building now. It always picks the boiler.'
    ],
    unlocks: {
      archive: 'Ooh, the Archive just unlocked, love! Ines is in there. Soft as a library whisper. Do NOT tell her the docs are "fine". She knows what "fine" means.',
      breakDesign: 'Break Room and Design Studio are open! Gary guards a fridge and Kit guards their own taste. Both losing battles, historically.',
      finance: "Finance Corner's open, love. Beatriz is lovely. Serene, even. Just — whatever you do — don't say 'reconciliation' without a duck to hand.",
      rooftop: 'The stairwell clicked open, love. Rooftop. Someone up there has been waiting longer than any of us. Be kind. He will be.',
      lift: 'The lift is humming, love! Seven sparkly bits! Come see me at the desk before you go — I want a proper goodbye.'
    },
    finale: [
      "Look at you. Three weeks in and you've closed more tickets than IT has in a decade.",
      "Front desk's covered, I think. You'll do.",
      'Go on, love. Badge out. And this time, someone will say goodnight back.'
    ],
    echo: 'The desk bell rings once, softly, on its own. Someone is still saying hello.'
  },

  marcus: {
    greet: [
      '14:02 — anomaly. Human detected. Non-ghost. Logging.',
      'Status: restarting Server 6. Status: restarting Server 6. Status: see previous status.',
      'Do not touch the racks. Racks are load-bearing. Emotionally.'
    ],
    task: [
      "Server 6 is down. Not DOWN down. It's not down if I keep restarting it. That's the rule. That's… is that the rule?",
      'Six years of power cycles. The cables came loose in the incident. INCIDENT-4401. I can see the ports. I can not… choose. Choosing causes outages.'
    ],
    hints: [
      'The labels… the labels never lie. Mostly. Read the cable, read the port.',
      'Hold a cable up. The right port… glows. New feature. Undocumented, obviously.'
    ],
    wrong: [
      'NO— sorry. Sorry. Spark contained. Retro: we do not plug POWER into feelings.',
      '15:00 — incident within incident. Nested incidents. Please stop. Please continue. Both.',
      'That port has not accepted that cable since the Obama administration.'
    ],
    mystery: 'The MYSTERY cable. DO NOT UNPLUG, it says. You plugged it IN. Bold. Somewhere, a machine just woke up… hungry.',
    solve: 'Green. Steady green. All ports green. Fans nominal. Uptime: beginning… now.',
    release: [
      'Pager says RESOLVED. Ha. HA. Six years and it says RESOLVED.',
      'Handover notes: fans are good. Green is good. Tell the next on-call… there is no next on-call.',
      'Six years of on-call… tell them— tell them the uptime was *worth it*.'
    ],
    echo: 'The pager on the floor blinks once: NO NEW INCIDENTS. It sounds relieved.'
  },

  priya: {
    greet: [
      "Great, you're here. We're just waiting on a few people. Since 2016.",
      "Let's take that offline. Whatever it was. Offline. Please.",
      'Can everyone see my screen? …Nobody has ever seen my screen.'
    ],
    task: [
      "This is the Q3 sync. Recurring. VERY recurring. We can't close without covering every agenda item, and the final item was never written on the board.",
      "It's in the room somewhere. Everything is always written down somewhere. Find the final item and we can — oh, I can't believe I'm saying this — *end the meeting*."
    ],
    hints: [
      "It's written down somewhere. Everything is always written down somewhere.",
      'One of the notes is glinting. Glinting is not on the agenda, so it must be important.'
    ],
    decoys: [
      'Item 9: circle back on the circling back.',
      'Item 12: alignment on the misalignment (pre-align first).',
      'Item 23: biscuit budget — table until Q4. The biscuits went stale in Q1. Of 2017.',
      'Item 40: whose mug is the "WORLD\'S OKAYEST" mug? (Sensitive. Handle offline.)'
    ],
    finalNote: 'AOB: someone say "no blockers" and GO HOME.',
    solvePrompt: 'You found it?! Read it. READ IT OUT.',
    solve: 'No blockers. NO BLOCKERS! Meeting adjourned — MEETING ADJOURNED!',
    release: [
      'Ten years. Ten YEARS, and it was one agenda item.',
      'Classic. Absolutely classic.',
      "Minutes: meeting ended. Action items: none. Next steps: lunch. FOREVER lunch.",
      'Thank you. Genuinely. This one goes in the retro as a *win*.'
    ],
    echo: 'The projector hums to a slide that just says: ADJOURNED. Someone drew a sun on it.'
  },

  ines: {
    greet: [
      "Oh. Hello. Sorry — I'll keep my voice down. Habit. It's… it's fine.",
      'Four hundred pages. Indexed. Cross-referenced. It\'s fine. Nobody reads the docs. It\'s fine.',
      "You don't have to stay. The dust and I have an understanding."
    ],
    task: [
      "There's nothing to fix, really. I wrote the onboarding guide. Version fourteen. FINAL final. The second final. It's… on a shelf. Somewhere. With the others.",
      "You could… no. It's silly. Nobody reads page one, even. It's fine."
    ],
    hints: [
      'v14. FINAL final. The *second* final.',
      'The decoys have gone quiet. Only one binder still wants to be found.'
    ],
    wrongBinder: "That's… not it. That one's mostly minutes. Unminuted minutes.",
    foundPrompt: 'You… found it. That\'s the one. You don\'t have to— you\'re taking it to the desk?',
    // The emotional pivot (spec §8.4): 7 sincere lines, zero jokes.
    reading: [
      'Page one. Welcome. You were hired because someone saw something in you — trust their judgement on the days you can\'t trust your own.',
      'Ask the question. The one you think is too obvious. It has been quietly blocking three other people all week.',
      'Write things down as if the next person matters, because they do, and one day the next person will be you, tired, at 6pm.',
      'Nobody remembers a perfect quarter. Everyone remembers who helped them in a bad one.',
      'Go home. The work will keep. It keeps better than you do.',
      'When you don\'t know who to ask — ask the person who wrote the guide. They wrote it because they wanted to be asked.',
      'You belong here. That feeling that you don\'t is just the badge printer running late.'
    ],
    solve: 'Someone read it. Page one. That\'s… that\'s all it ever needed.',
    release: [
      'Keep the pen. It\'s a good pen. It never once ran out before the thought did.',
      'Tell whoever writes the next version… fifteen is a good number. No "final". Just fifteen.',
      'Thank you for reading. Thank you for… reading.'
    ],
    echo: 'The lamp stays warm over the open binder. Page one lies flat, like it finally exhaled.'
  },

  gary: {
    greet: [
      'Fridge.', 'You see it too. Good. Witness.',
      'Somebody. Took. The sandwich. 2014. Unlabelled, yes. Irrelevant. It was MINE.'
    ],
    task: [
      'One sandwich. Cheese and justice. Taken. Every day I remake it. Every day: gone.',
      'Label maker. Counter. Make it RIGHT this time. Make the label… undeniable.'
    ],
    hints: [
      'Labels have power. Weak labels invite theft. Strong labels… testify.',
      'Think: who must the label convince? Everyone. Including the dead.'
    ],
    rejections: [
      '"SANDWICH". Descriptive. Useless. The thief KNOWS it\'s a sandwich. That\'s WHY.',
      '"GARY\'S". Which Gary? There were three Garys. Two live. One hungers. Be specific.',
      '"FREE FOOD"?! Are you — are you working WITH the thief?'
    ],
    solve: 'Yes. YES. Legally airtight. Spiritually binding. No jury of colleagues would dare.',
    release: [
      'Justice. Cold, refrigerated justice.',
      'The sandwich stays. The label protects it now. Forever.',
      'Tell the break room… Gary ate. Gary finally ate.'
    ],
    echo: 'The fridge hums contentedly. Inside, one sandwich rests in state, labelled like a monument.'
  },

  kit: {
    greet: [
      'Careful where you stand — you\'re blocking the light. The light is doing better work than I am.',
      'The kerning haunts me. *I* haunt *me*.',
      'One more pass. It always needs one more pass. I have been "one more pass" since the iPhone 6.'
    ],
    task: [
      'Six candidates on the wall. One of them is the logo. THE logo. The others are… learning experiences.',
      'I can\'t choose. Choosing means stopping. Look at them. Tell me which one survives.'
    ],
    hints: [
      'Simplicity. It\'s the one I kept walking past.',
      'The pretenders have dimmed. Even the wall agrees now.'
    ],
    critiques: [
      'Comic Sans. I was going through something.',
      'This one\'s upside down. For eight years I told people it was "disruptive".',
      'Gradient of six greens. Six. It looks like a lizard\'s CV.',
      'That is just a map with "re" written on it. Literal. Cowardly. I loved it once.',
      'The 3D bevel-emboss era. We do not speak of the 3D bevel-emboss era.'
    ],
    choosePrompt: 'This one? You\'re sure. Say it like you mean it.',
    solve: 'This one. It was always this one.',
    release: [
      '…there. One millimetre. Now it\'s straight. Now it\'s finished.',
      'Ship it. Ship it everywhere. Lobby, lift, mugs — tastefully on the mugs.',
      'Tell the next designer: done is a design decision. The best one.'
    ],
    echo: 'The chosen frame hangs perfectly level. Every other frame has quietly accepted this.'
  },

  beatriz: {
    greet: [
      'Good evening. You are 7 years, 4 months and 11 days late for your appointment. No matter.',
      'Everything balances. Everything except *the duck*.',
      'Please do not touch the paper mountains. They are load-bearing. Fiscally.'
    ],
    taskNoDuck: [
      'One receipt, from March 2016. £4.99. Item: unknown. Vendor: the vending machine. It has never reconciled.',
      'The machine only dispenses what it owes. Something rattles in it to this day — ask the server room why. Machines listen to machines.'
    ],
    taskDuck: [
      'One receipt, from March 2016. £4.99. Item: unknown. And you… you are carrying something. Present it, please. Slowly.'
    ],
    hints: [
      'The vending machine in the break room still holds its debt. Something must make it… let go. The servers know.',
      'Bring me what the machine dispenses. I will do the rest. I have been ready for 9 years.'
    ],
    scan: 'Scanning… one rubber duck. Cross-referencing March 2016… vendor match. Amount match. £4.99. Item: RUBBER DUCK — MORALE (ESSENTIAL).',
    solve: 'The books close. To the penny. To the *penny*.',
    release: [
      'Balanced. Every line. Every year.',
      'Tell finance… the duck was *always* essential.',
      'Keep it. Assets that boost morale should circulate. That is now policy.'
    ],
    echo: 'The projected spreadsheet reads 0.00 in every cell. One cell, faintly, shows a duck.'
  },

  sam: {
    arrive: [
      'Evening. Pull up a deckchair — the city does its best work about now.',
      'You\'re the new one. Three weeks. I know. Doris talks, even to the wind.',
      'I started this place. Two desks, one kettle, a map on the wall we kept redrawing. Someone said "we should just… re-map it". We laughed. It stuck.',
      'You met them all, then. Marcus, Priya, Ines. Gary and his sandwich. Kit. Beatriz. Do you know what they had in common?',
      'They cared past closing time. That\'s the whole secret, and the whole problem.',
      'The building never trapped anyone. I know how it sounds. But it just wanted the work finished. Work that\'s finished can be put down.',
      'They finished. You finished it *with* them. So this last piece isn\'t a puzzle. It\'s a gift.',
      'One more thing. Doris has been at that desk longer than any of us. Go badge out. She\'s waiting to say goodnight.'
    ],
    echo: 'A telescope cap sits on the ledge. Through the lens: the city, and every light someone left on for someone else.'
  },

  // Toast lines: flavour inspects (≥3 per zone, spec §6.1/§11).
  toasts: {
    lobby: {
      mints: 'A bowl of mints. Best before: optimism.',
      magazines: '"10 Office Trends for 2019." All ten are ghosts now too.',
      waterCooler: 'The water cooler is empty. The conversation, somehow, lingers.',
      clock: 'The wall clock is stopped at 6:47. It has chosen its favourite minute.',
      mat: 'The mat says WEL OME. The C clocked out years ago.',
      logbook: 'Visitor log, last entry 2019: "auditor — IN". There is no "OUT".',
      vending: 'The vending machine watches you leave.',
      turnstile: 'A turnstile. It spins freely now. It has nothing left to prove.'
    },
    portraits: {
      doris: 'Employee of the Month, June 2009: DORIS. "For answering a phone that hadn\'t rung yet."',
      marcus: 'Employee of the Month, Oct 2018: MARCUS. "For 99.99% uptime. The 0.01% is why he\'s still here."',
      priya: 'Employee of the Month, Mar 2016: PRIYA. "For running a meeting that nearly ended."',
      ines: 'Employee of the Month, Jan 2015: INES. "For documentation above and beyond. And beyond."',
      gary: 'Employee of the Month, Aug 2014: GARY. "For bringing his own lunch. Every day. Twice, on the bad day."',
      kit: 'Employee of the Month, Feb 2017: KIT. "For 41 logo revisions. The board misses revision 12."',
      beatriz: 'Employee of the Month, Apr 2016: BEATRIZ. "For finding £0.01. It took three weeks. Worth it."',
      sam: 'Founder\'s portrait. Someone has drawn a small crown on it in pencil. The frame allows it.'
    },
    corridor: {
      poster1: 'Poster: "TEAMWORK." A stock photo of eight hands. None of them match.',
      poster2: 'Poster: "SYNERGY?" The question mark was added later. In pen. Angrily.',
      poster3: 'Poster: it is just the word "STAY."',
      plant: 'The plant died years ago. The note says "please water me". Someone still does.',
      wetFloor: 'Wet-floor sign. Someone drew a little ghost on it. Prophetic.',
      extinguisher: 'Fire extinguisher, last inspected before the fires of ambition burned out.',
      chair: 'An office chair, rolling gently. There is nobody in it. There is a story in it.',
      fireMap: 'A fire-evacuation map. "YOU ARE HERE." It has never once been wrong.',
      copier: 'The photocopier hums. Its last print: "HELP ME — no toner". Deeply relatable.',
      ceiling: 'A missing ceiling tile. A cable dangles like the building forgot mid-sentence.'
    },
    noticeboard: [
      'FOR SALE: exercise bike, never used. Collect from desk 12. Desk 12 no longer exists.',
      'LOST: one stapler, red. REWARD: knowing where the stapler is.',
      'Five-a-side Thursdays! (cancelled)',
      'Reminder: the kitchen fridge is a SHARED SPACE (see: Incident 2014)',
      'Book club reads "Who Moved My Cheese" for the 11th consecutive quarter.',
      'IT NOTICE: do not turn anything off. ANYTHING.',
      'Yoga at lunch, Studio 2. Studio 2 was converted to storage in 2015. Breathe anyway.',
      'CAKE IN THE KITCHEN (2019). The plate remains. A monument.',
      'Parking permit renewals due. The car park was sold. Renew anyway.',
      'Quarterly town hall: postponed to a future quarter. Any quarter. A quarter of something.',
      'New starters: collect your badge from IT. (IT collects badges from no one.)',
      'Please do not feed the plant. It is beyond food now.'
    ],
    serverRoom: {
      whiteboard: 'Whiteboard: "DAYS SINCE INCIDENT: 0". The zero is laminated.',
      cans: 'Six energy drink cans arranged like a shrine. The shrine is load-bearing.',
      floorTile: 'A raised floor tile, lifted. Below: cables, dust, and one brave sticky note: "here be dragons".',
      kvm: 'A KVM cart. The monitor shows a login screen for a server that no longer exists. It waits.',
      fan: 'A desk fan pointed at Server 6. Emotional support airflow.'
    },
    meetingRoom: {
      parkingLot: 'Flipchart: "PARKING LOT". 34 items. Nothing has ever left the parking lot.',
      tv: 'Wall TV: NO SIGNAL. The most honest presenter this room ever had.',
      mugs: 'Ten mugs. One says WORLD\'S OKAYEST. It is the cleanest one.',
      clock: 'The wall clock ticks once every four seconds. Meetings dilate time. Science.',
      biscuitTin: 'The biscuit tin. Empty since Q1 2017 — except for one note. Wait— a note!'
    },
    archive: {
      typewriter: 'A typewriter. Someone typed "v1" on a page and then, wisely, stopped.',
      crossStitch: 'A framed cross-stitch: "DOCS ARE LOVE". Every stitch is perfectly indexed.',
      ladder: 'A rolling ladder. It glides an inch when you look away. Helpful, or haunted. Both.',
      cardIndex: 'A card-index cabinet. The drawer labelled "MISC" is the fullest. It always is.',
      dust: 'Dust motes drift in your torchlight like the world\'s slowest confetti.'
    },
    breakRoom: {
      microwave: 'The microwave clock says 88:88. It has seen things. It refuses to say when.',
      banner: 'A banner: "HAPPY BIRTHD". The AY fell behind the fridge in 2015. Nobody has ever had a full birthday since.',
      coffee: 'Coffee machine: "OUT OF ORDER (2017)". The note is laminated. Hope was not.',
      kettle: 'The kettle. It unionised. Doris was serious.',
      cakeBox: 'A cake box, empty. Inside, in icing residue: the ghost of the word "FAREWELL".',
      olive: 'A single olive in the fridge, in its own tupperware, labelled "DO NOT". Do not what? Do NOT.',
      q2: 'Galaxy-glowing tupperware labelled "DO NOT OPEN — Q2". It is warm. It hums in a minor key.'
    },
    designStudio: {
      plant: 'A plant. It\'s ALIVE. The first living thing in the building. Kit waters it with critique.',
      mannequin: 'A mannequin in a branded hoodie. The kerning on the hoodie is, admittedly, perfect.',
      pottery: 'The pottery shelf of failed ideas. One mug has three handles. "For stakeholders," says the note.',
      swatches: 'A pantone wall. One swatch is labelled "the good orange". It is circled 14 times.',
      lightbox: 'A light-box with a logo sketch mid-trace. Even the tracing paper looks tired.'
    },
    financeCorner: {
      shredder: 'The shredder. Full. Nobody has emptied it since the Great Reconciliation Scare.',
      cert: 'Framed certificate: "AUDIT READY". The frame is crooked. The audit never came.',
      duckOutline: 'A rubber-duck-shaped outline drawn on the desk, like a tiny crime scene. Something belongs here.',
      paper: 'A mountain of paper. Geologically, this layer dates to the invoice era.',
      tenkey: 'A ten-key calculator. The 9 is worn smooth. £4.99 has left its mark.'
    },
    rooftop: {
      telescope: 'An old telescope, pointed not at the stars but at the office across the street. Know your competitors.',
      cooler: 'A cooler. Inside: two sodas and a note — "for the night the work is done".',
      stringLights: 'String lights someone hung years ago. Half still glow. The stubborn half.',
      acUnit: 'An AC unit the size of a small car. It exhales like it pays rent.',
      deckchair: 'A deckchair, angled exactly at the skyline\'s best side.'
    },
    lift: {
      cert: 'Lift inspection certificate: "last inspected: never".',
      phone: 'The emergency phone. It has one button. The button says "DORIS".',
      mirror: 'The lift mirror. You look tired. You look *done*, in the best way.'
    },
    misc: {
      duckGet: 'The vending machine dispenses one RUBBER DUCK. It has been waiting since 2016. It squeaks in gratitude.',
      duckHint: 'Something rattles inside the vending machine. A coil is jammed — the machines know how to fix it.',
      penGet: "Ines's pen. Your handwriting will never be the same. It will be *better*.",
      fridgeItems: 'A shelf of horrors: the Q2 tupperware, a single olive, a houseplant. And one unlabelled sandwich, radiating grievance.'
    }
  },

  ui: {
    objectives: {
      findWork: "Find out what 'the work' is.",
      meetDoris: 'Talk to the receptionist at the lobby desk.',
      firstRooms: 'Help a ghost: Server Room or Meeting Room.',
      server: 'Find whoever keeps restarting Server 6.',
      serverCables: 'Reconnect the four cables on Server 6.',
      meeting: 'Someone has to end the Eternal Standup.',
      meetingNotes: 'Find the final agenda item (5 hiding spots).',
      meetingSay: 'Take the note to Priya and end the meeting.',
      archive: 'The Archive is open. Someone quiet is inside.',
      archiveBinder: 'Find THE ONBOARDING GUIDE v14 FINAL final(2).',
      archiveRead: "Take the binder to Ines's desk and read page one.",
      breakRoom: 'The Break Room is open. Someone is staring at a fridge.',
      sandwich: 'Label the sandwich. Properly. Legally. Spiritually.',
      design: 'The Design Studio is open. Someone is mid-critique.',
      designChoose: 'Find the real Remap logo among the six frames.',
      finance: 'Finance Corner is open. Bring exact change.',
      duckRoute: 'Beatriz needs what the vending machine owes. (Server room → break room.)',
      duckPresent: 'Present the duck to Beatriz.',
      rooftop: 'The stairwell is open. Go up.',
      badgeOut: 'Go badge out. Doris is waiting to say goodnight.',
      lift: 'The lift is open. Time to go home.'
    },
    // Plain-language directions shown under the objective (spec: never let anyone get lost)
    where: {
      serverRoom: 'Down the corridor — far end, last door on the LEFT. Follow the orange marker.',
      meetingRoom: 'Down the corridor — far end, last door on the RIGHT. Follow the orange marker.',
      archive: 'Corridor, middle door on the LEFT.',
      designStudio: 'Corridor, middle door on the RIGHT.',
      breakRoom: 'Corridor, first door on the LEFT.',
      financeCorner: 'Corridor, first door on the RIGHT.',
      rooftop: 'The stairwell door at the very end of the corridor.',
      lobby: 'Back to the reception desk in the lobby.'
    } as Record<string, string>,
    greetPrompt: (name: string) => `${name} wants a word — walk up and press E to talk.`,
    hints: {
      server: 'Match each cable label to its port icon. The MYSTERY cable fits the "???" port.',
      meeting: 'Check: under the table, behind the whiteboard, the projector tray, a chair, the biscuit tin.',
      archive: 'The binder spines lie — find "v14 FINAL final(2)". Then take it to the lamp-lit desk.',
      breakRoom: 'Gary needs a label so specific it names the ghost. Option three.',
      design: 'Five frames are jokes. The clean simple mark is the one.',
      finance: 'No duck? Server room mystery cable → vending machine → duck → Beatriz.',
      rooftop: 'Just walk. Listen. There is no puzzle up here.',
      lobby: 'Talk to Doris at the desk — she always knows the next step.'
    },
    toastFragment: (name: string) => `Fragment collected: ${name}`,
    toastLanyard: [
      'Lanyard upgraded: VISITOR (less temporary). Progress!',
      'Lanyard upgraded: an actual plastic badge. Photo: a shrug emoji.',
      'Lanyard upgraded: proper badge, wrong department. So close.',
      'Badge issued: yours. Actually yours.'
    ],
    heldItem: (name: string) => `Holding: ${name}`,
    swapItem: (name: string) => `Swapped to: ${name}`,
    doorLocked: [
      'Cleaning in progress since 2019.',
      'Locked. The sticky note apologises on behalf of the door.',
      'Badge reader blinks red, unimpressed by your paper credentials.'
    ]
  },

  credits: {
    title: "SORRY YOU'RE LEAVING",
    subtitle: '(the building) (for tonight)',
    entries: [
      ['Ghost wrangling', 'The Remap Team'],
      ['Built with', 'Three.js, sticky notes & spite for the lift'],
      ['A game by', 'Remap — After Hours'],
      ['Testing', 'The building itself (it insisted)']
    ],
    signoffs: [
      ['Doris', 'Come back and see me, love. The desk gets quiet at night. — D x'],
      ['Marcus', 'uptime 100%. you\'re the root cause (of the good kind). — M'],
      ['Priya', 'Great sync today. No follow-ups. First time for everything. — P'],
      ['Ines', 'Read page two sometime. It\'s even better. — i'],
      ['Gary', 'Sandwich. Safe. Hero. — G'],
      ['Kit', 'You have good taste. Don\'t let anyone add a gradient to you. — K'],
      ['Beatriz', 'Your account is settled. Morale: essential. — B (and the duck)'],
      ['Sam', 'Lights off on your way out. Not all of them. — S']
    ],
    playAgain: 'Play again?',
    stats: (time: string, hints: number, sandwichTries: number) =>
      `Time on the clock: ${time} · Hints raised: ${hints} · Ducks reconciled: 1/1 · Sandwiches labelled: 1/1 (attempts: ${sandwichTries})`
  }
}

// Voice blip pitches per character (spec §6.2).
export const BLIPS: Record<string, { pitch: number; low?: boolean }> = {
  building: { pitch: 160, low: true },
  doris: { pitch: 620 },
  marcus: { pitch: 470 },
  priya: { pitch: 540 },
  standup: { pitch: 400 },
  ines: { pitch: 580 },
  gary: { pitch: 300 },
  kit: { pitch: 500 },
  beatriz: { pitch: 440 },
  sam: { pitch: 330, low: true },
  player: { pitch: 700 },
  narrator: { pitch: 250, low: true }
}
