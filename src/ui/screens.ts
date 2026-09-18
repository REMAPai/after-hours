// DOM screens: title, loading, badge-in, pause, settings, credits, letterbox, fade (spec §4, §28).
import { drawRemapLogo } from '../engine/textures.ts'
import { audio } from '../engine/audio.ts'
import { D } from '../data/dialogue.ts'
import { speech } from '../engine/speech.ts'
import type { SettingsData } from '../engine/save.ts'

const ui = () => document.getElementById('ui-root')!

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, html?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag)
  if (cls) e.className = cls
  if (html !== undefined) e.innerHTML = html
  return e
}

// --- Title screen -------------------------------------------------------------
export function showTitle(hasSave: boolean, cb: { onNew: () => void; onContinue: () => void; onSettings: () => void; onCredits: () => void }): () => void {
  const screen = el('div', 'screen title-screen')
  screen.appendChild(el('div', 'title-bgpeople'))
  const card = el('div', 'login-card')
  const logo = el('canvas', 'logo-canvas') as HTMLCanvasElement
  logo.width = 120; logo.height = 90
  const lg = logo.getContext('2d')!
  drawRemapLogo(lg, 60, 42, 62) // official dark-on-light colourway
  card.appendChild(logo)
  const tagline = el('div', 'login-tagline', 'Work smarter.')
  card.appendChild(tagline)
  const idField = el('input', 'login-field') as HTMLInputElement
  idField.placeholder = 'Employee ID'
  idField.readOnly = true
  const pwField = el('input', 'login-field') as HTMLInputElement
  pwField.placeholder = 'Password'
  pwField.type = 'password'
  pwField.readOnly = true
  card.append(idField, pwField)

  const mkBtn = (label: string, secondary: boolean, fn: () => void) => {
    const b = el('button', 'login-btn' + (secondary ? ' secondary' : ''), label)
    b.onclick = () => { audio.unlock(); audio.sfx('ding'); fn() }
    card.appendChild(b)
    return b
  }
  mkBtn('Sign in', false, () => {
    if (hasSave && !confirmOverwrite()) return
    cb.onNew()
  })
  if (hasSave) mkBtn('Continue session', false, cb.onContinue)
  const links = el('div', 'login-links')
  const settingsLink = el('span', '', 'IT Settings')
  settingsLink.onclick = () => { audio.unlock(); audio.sfx('uiClack'); cb.onSettings() }
  const creditsLink = el('span', '', 'Log off')
  creditsLink.onclick = () => { audio.unlock(); cb.onCredits() }
  links.append(settingsLink, creditsLink)
  card.appendChild(links)
  const controls = el('div', 'login-links controls-list',
    '<span class="glyph key">W</span><span class="glyph key">A</span><span class="glyph key">S</span><span class="glyph key">D</span> move &nbsp; Mouse look &nbsp; ' +
    '<span class="glyph key">E</span> interact &nbsp; <span class="glyph key">Shift</span> jog &nbsp; <span class="glyph key">H</span> hint &nbsp; ' +
    '<span class="glyph key">M</span> map &nbsp; <span class="glyph key">Esc</span> pause / exit')
  card.appendChild(controls)
  screen.appendChild(card)
  ui().appendChild(screen)

  function confirmOverwrite(): boolean {
    return window.confirm('Sign in as a new employee? Your previous session (save) will be overwritten.')
  }

  // The wrongness, escalating over ~20s idle (spec §4.1)
  let t = 0
  let typeTimer: number | null = null
  const iv = window.setInterval(() => {
    t += 1
    if (t === 8 || t === 14 || t === 21) {
      tagline.classList.add('flicker')
      tagline.textContent = 'You never left.'
      setTimeout(() => { tagline.classList.remove('flicker'); tagline.textContent = 'Work smarter.' }, t === 21 ? 2600 : 900)
    }
    if (t === 12) screen.classList.add('wrong')
    if (t === 17 && !typeTimer) {
      const msg = "you're still here?"
      let i = 0
      typeTimer = window.setInterval(() => {
        if (i < msg.length) { idField.value = msg.slice(0, ++i) }
        else if (i < msg.length + 6) { i++ }
        else if (idField.value.length > 0) { idField.value = idField.value.slice(0, -1) }
        else { clearInterval(typeTimer!); typeTimer = null }
      }, 90)
    }
  }, 1000)

  return () => { clearInterval(iv); if (typeTimer) clearInterval(typeTimer); screen.remove() }
}

// --- Loading screen -------------------------------------------------------------
export function showLoading(): { setProgress: (p: number) => void; ready: (onStart: () => void) => void; remove: () => void } {
  const screen = el('div', 'screen loading-screen')
  screen.appendChild(el('h2', '', 'Installing updates 1 of 1'))
  screen.appendChild(el('p', '', 'Do not turn off your computer. The computer would notice.'))
  const bar = el('div', 'loading-bar')
  const fill = el('div')
  bar.appendChild(fill)
  screen.appendChild(bar)
  ui().appendChild(screen)
  return {
    setProgress: (p: number) => { fill.style.width = `${Math.round(p * 100)}%` },
    ready: (onStart: () => void) => {
      fill.style.width = '100%'
      const btn = el('button', 'loading-signin', 'Click to sign in')
      btn.onclick = () => { audio.unlock(); audio.sfx('ding'); screen.remove(); onStart() }
      screen.appendChild(btn)
      btn.focus()
    },
    remove: () => screen.remove()
  }
}

// --- Badge-in tutorial -------------------------------------------------------------
export function showBadgeIn(onDone: () => void): void {
  const screen = el('div', 'screen badge-screen')
  const reader = el('div', 'badge-reader')
  const lamp = el('div', 'badge-lamp')
  const msg = el('div', 'badge-msg', '')
  reader.append(lamp)
  screen.append(reader, msg, el('div', 'badge-prompt', 'Tap your badge — <span class="glyph key">E</span> / click'))
  ui().appendChild(screen)
  let taps = 0
  const tap = () => {
    taps++
    if (taps === 1 || taps === 2) {
      audio.sfx('badgeDeny')
      lamp.className = 'badge-lamp red'
      msg.textContent = 'ACCESS DENIED — VISITOR'
      setTimeout(() => { lamp.className = 'badge-lamp' }, 700)
    } else if (taps === 3) {
      audio.sfx('badgeAccept')
      lamp.className = 'badge-lamp green'
      msg.textContent = '…fine.'
      window.removeEventListener('keydown', keyHandler)
      setTimeout(() => {
        audio.sfx('doorSlide')
        screen.remove()
        onDone()
      }, 1100)
    }
  }
  const keyHandler = (e: KeyboardEvent) => { if (e.code === 'KeyE') tap() }
  window.addEventListener('keydown', keyHandler)
  screen.addEventListener('click', tap)
}

// --- Pause: Out of Office ----------------------------------------------------------
export function showPause(cb: { onResume: () => void; onSettings: () => void; onRestartRoom: () => void; onQuit: () => void }): () => void {
  const screen = el('div', 'screen pause-screen')
  const card = el('div', 'email-card')
  card.appendChild(el('div', 'email-head',
    '<b>From:</b> New Hire&nbsp;&nbsp;·&nbsp;&nbsp;<b>Subject:</b> Out of Office'))
  card.appendChild(el('div', 'email-body',
    '"I am currently away from my desk (paused). I will respond to your request when I return."'))
  const actions = el('div', 'email-actions')
  const mk = (label: string, sub: string, fn: () => void) => {
    const b = el('button', 'email-btn', `${label} <small>${sub}</small>`)
    b.onclick = () => { audio.sfx('uiClack'); fn() }
    actions.appendChild(b)
  }
  mk('Send later', 'Resume', cb.onResume)
  mk('Edit signature', 'Settings', cb.onSettings)
  mk('Recall message', 'Restart room', cb.onRestartRoom)
  mk('Unsubscribe', 'Quit to title', cb.onQuit)
  card.appendChild(actions)
  card.appendChild(el('div', 'email-head controls-list',
    '<span class="glyph key">W</span><span class="glyph key">A</span><span class="glyph key">S</span><span class="glyph key">D</span> move · Mouse look · ' +
    '<span class="glyph key">E</span> interact · <span class="glyph key">Shift</span> jog · <span class="glyph key">H</span> hint · ' +
    '<span class="glyph key">M</span> map · <span class="glyph key">Esc</span> resume / pause · <span class="glyph key">F</span> fullscreen'))
  screen.appendChild(card)
  ui().appendChild(screen)
  return () => screen.remove()
}

// --- Settings: IT Settings -----------------------------------------------------------
export function showSettings(s: SettingsData, onChange: () => void, onClose: () => void): () => void {
  const screen = el('div', 'screen pause-screen')
  const card = el('div', 'settings-card')
  card.appendChild(el('h2', '', 'IT Settings'))
  const ticket = el('div', 'ticket', `please raise a ticket · ref #IT-${s.ticket}`)
  card.appendChild(ticket)

  const changed = () => {
    s.ticket++
    ticket.textContent = `please raise a ticket · ref #IT-${s.ticket}`
    onChange()
  }
  const row = (label: string, control: HTMLElement) => {
    const r = el('div', 'settings-row')
    r.appendChild(el('span', '', label))
    r.appendChild(control)
    card.appendChild(r)
  }
  const slider = (get: () => number, set: (v: number) => void) => {
    const i = el('input') as HTMLInputElement
    i.type = 'range'; i.min = '0'; i.max = '1'; i.step = '0.05'
    i.value = String(get())
    i.oninput = () => { set(parseFloat(i.value)); changed() }
    return i
  }
  const check = (get: () => boolean, set: (v: boolean) => void) => {
    const i = el('input') as HTMLInputElement
    i.type = 'checkbox'
    i.checked = get()
    i.onchange = () => { set(i.checked); changed() }
    return i
  }
  const select = (opts: [string, string][], get: () => string, set: (v: string) => void) => {
    const sel = el('select') as HTMLSelectElement
    for (const [v, label] of opts) {
      const o = el('option', '', label) as HTMLOptionElement
      o.value = v
      sel.appendChild(o)
    }
    sel.value = get()
    sel.onchange = () => { set(sel.value); changed() }
    return sel
  }

  card.appendChild(el('div', 'settings-section', 'VOLUME'))
  row('Master', slider(() => s.volMaster, (v) => { s.volMaster = v }))
  row('Music', slider(() => s.volMusic, (v) => { s.volMusic = v }))
  row('SFX', slider(() => s.volSfx, (v) => { s.volSfx = v }))
  row('Voice blips', slider(() => s.volBlips, (v) => { s.volBlips = v }))
  card.appendChild(el('div', 'settings-section', 'CAMERA'))
  const sens = el('input') as HTMLInputElement
  sens.type = 'range'; sens.min = '0.3'; sens.max = '2.5'; sens.step = '0.1'; sens.value = String(s.sensitivity)
  sens.oninput = () => { s.sensitivity = parseFloat(sens.value); changed() }
  row('Sensitivity', sens)
  row('Invert Y', check(() => s.invertY, (v) => { s.invertY = v }))
  card.appendChild(el('div', 'settings-section', 'ACCESSIBILITY'))
  row('Spook-free mode', check(() => s.spookFree, (v) => { s.spookFree = v }))
  row('Text size', select([['100', '100%'], ['125', '125%'], ['150', '150%']], () => String(s.textSize), (v) => { s.textSize = parseInt(v) }))
  row('Reduce motion', check(() => s.reduceMotion, (v) => { s.reduceMotion = v }))
  row('Colour-blind-safe minimap', check(() => s.cbMinimap, (v) => { s.cbMinimap = v }))
  row('Ghost voices (browser speech)', check(() => s.voice, (v) => { s.voice = v }))
  row('Text speed', select([['slow', 'Slow'], ['normal', 'Normal'], ['instant', 'Instant']], () => s.textSpeed, (v) => { s.textSpeed = v as SettingsData['textSpeed'] }))
  card.appendChild(el('div', 'settings-section', 'GRAPHICS'))
  row('Quality', select([['auto', 'Auto'], ['low', 'Low'], ['med', 'Medium'], ['high', 'High']], () => s.quality, (v) => { s.quality = v as SettingsData['quality'] }))

  const close = el('button', 'login-btn settings-close', 'Close ticket')
  close.onclick = () => { audio.sfx('uiClack'); screen.remove(); onClose() }
  card.appendChild(close)
  screen.appendChild(card)
  ui().appendChild(screen)
  return () => screen.remove()
}

// --- Credits: leaving card -------------------------------------------------------------
export function showCredits(stats: { time: string; hints: number; sandwichTries: number; complete: boolean }, onPlayAgain: () => void): () => void {
  const screen = el('div', 'screen credits-screen')
  const card = el('div', 'leaving-card')
  card.appendChild(el('h1', '', D.credits.title))
  card.appendChild(el('h3', '', D.credits.subtitle))
  for (const [k, v] of D.credits.entries) {
    card.appendChild(el('div', 'credit-entry', `<b>${k}:</b> ${v}`))
  }
  card.appendChild(el('div', 'settings-section', 'MESSAGES'))
  for (const [name, line] of D.credits.signoffs) {
    card.appendChild(el('div', 'signoff', `${line}<br><b>— ${name}</b>`))
  }
  if (stats.complete) {
    card.appendChild(el('div', 'stats-card', D.credits.stats(stats.time, stats.hints, stats.sandwichTries)))
  }
  screen.appendChild(card)
  ui().appendChild(screen)

  // Post-credits sting (spec §9.3)
  let stingDone = false
  const sting = () => {
    if (stingDone) return
    stingDone = true
    const dark = el('div', 'screen', '')
    dark.style.background = '#050608'
    dark.style.zIndex = '60'
    const cursorLine = el('div', '', '')
    cursorLine.style.cssText = 'color:#8a9; font-family:monospace; font-size:1.1em;'
    dark.appendChild(cursorLine)
    ui().appendChild(dark)
    const msg = D.building.postCredits
    let i = 0
    const iv = setInterval(() => {
      if (i < msg.length) { cursorLine.textContent = msg.slice(0, ++i) + '▌'; audio.blip(180, true) }
      else {
        clearInterval(iv)
        setTimeout(() => {
          const again = el('button', 'play-again', D.credits.playAgain)
          again.onclick = () => { dark.remove(); screen.remove(); onPlayAgain() }
          dark.appendChild(again)
        }, 900)
      }
    }, 80)
  }
  setTimeout(sting, 9000)
  card.addEventListener('scroll', () => {
    if (card.scrollTop + card.clientHeight >= card.scrollHeight - 20) sting()
  })
  return () => screen.remove()
}

// --- Letterbox + fade helpers -------------------------------------------------------------
export function makeLetterbox(): (on: boolean) => void {
  const top = el('div', 'letterbox-bar top')
  const bottom = el('div', 'letterbox-bar bottom')
  ui().append(top, bottom)
  return (on: boolean) => {
    top.classList.toggle('on', on)
    bottom.classList.toggle('on', on)
  }
}

export function makeFade(): (cb?: () => void) => void {
  const overlay = el('div', 'fade-overlay')
  ui().appendChild(overlay)
  return (cb?: () => void) => {
    overlay.classList.add('on')
    setTimeout(() => {
      cb?.()
      setTimeout(() => overlay.classList.remove('on'), 250)
    }, 750)
  }
}

// --- Opening story: onboarding-pack cards, click/E to continue -----------------------
export function showStory(onDone: () => void): void {
  const screen = el('div', 'screen story-screen')
  const card = el('div', 'story-card')
  const kicker = el('div', 'story-kicker', 'REMAP · NEW STARTER PACK · PAGE 1 OF ' + D.story.length)
  const title = el('h2', 'story-title')
  const body = el('p', 'story-text')
  const next = el('div', 'story-next', `${'<span class="glyph key">E</span>'} / click to continue`)
  card.append(kicker, title, body, next)
  screen.appendChild(card)
  ui().appendChild(screen)
  let idx = -1
  let typing: number | null = null
  const show = () => {
    idx++
    if (idx >= D.story.length) { cleanup(); onDone(); return }
    const page = D.story[idx]
    kicker.textContent = `REMAP · NEW STARTER PACK · PAGE ${idx + 1} OF ${D.story.length}`
    card.classList.toggle('mission', !!page.mission)
    title.textContent = page.title
    body.textContent = ''
    speech.speak('narrator', `${page.title}. ${page.text}`)
    next.style.visibility = 'hidden'
    let i = 0
    if (typing) clearInterval(typing)
    typing = window.setInterval(() => {
      if (i < page.text.length) {
        body.textContent = page.text.slice(0, ++i)
        if (i % 3 === 0) audio.blip(page.mission ? 200 : 260, true)
      } else {
        clearInterval(typing!); typing = null
        next.style.visibility = 'visible'
      }
    }, 22)
  }
  const advance = () => {
    if (typing) { // finish the typewriter first
      clearInterval(typing); typing = null
      body.textContent = D.story[idx].text
      next.style.visibility = 'visible'
      return
    }
    audio.sfx('paperPeel')
    show()
  }
  const keyHandler = (e: KeyboardEvent) => { if (e.code === 'KeyE' || e.code === 'Space' || e.code === 'Enter') advance() }
  const cleanup = () => { window.removeEventListener('keydown', keyHandler); speech.stop(); screen.remove() }
  window.addEventListener('keydown', keyHandler)
  screen.addEventListener('click', advance)
  show()
}
