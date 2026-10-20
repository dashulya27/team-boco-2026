export const FINAL_CIPHER = 'VIE VPWUPQCV MKB NTT FGUNHTXW I';
export const FINAL_BINARY = '00110011 00110100 00110010 00110111';
export const MISSION_KEY = 'boco.mission.v1';
export const ACCESS_KEY = 'boco.paper-access.v1';

export function normalizeAnswer(value) {
  return String(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
}
export function checkLocation(value) {
  return ['BOMBSITEA', 'DASGESCHENKISTBEIBOMBSITEA'].includes(normalizeAnswer(value));
}
export function checkCaseCode(value) {
  return String(value).replace(/\s/g, '') === '3427';
}
export function decodeVigenere(cipher, key) {
  const letters = normalizeAnswer(key).replace(/[^A-Z]/g, '');
  if (!letters) throw new Error('Missing key');
  let i = 0;
  return cipher.toUpperCase().replace(/[A-Z]/g, letter =>
    String.fromCharCode(65 + (letter.charCodeAt(0) - letters.charCodeAt(i++ % letters.length) + 26) % 26));
}
export function readProgress(storage) {
  try {
    const data = JSON.parse(storage.getItem(MISSION_KEY) || '{}');
    const cats = data.cats === true;
    const location = cats && data.location === true;
    return { cats, location, complete: location && data.complete === true };
  } catch { return { cats: false, location: false, complete: false }; }
}
export function createMissionController(panel, storage) {
  const progress = readProgress(storage);
  function save() { try { storage.setItem(MISSION_KEY, JSON.stringify(progress)); } catch {} }
  function render() {
    panel.replaceChildren();
    const title = document.createElement('h1');
    title.textContent = progress.complete ? 'MISSION COMPLETE' : progress.location ? 'BINARY AUTHENTICATION' : 'COCO PROTOCOL // VIGENÈRE';
    panel.append(title);
    function paragraph(text, className = '') {
      const p = document.createElement('p'); p.textContent = text; p.className = className; panel.append(p); return p;
    }
    if (progress.complete) {
      paragraph('BOMBSITE A // LOOT AUTHORIZED', 'mission-yellow');
      paragraph('Dein Geschenk wartet bei BOMBSITE A. Öffne dort den Koffer mit dem Code:', 'mission-instructions');
      paragraph('3427', 'mission-code');
      paragraph('Alles Gute zum Geburtstag, Dominik! — Darina, Bounty & Coco ♥');
      return;
    }
    if (progress.location) {
      paragraph('Koordinaten bestätigt: BOMBSITE A. Jetzt fehlt nur der Koffer-Code.');
      paragraph('Jede 8-Bit-Gruppe ergibt mit ASCII eine Ziffer. Lies die vier Ziffern von links nach rechts.');
      paragraph(FINAL_BINARY, 'mission-cipher');
    } else {
      paragraph('Nachtschicht geschafft: alle drei Schlüssel gesammelt. Entschlüssle jetzt die Koordinaten des Geschenks.');
      paragraph('Benutze das Schlüsselwort aus deinem Papier-Rätsel und die gedruckte Vigenère-Tabelle. Wiederhole den Schlüssel; Leerzeichen verbrauchen keinen Schlüsselbuchstaben.');
      paragraph(FINAL_CIPHER, 'mission-cipher');
    }
    const form = document.createElement('form');
    const label = document.createElement('label'); label.htmlFor = 'mission-answer';
    label.textContent = progress.location ? 'Vierstelliger Koffer-Code' : 'Welcher Ort steht in der entschlüsselten Nachricht?';
    const input = document.createElement('input'); input.id = 'mission-answer'; input.required = true;
    input.autocomplete = 'off'; input.spellcheck = false; input.maxLength = progress.location ? 12 : 80;
    if (progress.location) input.inputMode = 'numeric';
    const button = document.createElement('button'); button.type = 'submit'; button.textContent = 'ANTWORT PRÜFEN';
    const feedback = document.createElement('p'); feedback.setAttribute('role','status'); feedback.setAttribute('aria-live','polite');
    const hint = document.createElement('details');
    const summary = document.createElement('summary'); summary.textContent = 'Hinweis öffnen'; hint.append(summary);
    const help = document.createElement('p');
    help.textContent = progress.location
      ? 'ASCII 00110000 bis 00111001 sind die Ziffern 0 bis 9. Beispiel: 00110001 = 1. Du brauchst keine Buchstaben als Zwischenantwort.'
      : 'Wähle die Zeile des Schlüsselbuchstabens, suche darin den Geheimtextbuchstaben und lies oben den Klartext ab. Die Nachricht beginnt mit DAS.';
    hint.append(help); form.append(label, input, button, feedback); panel.append(form, hint);
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (progress.location ? checkCaseCode(input.value) : checkLocation(input.value)) {
        if (progress.location) progress.complete = true; else progress.location = true;
        save(); render();
      } else feedback.textContent = progress.location ? 'Noch nicht richtig. Prüfe jede 8-Bit-Gruppe und die Reihenfolge.' : 'Noch nicht richtig. Prüfe den wiederholten Schlüssel und überspringe Leerzeichen.';
    });
    queueMicrotask(() => input.focus());
  }
  return {
    progress,
    open() { if (!progress.cats) return; panel.hidden = false; render(); },
    completeCats() { progress.cats = true; save(); this.open(); }
  };
}
