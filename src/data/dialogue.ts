// ALL text lines live here, keyed by character/beat (spec §6.2, §26 writing guide).
// Written to be SPOKEN by browser voices: short sentences, plain punctuation,
// no asterisks or long dashes. Tone: human first, quietly eerie, always polite.
// Voices: Amna (reception, warm, small talk), Abdul Moiz (ops, clipped status
// reports), Zainab (PM, meeting habits), Hira (writer, soft, trails off),
// Irfan (break room, few words), Bilal (designer, critique), Sana (finance,
// exact numbers), Tariq (founder, plain and kind). The Building: polite, then warm.

export const D = {
  // Opening story cards (shown before the badge-in), narrated.
  story: [
    { title: '9:41 PM, Thursday', text: 'Three weeks into your new job at Remap. You were halfway home when you remembered your phone charger, still on your desk. Everyone else left hours ago.' },
    { title: 'The building is closed.', text: 'You badge back in. Behind you, the lifts go quiet. The lights flicker once. Then the intercom speaks, calm and polite and wrong. The doors will open again when the work is done.' },
    { title: 'The office is not empty.', text: 'Former colleagues are still here. Stuck for years, each one still trying to finish the one task they never closed. They cannot leave. And tonight, neither can you.' },
    { title: 'YOUR MISSION', text: 'Find each ghost and help them finish their unfinished work. Every ghost you free gives you one fragment of the Remap logo. Collect all seven fragments to unlock the lift, and go home.', mission: true }
  ] as { title: string; text: string; mission?: boolean }[],
  missionBrief: 'Mission: free the seven ghosts by finishing their work. Collect seven logo fragments. Unlock the lift. Start with the Server Room or the Meeting Room.',

  building: {
    coldOpen: 'Good evening, New Hire. The building is closed. You may leave when the work is done.',
    frag1: 'One task complete. Thank you. The building did not expect that.',
    frag3: 'Three. You are exceeding expectations. The expectations were set in 2011.',
    frag5: 'Five. The lights feel lighter. The building did not touch them.',
    preRooftop: 'The stairwell is open. The air up there is old. It kept the view for you.',
    finaleClose: 'Goodnight. See you tomorrow.',
    postCredits: 'same time tomorrow?',
    liftDead: 'The lift is unavailable. The lift has always been unavailable. Please do not remember it working.',
    workUnknown: 'To clarify. The work is not yours. It belongs to the ones who stayed. Ask the front desk.'
  },

  doris: {
    greet: [
      'Oh. A face. A real one. Come closer, you are safe here.',
      'Back again? Good. The lobby gets very quiet at night.',
      'You look tired. So did everyone, at the end.'
    ],
    intro: [
      'Welcome to Remap. I am Amna. Front desk, since 2009. Yes, I know you can see through me. Please do not mention it, it makes me self conscious.',
      'The building has locked us in until the work is done. Not your work. Theirs. The people who stayed past closing, and never quite left.',
      'Each of them is stuck on one small thing. Help them finish it, and they can finally go. They will leave you a fragment of the logo. Seven fragments open that lift.',
      'Start with the Server Room or the Meeting Room, down the corridor. Abdul Moiz is the nervous one. The Meeting Room is the loud one. You will hear it before you see it.'
    ],
    jokes: [
      'A visitor badge. Oh dear. Do not worry, I T never issued mine either.',
      'The building is not haunted. It is just very committed.',
      'I would offer you tea, but the kettle stopped speaking to us years ago.',
      'The plant by the copier died in 2013. Someone still waters it. I try not to ask who.',
      'If the lights flicker, that is just the building thinking. It thinks about you a lot.',
      'We had a fire drill once. Everyone left. Everyone came back. Nobody remembers deciding to.',
      'The photocopier prints pages nobody sent. We stopped reading them.',
      'You are the first visitor since the auditor. He is fine. Probably. We never checked.',
      'A phone rang in 2019. Wrong number. Still the best day of the decade.',
      'Walk the corridor slowly. It likes to be noticed.',
      'Employee of the Month is chosen by the building now. It keeps picking the boiler.'
    ],
    unlocks: {
      archive: 'The Archive just unlocked. Hira is in there. Speak softly. And please do not tell her the documentation is fine. She knows what fine means.',
      breakDesign: 'The Break Room and the Design Studio are open now. Irfan guards a fridge. Bilal guards his own taste. Neither is winning.',
      finance: 'Finance Corner is open. Sana is lovely. Calm, even. Just do not mention reconciliation unless you are holding a duck.',
      rooftop: 'The stairwell clicked open. The rooftop. Someone up there has waited longer than any of us. Be kind. He will be.',
      lift: 'The lift is humming. Seven fragments. Come and see me at the desk before you go. I would like to say a proper goodbye.'
    },
    finale: [
      'Look at you. Three weeks in, and you closed more tickets than I T did in ten years.',
      'The front desk is covered, I think. You will do.',
      'Go on. Badge out. And this time, someone will say goodnight back.'
    ],
    echo: 'The desk bell rings once, softly, by itself. Someone is still saying hello.'
  },

  marcus: {
    greet: [
      'Status update. A person. Not a ghost. Logging it.',
      'Server six is restarting. Server six is always restarting. That is the status.',
      'Please do not touch the racks. They are holding more than data.'
    ],
    task: [
      'Server six is down. Not down down. It is not down if I keep restarting it. That is the rule. I think that is the rule.',
      'Four cables came loose in the incident, six years ago. I can see the ports. I just cannot choose. Choosing is how outages start.'
    ],
    hints: [
      'Read the label on the cable. Read the label on the port. They match. Mostly.',
      'Hold a cable up and the right port glows. New feature. Nobody documented it.'
    ],
    wrong: [
      'No. Sorry. Spark contained. We do not plug power into the network port. We learned that.',
      'Incident inside an incident. Please stop. Please also continue.',
      'That port has not accepted that cable in six years. It is not starting tonight.'
    ],
    mystery: 'The mystery cable. Do not unplug, it said. You plugged it in. Bold. Somewhere in this building, a machine just woke up hungry.',
    solve: 'Green. All ports green. Fans normal. Uptime begins now.',
    release: [
      'My pager says resolved. Six years, and it finally says resolved.',
      'Handover notes. The fans are good. Green is good. There is no next on call.',
      'Tell them the uptime was worth it. Please. Tell them it was worth it.'
    ],
    echo: 'The pager on the floor blinks once. No new incidents. It sounds relieved.'
  },

  priya: {
    greet: [
      'Good, you are here. We are just waiting on a few people. Since 2016.',
      'Let us take that offline. Whatever it was. Please.',
      'Can everyone see my screen? Nobody has ever seen my screen.'
    ],
    task: [
      'This is the Q3 sync. Recurring. Very recurring. We cannot close until every agenda item is covered, and the last item was never written down.',
      'It is somewhere in this room. Everything is always written down somewhere. Find the final item and I can end this meeting.'
    ],
    hints: [
      'It is written down somewhere. Try under things. Try inside things.',
      'One of the notes is glinting. Glinting is not on the agenda. So it must be the one.'
    ],
    decoys: [
      'Item nine. Circle back on the circling back.',
      'Item twelve. Align on the misalignment. Pre align first.',
      'Item twenty three. Biscuit budget. Move to Q4. The biscuits went stale in 2017.',
      'Item forty. Whose mug says worlds okayest. Sensitive. Handle offline.'
    ],
    finalNote: 'Any other business: someone say no blockers, and go home.',
    solvePrompt: 'You found it. Read it. Read it out loud.',
    solve: 'No blockers. No blockers. Meeting adjourned.',
    release: [
      'Ten years. And it was one agenda item.',
      'Minutes. Meeting ended. Action items, none. Next steps, lunch.',
      'Thank you. Truly. This one goes in the retro as a win.',
      'Go. Before someone schedules a follow up.'
    ],
    echo: 'The projector hums on a slide that just says adjourned. Someone drew a little sun on it.'
  },

  ines: {
    greet: [
      'Oh. Hello. Sorry, I will keep my voice down. It is a habit. It is fine.',
      'Four hundred pages. Indexed. Cross referenced. Nobody read them. It is fine.',
      'You do not have to stay. The dust and I have an understanding.'
    ],
    task: [
      'There is nothing to fix, really. I wrote the onboarding guide. Version fourteen. Final, final. It is on a shelf somewhere, with the others.',
      'You could read it. No. That is silly. Nobody even reads page one.'
    ],
    hints: [
      'Version fourteen. Final, final. The second final.',
      'The other binders have gone quiet. Only one still wants to be found.'
    ],
    wrongBinder: 'That is not it. That one is mostly minutes. Unminuted minutes.',
    foundPrompt: 'You found it. That is the one. You are taking it to the desk? You do not have to.',
    // The sincere reading (spec §8.4): seven honest lines, no jokes.
    reading: [
      'Page one. Welcome. You were hired because someone saw something in you. Trust their judgement on the days you cannot trust your own.',
      'Ask the question. The one you think is too obvious. It has quietly been blocking three other people all week.',
      'Write things down as if the next person matters. They do. And one day the next person will be you, tired, at six in the evening.',
      'Nobody remembers a perfect quarter. Everyone remembers who helped them through a bad one.',
      'Go home. The work will keep. It keeps better than you do.',
      'When you do not know who to ask, ask the person who wrote the guide. They wrote it because they wanted to be asked.',
      'You belong here. The feeling that you do not is just the badge printer running late.'
    ],
    solve: 'Someone read it. Page one. That is all it ever needed.',
    release: [
      'Keep the pen. It is a good pen. It never once ran dry before the thought did.',
      'Tell whoever writes version fifteen. No final. Just fifteen.',
      'Thank you for reading. Thank you.'
    ],
    echo: 'The lamp stays warm over the open binder. Page one lies flat, like it finally breathed out.'
  },

  gary: {
    greet: [
      'The fridge.',
      'You see it too. Good. A witness.',
      'Someone took my sandwich. 2014. It had no label. That is not the point.'
    ],
    task: [
      'One sandwich. Cheese. Gone. Every day I make it again. Every day, gone.',
      'The label maker is on the counter. Make the label right this time. Make it undeniable.'
    ],
    hints: [
      'Labels have power. A weak label invites theft. A strong label testifies.',
      'Think about who the label must convince. Everyone. Including the dead.'
    ],
    rejections: [
      'Sandwich. Descriptive. Useless. The thief knows it is a sandwich. That is why.',
      'Irfan. Which Irfan? There were three. Two are alive. One is hungry. Be specific.',
      'Free food? Are you working with the thief?'
    ],
    solve: 'Yes. Legally airtight. Spiritually binding. No colleague would dare.',
    release: [
      'Justice. Cold, refrigerated justice.',
      'The sandwich stays. The label protects it now. Forever.',
      'Tell the break room Irfan finally ate.'
    ],
    echo: 'The fridge hums, content. Inside, one sandwich rests in state, labelled like a monument.'
  },

  kit: {
    greet: [
      'Careful, you are standing in the light. The light is doing better work than I am.',
      'The kerning haunts me. I haunt me.',
      'One more pass. It always needs one more pass. I have been one more pass for eight years.'
    ],
    task: [
      'Six candidates on the wall. One of them is the logo. The real one. The others are learning experiences.',
      'I cannot choose. Choosing means stopping. Look at them. Tell me which one survives.'
    ],
    hints: [
      'Simplicity. It is the one I kept walking past.',
      'The pretenders have gone dim. Even the wall agrees now.'
    ],
    critiques: [
      'Comic Sans. I was going through something.',
      'This one is upside down. For eight years I told people it was disruptive.',
      'A gradient of six greens. Six. It looks like a lizard applying for a job.',
      'That is just a map with the letters R E written on it. Literal. Cowardly. I loved it once.',
      'The bevel and emboss era. We do not speak of the bevel and emboss era.'
    ],
    choosePrompt: 'This one? You are sure. Say it like you mean it.',
    solve: 'This one. It was always this one.',
    release: [
      'There. One millimetre. Now it is straight. Now it is finished.',
      'Ship it. Lobby, lift, mugs. Tastefully, on the mugs.',
      'Tell the next designer. Done is a design decision. The best one.'
    ],
    echo: 'The chosen frame hangs perfectly level. Every other frame has quietly accepted this.'
  },

  beatriz: {
    greet: [
      'Good evening. You are seven years, four months and eleven days late. No matter.',
      'Everything balances. Everything except the duck.',
      'Please do not touch the paper. It is load bearing. Fiscally.'
    ],
    taskNoDuck: [
      'One receipt, from March 2016. Four pounds ninety nine. Item unknown. Vendor, the vending machine. It has never reconciled.',
      'The machine only gives up what it owes. Something still rattles inside it. Ask the server room why. Machines listen to machines.'
    ],
    taskDuck: [
      'One receipt, from March 2016. Four pounds ninety nine. And you are carrying something. Present it, please. Slowly.'
    ],
    hints: [
      'The vending machine in the break room still holds its debt. Something has to make it let go. The servers know.',
      'Bring me what the machine gives you. I will do the rest. I have been ready for nine years.'
    ],
    scan: 'Scanning. One rubber duck. Cross referencing March 2016. Vendor matches. Amount matches. Four ninety nine. Item, rubber duck. Morale. Essential.',
    solve: 'The books close. To the penny.',
    release: [
      'Balanced. Every line. Every year.',
      'Tell finance the duck was always essential.',
      'Keep it. Assets that raise morale should circulate. That is policy now.'
    ],
    echo: 'The projected spreadsheet reads zero in every cell. One cell, faintly, shows a duck.'
  },

  sam: {
    arrive: [
      'Evening. Pull up a chair. The city does its best work about now.',
      'You are the new one. Three weeks. I know. Amna talks, even to the wind.',
      'I started this place. Two desks, one kettle, and a map on the wall we kept redrawing. Someone said we should just re map it. We laughed. The name stuck.',
      'You met them all, then. Abdul Moiz, Zainab, Hira. Irfan and his sandwich. Bilal. Sana. Do you know what they had in common?',
      'They cared past closing time. That is the whole secret, and the whole problem.',
      'The building never trapped anyone. I know how it sounds. It only wanted the work finished. Finished work can be put down.',
      'They finished. You finished it with them. So this last piece is not a puzzle. It is a gift.',
      'One more thing. Amna has been at that desk longer than any of us. Go and badge out. She is waiting to say goodnight.'
    ],
    echo: 'A telescope cap sits on the ledge. Through the lens, the city, and every light someone left on for someone else.'
  },

  // Flavour inspects, read aloud by the player.
  toasts: {
    lobby: {
      mints: 'A bowl of mints. Best before, optimism.',
      magazines: 'Ten office trends for 2019. All ten are ghosts now too.',
      waterCooler: 'The water cooler is empty. The conversations somehow linger.',
      clock: 'The wall clock stopped at 6:47. It chose its favourite minute.',
      mat: 'The mat says WEL OME. The C clocked out years ago.',
      logbook: 'Visitor log. Last entry, 2019. Auditor, in. There is no out.',
      vending: 'The vending machine watches you leave.',
      turnstile: 'A turnstile. It spins freely now. It has nothing left to prove.'
    },
    portraits: {
      doris: 'Employee of the Month, June 2009. Amna. For answering a phone that had not rung yet.',
      marcus: 'Employee of the Month, October 2018. Abdul Moiz. For ninety nine point nine nine percent uptime. The rest is why he is still here.',
      priya: 'Employee of the Month, March 2016. Zainab. For running a meeting that nearly ended.',
      ines: 'Employee of the Month, January 2015. Hira. For documentation above and beyond. And beyond.',
      gary: 'Employee of the Month, August 2014. Irfan. For bringing his own lunch every day. Twice, on the bad day.',
      kit: 'Employee of the Month, February 2017. Bilal. For forty one logo revisions. The board still misses revision twelve.',
      beatriz: 'Employee of the Month, April 2016. Sana. For finding one penny. It took three weeks. Worth it.',
      sam: 'The founder. Someone drew a small crown on the portrait in pencil. The frame allows it.'
    },
    corridor: {
      poster1: 'Poster. Teamwork. A stock photo of eight hands. None of them match.',
      poster2: 'Poster. Synergy, question mark. The question mark was added later, in pen, angrily.',
      poster3: 'Poster. It just says stay.',
      plant: 'The plant died years ago. The note says please water me. Someone still does.',
      wetFloor: 'A wet floor sign. Someone drew a little ghost on it. Prophetic.',
      extinguisher: 'Fire extinguisher. Last inspected before the ambition burned out.',
      chair: 'An office chair, rolling gently. Nobody is in it. There is a story in it.',
      fireMap: 'A fire evacuation map. You are here. It has never once been wrong.',
      copier: 'The photocopier hums. Its last page said help me, no toner. Relatable.',
      ceiling: 'A missing ceiling tile. A cable dangles, like the building forgot mid sentence.'
    },
    noticeboard: [
      'For sale. Exercise bike, never used. Collect from desk twelve. Desk twelve no longer exists.',
      'Lost. One red stapler. Reward, knowing where the stapler is.',
      'Five a side, Thursdays. Cancelled.',
      'Reminder. The kitchen fridge is a shared space. See incident, 2014.',
      'Book club reads Who Moved My Cheese for the eleventh quarter in a row.',
      'I T notice. Do not turn anything off. Anything.',
      'Yoga at lunch, studio two. Studio two became storage in 2015. Breathe anyway.',
      'Cake in the kitchen, 2019. The plate remains. A monument.',
      'Parking permits due. The car park was sold. Renew anyway.',
      'Quarterly town hall, postponed to a future quarter. Any quarter.',
      'New starters, collect your badge from I T. I T collects badges from no one.',
      'Please do not feed the plant. It is beyond food now.'
    ],
    serverRoom: {
      whiteboard: 'Whiteboard. Days since incident, zero. The zero is laminated.',
      cans: 'Six energy drink cans arranged like a shrine. The shrine is load bearing.',
      floorTile: 'A raised floor tile, lifted. Below, cables, dust, and one brave note. Here be dragons.',
      kvm: 'A monitor shows a login screen for a server that no longer exists. It waits.',
      fan: 'A desk fan pointed at server six. Emotional support airflow.'
    },
    meetingRoom: {
      parkingLot: 'Flipchart. Parking lot. Thirty four items. Nothing has ever left the parking lot.',
      tv: 'The wall TV says no signal. The most honest presenter this room ever had.',
      mugs: 'Ten mugs. One says worlds okayest. It is the cleanest one.',
      clock: 'The wall clock ticks once every four seconds. Meetings stretch time.',
      biscuitTin: 'The biscuit tin. Empty since 2017. Except for a note. Wait. A note.'
    },
    archive: {
      typewriter: 'A typewriter. Someone typed version one on a page, and then wisely stopped.',
      crossStitch: 'A framed cross stitch. Docs are love. Every stitch perfectly indexed.',
      ladder: 'A rolling ladder. It glides an inch when you look away. Helpful, or haunted. Both.',
      cardIndex: 'A card index cabinet. The drawer labelled misc is the fullest. It always is.',
      dust: 'Dust drifts through your torchlight like the slowest confetti in the world.'
    },
    breakRoom: {
      microwave: 'The microwave clock says 88 88. It has seen things. It will not say when.',
      banner: 'A banner. Happy birthd. The A Y fell behind the fridge in 2015. Nobody has had a whole birthday since.',
      coffee: 'Coffee machine. Out of order, 2017. The note is laminated. Hope was not.',
      kettle: 'The kettle. It stopped speaking to everyone. Amna was serious.',
      cakeBox: 'An empty cake box. In the icing residue, the ghost of the word farewell.',
      olive: 'A single olive in its own tub, labelled do not. Do not what? Just do not.',
      q2: 'A glowing tub labelled do not open, Q2. It is warm. It hums in a minor key.'
    },
    designStudio: {
      plant: 'A plant. It is alive. The first living thing in the building. Bilal waters it with critique.',
      mannequin: 'A mannequin in a branded hoodie. The kerning on the hoodie is, admittedly, perfect.',
      pottery: 'The pottery shelf of failed ideas. One mug has three handles. For stakeholders, says the note.',
      swatches: 'A colour wall. One swatch is labelled the good orange. It is circled fourteen times.',
      lightbox: 'A light box with a logo sketch half traced. Even the tracing paper looks tired.'
    },
    financeCorner: {
      shredder: 'The shredder. Full. Nobody has emptied it since the great reconciliation scare.',
      cert: 'A framed certificate. Audit ready. The frame is crooked. The audit never came.',
      duckOutline: 'A duck shaped outline drawn on the desk, like a tiny crime scene. Something belongs here.',
      paper: 'A mountain of paper. Geologically, this layer is from the invoice era.',
      tenkey: 'A calculator. The nine is worn smooth. Four ninety nine left its mark.'
    },
    rooftop: {
      telescope: 'An old telescope, pointed not at the stars but at the office across the street. Know your competitors.',
      cooler: 'A cooler. Inside, two sodas and a note. For the night the work is done.',
      stringLights: 'String lights someone hung years ago. Half still glow. The stubborn half.',
      acUnit: 'An air conditioning unit the size of a small car. It breathes out like it pays rent.',
      deckchair: 'A deckchair, angled at the skyline best side.'
    },
    lift: {
      cert: 'Lift inspection certificate. Last inspected, never.',
      phone: 'The emergency phone has one button. The button says Amna.',
      mirror: 'The lift mirror. You look tired. You look done, in the best way.'
    },
    misc: {
      duckGet: 'The vending machine gives up one rubber duck. It has waited since 2016. It squeaks, grateful.',
      duckHint: 'Something rattles inside the vending machine. A coil is jammed. The machines know how to fix it.',
      penGet: 'Hira gave you her pen. Your handwriting will never be the same. It will be better.',
      fridgeItems: 'A shelf of horrors. The Q2 tub, a single olive, a houseplant. And one unlabelled sandwich, radiating grievance.'
    }
  },

  ui: {
    objectives: {
      findWork: 'Find out what the work is.',
      meetDoris: 'Talk to the receptionist at the lobby desk.',
      firstRooms: 'Help a ghost. Server Room or Meeting Room.',
      server: 'Find whoever keeps restarting Server 6.',
      serverCables: 'Reconnect the four cables on Server 6.',
      meeting: 'Someone has to end the eternal standup.',
      meetingNotes: 'Find the final agenda item. Five hiding spots.',
      meetingSay: 'Take the note to Zainab and end the meeting.',
      archive: 'The Archive is open. Someone quiet is inside.',
      archiveBinder: 'Find the onboarding guide, version 14, final final.',
      archiveRead: "Take the binder to Hira's desk and read page one.",
      breakRoom: 'The Break Room is open. Someone is staring at a fridge.',
      sandwich: 'Label the sandwich. Properly. Undeniably.',
      design: 'The Design Studio is open. Someone is mid critique.',
      designChoose: 'Find the real Remap logo among the six frames.',
      finance: 'Finance Corner is open. Bring exact change.',
      duckRoute: 'Sana needs what the vending machine owes. Server room, then break room.',
      duckPresent: 'Present the duck to Sana.',
      rooftop: 'The stairwell is open. Go up.',
      badgeOut: 'Go badge out. Amna is waiting to say goodnight.',
      lift: 'The lift is open. Time to go home.'
    },
    // Plain-language directions shown under the objective
    where: {
      serverRoom: 'Down the corridor. Far end, last door on the left. Follow the orange marker.',
      meetingRoom: 'Down the corridor. Far end, last door on the right. Follow the orange marker.',
      archive: 'Corridor, middle door on the left.',
      designStudio: 'Corridor, middle door on the right.',
      breakRoom: 'Corridor, first door on the left.',
      financeCorner: 'Corridor, first door on the right.',
      rooftop: 'The stairwell door at the very end of the corridor.',
      lobby: 'Back to the reception desk in the lobby.'
    } as Record<string, string>,
    greetPrompt: (name: string) => `${name} wants a word. Walk up and press E to talk.`,
    hints: {
      server: 'Match each cable label to its port icon. The mystery cable fits the question mark port.',
      meeting: 'Check under the table, behind the whiteboard, the projector tray, a chair, and the biscuit tin.',
      archive: 'The binder spines lie. Find version 14, final final. Then take it to the lamp lit desk.',
      breakRoom: 'Irfan needs a label so specific it names the ghost. Option three.',
      design: 'Five frames are jokes. The clean, simple mark is the one.',
      finance: 'No duck? Server room mystery cable, then the vending machine, then the duck, then Sana.',
      rooftop: 'Just walk. Listen. There is no puzzle up here.',
      lobby: 'Talk to Amna at the desk. She always knows the next step.'
    },
    toastFragment: (name: string) => `Fragment collected: ${name}`,
    toastLanyard: [
      'Lanyard upgraded. Visitor, less temporary. Progress.',
      'Lanyard upgraded. An actual plastic badge. The photo is a shrug.',
      'Lanyard upgraded. A proper badge, wrong department. So close.',
      'Badge issued. Yours. Actually yours.'
    ],
    heldItem: (name: string) => `Holding: ${name}`,
    swapItem: (name: string) => `Swapped to: ${name}`,
    doorLocked: [
      'Cleaning in progress since 2019.',
      'Locked. The sticky note apologises on behalf of the door.',
      'The badge reader blinks red, unimpressed by your paper credentials.'
    ]
  },

  credits: {
    title: "SORRY YOU'RE LEAVING",
    subtitle: '(the building) (for tonight)',
    entries: [
      ['Ghost wrangling', 'The Remap Team'],
      ['Built with', 'Three.js, sticky notes and a grudge against the lift'],
      ['A game by', 'Remap. After Hours'],
      ['Testing', 'The building itself. It insisted.']
    ],
    signoffs: [
      ['Amna', 'Come back and see me. The desk gets quiet at night. A.'],
      ['Abdul Moiz', 'Uptime one hundred percent. You were the root cause, the good kind. A.M.'],
      ['Zainab', 'Great sync today. No follow ups. First time for everything. Z.'],
      ['Hira', 'Read page two sometime. It is even better. H.'],
      ['Irfan', 'Sandwich. Safe. Hero. I.'],
      ['Bilal', 'You have good taste. Do not let anyone add a gradient to you. B.'],
      ['Sana', 'Your account is settled. Morale, essential. S. And the duck.'],
      ['Tariq', 'Lights off on your way out. Not all of them. T.']
    ],
    playAgain: 'Play again?',
    stats: (time: string, hints: number, sandwichTries: number) =>
      `Time on the clock: ${time} · Hints raised: ${hints} · Ducks reconciled: 1/1 · Sandwiches labelled: 1/1 (attempts: ${sandwichTries})`
  }
}

// Voice blip pitches per character (spec §6.2) — used when spoken voices are off.
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
