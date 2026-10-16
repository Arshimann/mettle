#!/usr/bin/env node
// Setter opp Discord-serveren for SMP-en: kategorier, kanaler, permissions og infotekster.
// Kjør med:  node smp-oppsett.mjs
// Trygt å kjøre flere ganger: eksisterende kanaler gjenbrukes, og bot-meldingene oppdateres
// i stedet for å postes på nytt. Ingenting slettes uten at du skriver "ja".

import readline from 'node:readline/promises';
import process from 'node:process';

const API = process.env.DISCORD_API ?? 'https://discord.com/api/v10';

const TEXT = 0;
const VOICE = 2;
const CATEGORY = 4;

const P = {
  ADMIN: 1n << 3n,
  VIEW: 1n << 10n,
  SEND: 1n << 11n,
  EMBED: 1n << 14n,
  ATTACH: 1n << 15n,
  HISTORY: 1n << 16n,
  CONNECT: 1n << 20n,
  SPEAK: 1n << 21n,
  PUBLIC_THREADS: 1n << 35n,
  PRIVATE_THREADS: 1n << 36n,
  SEND_IN_THREADS: 1n << 38n,
};

// Read-only for @everyone. "Send Messages in Threads" er med fordi ellers kan folk fortsatt
// svare i tråder som allerede finnes.
const READ_ONLY_ALLOW = P.VIEW | P.HISTORY;
const READ_ONLY_DENY = P.SEND | P.PUBLIC_THREADS | P.PRIVATE_THREADS | P.SEND_IN_THREADS;

// Ting medlemmer må ha i chat- og voice-kanalene. Hvis en eksisterende kanal nekter dette
// for @everyone, fjernes nektelsen.
const CHAT_NEEDS = P.VIEW | P.SEND | P.HISTORY | P.ATTACH | P.EMBED;
const VOICE_NEEDS = P.VIEW | P.CONNECT | P.SPEAK;

const PLAN = [
  {
    name: '📌 INFORMASJON',
    readOnly: true,
    channels: [
      { name: '📖・info', type: TEXT, topic: 'Alt du trenger å vite om SMP-en.', message: 'info' },
      { name: '📡・server-ip', type: TEXT, topic: 'Server-IP, versjon og port.', message: 'serverIp' },
      { name: '📜・de-fem-bud', type: TEXT, topic: 'Reglene på serveren.', message: 'regler' },
      { name: '📢・kunngjøringer', type: TEXT, topic: 'Viktige oppdateringer, events og endringer på serveren.' },
    ],
  },
  {
    name: '💬 CHAT',
    channels: [
      { name: '💬・generelt', type: TEXT, topic: 'Snakk om SMP-en eller hva som helst.' },
      { name: '🎬・clips', type: TEXT, topic: 'Del clips og videoer fra serveren.' },
      { name: '📸・screenshots', type: TEXT, topic: 'Del builds, loot, morsomme øyeblikk og andre bilder fra SMP-en.' },
      { name: '😂・memes', type: TEXT, topic: 'Memes og shitposting.' },
      // slowmode er i sekunder. Handel får kortere cooldown enn resten fordi folk legitimt
      // legger ut flere tilbud; forhandling skjer uansett i tråder, som ikke arver slowmode.
      { name: '💰・handel', type: TEXT, topic: 'Kjøp, selg og bytt items med andre spillere.', message: 'handel', pin: true, slowmode: 15 * 60 },
      { name: '🎯・bounties', type: TEXT, topic: 'Sett dusør på andre spillere og tilby belønning til den som klarer å ta dem.', message: 'bounties', pin: true, slowmode: 30 * 60 },
      { name: '🕵️・etterlysninger', type: TEXT, topic: 'Etterlys spillere som har drept, stjålet fra eller raidet deg.', message: 'etterlysninger', pin: true, slowmode: 30 * 60 },
      { name: '💡・forslag', type: TEXT, topic: 'Kom med forslag til ting som kan gjøre SMP-en bedre.', message: 'forslag', pin: true, slowmode: 30 * 60 },
    ],
  },
  {
    name: '🔊 VOICE',
    channels: [
      { name: '🔊・Generelt', type: VOICE },
      { name: '⛏️・Minecraft', type: VOICE },
      { name: '⚔️・PvP', type: VOICE },
      { name: '🔒・Privat 1', type: VOICE },
      { name: '🔒・Privat 2', type: VOICE },
      { name: '💤・AFK', type: VOICE, afk: true },
    ],
  },
];

const IP_PLACEHOLDER = 'DIN-IP-HER';
const VERSION_PLACEHOLDER = 'DIN-VERSJON-HER';

// Hver melding har en "key" som brukes til å finne igjen botens egen melding ved neste kjøring.
const MESSAGES = {
  info: {
    key: 'VELKOMMEN TIL SMP-EN',
    build: ({ ids }) => [
      '# ⚔️ VELKOMMEN TIL SMP-EN',
      '',
      'Dette er en survival-server hvor PvP, griefing, raiding og stjeling er tillatt.',
      '',
      'Du er selv ansvarlig for basen din, tingene dine og hvem du velger å stole på.',
      '',
      'Allianser, kriger, handel, bounties og svik er en del av serveren.',
      '',
      `Les <#${ids['📜・de-fem-bud']}> før du begynner å spille.`,
    ].join('\n'),
  },
  serverIp: {
    key: 'SERVER-IP',
    build: ({ ip, version }) => [
      '# 📡 SERVER-IP',
      '',
      `**IP:** \`${ip}\``,
      '',
      `**Versjon:** ${version}`,
      '',
      '**Port:** 25565',
    ].join('\n'),
  },
  regler: {
    key: 'DE FEM BUD',
    build: () => [
      '# ⚔️ DE FEM BUD',
      '',
      '**I. Ingen X-Ray**',
      'X-Ray, hacked clients og andre cheats er forbudt.',
      '',
      '**II. Ingen spawnkilling**',
      'Ikke drep spillere gjentatte ganger rett etter at de respawner.',
      '',
      '**III. Ingen ulovlige mods**',
      'Mods som gir urettferdige fordeler eller viser skjult informasjon er forbudt.',
      '',
      '**IV. Ingen lagmaskiner**',
      'Ikke lag maskiner eller konstruksjoner med hensikt om å lage lag eller krasje serveren.',
      '',
      '**V. Ingen seed-cracking**',
      'Ikke bruk programmer eller andre metoder for å finne serverens seed eller skjulte strukturer.',
      '',
      '## DETTE ER TILLATT',
      '',
      '✅ Griefing',
      '✅ Stjeling',
      '✅ PvP',
      '✅ Raiding',
      '✅ Drap uten grunn',
    ].join('\n'),
  },
  handel: {
    key: '# 💰 HANDEL',
    build: () => [
      '# 💰 HANDEL',
      '',
      'SMP-en har sin egen økonomi. Her kjøper, selger og bytter du items med andre spillere.',
      '',
      '**Slik poster du**',
      '• Skriv hva du selger eller ser etter, og hva du vil ha for det.',
      '• Samle alt du har til salgs i én melding.',
      '• Forhandle i en tråd under innlegget eller på DM, ikke i selve kanalen.',
      '',
      '**Husk**',
      '• Handel skjer på egen risiko. Svik er en del av serveren.',
      '• ⏳ 15 min cooldown mellom meldinger for å unngå spam.',
    ].join('\n'),
  },
  bounties: {
    key: '# 🎯 BOUNTIES',
    build: ({ ids }) => [
      '# 🎯 BOUNTIES',
      '',
      'Sett dusør på en spiller, og belønn den som klarer å ta dem.',
      '',
      '**Slik poster du**',
      '• **Hvem:** spilleren det gjelder',
      '• **Belønning:** hva du betaler',
      '• **Krav:** hva som må til, f.eks. et drap eller et bestemt item',
      '',
      '**Husk**',
      '• Krev inn dusøren med screenshot eller clip som bevis, i en tråd under bountyen.',
      `• Spawnkilling teller ikke (bud II i <#${ids['📜・de-fem-bud']}>).`,
      '• Dusøren betales av den som satte den. Ingen garanti: svik er en del av serveren.',
      '• ⏳ 30 min cooldown mellom meldinger for å unngå spam.',
    ].join('\n'),
  },
  etterlysninger: {
    key: '# 🕵️ ETTERLYSNINGER',
    build: ({ ids }) => [
      '# 🕵️ ETTERLYSNINGER',
      '',
      'Har noen drept deg, stjålet fra deg eller raidet basen din? Etterlys dem her.',
      '',
      '**Slik poster du**',
      '• **Hvem:** navnet, hvis du vet det',
      '• **Hva:** hva som skjedde, og omtrent hvor og når',
      '• **Bevis:** screenshot eller clip, hvis du har det',
      '',
      '**Husk**',
      '• PvP, griefing, stjeling og raiding er lov. Dette er for å advare andre, ikke for å klage.',
      `• Brudd på <#${ids['📜・de-fem-bud']}> (X-Ray, cheats osv.) meldes direkte til en admin.`,
      '• ⏳ 30 min cooldown mellom meldinger for å unngå spam.',
    ].join('\n'),
  },
  forslag: {
    key: '# 💡 FORSLAG',
    build: () => [
      '# 💡 FORSLAG',
      '',
      'Har du en idé som kan gjøre SMP-en bedre? Skriv den her.',
      '',
      '**Slik poster du**',
      '• Ett forslag per melding.',
      '• Forklar kort hva du vil ha, og hvorfor.',
      '• Diskuter i en tråd under forslaget.',
      '',
      '**Stem**',
      'Reager med 👍 eller 👎 på forslagene.',
      '',
      '⏳ 30 min cooldown mellom meldinger for å unngå spam.',
    ].join('\n'),
  },
};

// ───────────────────────────── hjelpere ─────────────────────────────

let TOKEN = '';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, path, body) {
  for (;;) {
    const res = await fetch(API + path, {
      method,
      headers: {
        Authorization: `Bot ${TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DiscordBot (smp-oppsett, 1.0)',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 429) {
      const data = await res.json().catch(() => ({}));
      const wait = Math.ceil((data.retry_after ?? 1) * 1000) + 250;
      // Discord tillater bare 2 navneendringer per kanal per 10 minutter, så dette kan ta tid.
      if (wait > 5000) console.log(`   ⏳ Discord ber oss vente ${Math.round(wait / 1000)} sek (rate limit)…`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      const text = await res.text();
      const err = new Error(`${method} ${path} → ${res.status} ${text}`);
      err.status = res.status;
      throw err;
    }
    return res.status === 204 ? null : res.json();
  }
}

// Sammenligner kanalnavn på kjernen (bokstaver og tall), så "general-info", "📖・info" og
// "info" regnes som samme kanal, men "info" og "infox" ikke gjør det.
const core = (s) => s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
// Discord kan fjerne usynlige emoji-variantvelgere (U+FE0F) og gjør tekstkanalnavn små.
// Uten dette ville skriptet forsøkt å gi nytt navn hver gang og kræsjet inn i rate limiten.
const sameName = (a, b) => a.replace(/️/g, '').toLowerCase() === b.replace(/️/g, '').toLowerCase();

function setEveryone(overwrites, guildId, { allow = 0n, deny = 0n, unDeny = 0n }) {
  const list = (overwrites ?? []).map((o) => ({ id: o.id, type: o.type, allow: String(o.allow), deny: String(o.deny) }));
  let ow = list.find((o) => o.id === guildId);
  if (!ow) {
    ow = { id: guildId, type: 0, allow: '0', deny: '0' };
    list.push(ow);
  }
  const before = `${ow.allow}/${ow.deny}`;
  let a = BigInt(ow.allow);
  let d = BigInt(ow.deny);
  a = (a | allow) & ~deny;
  d = ((d | deny) & ~allow) & ~unDeny;
  ow.allow = String(a);
  ow.deny = String(d);
  const changed = before !== `${ow.allow}/${ow.deny}`;
  // En tom overwrite er støy i Discord-UI-et; fjern den.
  const cleaned = list.filter((o) => !(o.id === guildId && o.allow === '0' && o.deny === '0'));
  return { list: cleaned, changed };
}

// ───────────────────────────── hovedløp ─────────────────────────────

const rl = process.stdin.isTTY ? readline.createInterface({ input: process.stdin, output: process.stdout }) : null;
async function ask(question, envName) {
  if (process.env[envName] !== undefined) return process.env[envName];
  if (!rl) return '';
  return (await rl.question(question)).trim();
}

async function main() {
  console.log('\n⚔️  SMP-oppsett for Discord\n');

  TOKEN = (await ask('Lim inn bot-tokenet og trykk Enter: ', 'DISCORD_TOKEN'))
    .trim()
    .replace(/^["']|["']$/g, '')
    .replace(/^Bot\s+/i, '');
  if (!TOKEN) throw new Error('Ingen token oppgitt.');

  let me;
  try {
    me = await api('GET', '/users/@me');
  } catch (e) {
    if (e.status === 401) throw new Error('Tokenet ble avvist. Trykk "Reset Token" under Bot i Developer Portal og prøv igjen.');
    throw e;
  }
  console.log(`✅ Logget inn som boten ${me.username}`);

  const invite = `https://discord.com/oauth2/authorize?client_id=${me.id}&permissions=8&scope=bot`;

  // Finn serveren. Boten kan bare se servere den er invitert til.
  let guilds = await api('GET', '/users/@me/guilds');
  while (guilds.length === 0) {
    console.log('\nBoten er ikke på noen server ennå. Åpne denne lenken, velg serveren din og trykk Godkjenn:\n');
    console.log(`   ${invite}\n`);
    if (!rl) throw new Error('Boten er ikke invitert til noen server.');
    await rl.question('Trykk Enter når boten er lagt til… ');
    guilds = await api('GET', '/users/@me/guilds');
  }
  let guildRef = guilds[0];
  if (guilds.length > 1) {
    const wanted = process.env.GUILD_ID;
    if (wanted) {
      guildRef = guilds.find((g) => g.id === wanted);
      if (!guildRef) throw new Error(`Boten er ikke på serveren ${wanted}.`);
    } else {
      console.log('\nBoten er på flere servere:');
      guilds.forEach((g, i) => console.log(`   ${i + 1}. ${g.name}`));
      const n = Number(await ask('Hvilken skal settes opp? Skriv nummeret: ', 'GUILD_NR'));
      guildRef = guilds[n - 1];
      if (!guildRef) throw new Error('Ugyldig valg.');
    }
  }
  const guildId = guildRef.id;
  const guild = await api('GET', `/guilds/${guildId}`);
  console.log(`✅ Server: ${guild.name}`);

  // Boten trenger Administrator: den må kunne poste i read-only-kanalene den selv låser,
  // og bare admin trumfer en @everyone-nektelse.
  const roles = await api('GET', `/guilds/${guildId}/roles`);
  const member = await api('GET', `/guilds/${guildId}/members/${me.id}`);
  const rolePerms = (id) => BigInt(roles.find((r) => r.id === id)?.permissions ?? '0');
  const botPerms = member.roles.reduce((acc, id) => acc | rolePerms(id), rolePerms(guildId));
  if (!(botPerms & P.ADMIN)) {
    throw new Error(
      'Boten mangler Administrator-tillatelse. Kick boten og inviter den på nytt med denne lenken:\n   ' + invite,
    );
  }

  let ip = IP_PLACEHOLDER;
  let version = VERSION_PLACEHOLDER;

  let channels = await api('GET', `/guilds/${guildId}/channels`);
  const used = new Set();
  const ids = {};
  const report = { created: [], updated: [], kept: [] };

  function findExisting(name, type, parentId) {
    const hits = channels.filter((c) => c.type === type && !used.has(c.id) && core(c.name) === core(name));
    return hits.find((c) => c.parent_id === parentId) ?? hits[0];
  }

  console.log('\n📁 Kategorier og kanaler');
  for (const cat of PLAN) {
    let category = findExisting(cat.name, CATEGORY, undefined);
    const catOw = cat.readOnly ? { allow: READ_ONLY_ALLOW, deny: READ_ONLY_DENY } : {};
    if (!category) {
      const { list } = setEveryone([], guildId, catOw);
      category = await api('POST', `/guilds/${guildId}/channels`, { name: cat.name, type: CATEGORY, permission_overwrites: list });
      channels.push(category);
      report.created.push(cat.name);
      console.log(`   + ${cat.name}`);
    } else {
      const patch = {};
      if (!sameName(category.name, cat.name)) patch.name = cat.name;
      if (cat.readOnly) {
        const { list, changed } = setEveryone(category.permission_overwrites, guildId, catOw);
        if (changed) patch.permission_overwrites = list;
      }
      if (Object.keys(patch).length) {
        Object.assign(category, await api('PATCH', `/channels/${category.id}`, patch));
        report.updated.push(cat.name);
        console.log(`   ~ ${cat.name} (fantes, oppdatert)`);
      } else {
        report.kept.push(cat.name);
        console.log(`   = ${cat.name} (fantes allerede)`);
      }
    }
    used.add(category.id);
    cat.id = category.id;

    for (const ch of cat.channels) {
      const need = ch.type === VOICE ? VOICE_NEEDS : CHAT_NEEDS;
      const ow = cat.readOnly
        ? { allow: READ_ONLY_ALLOW, deny: READ_ONLY_DENY }
        : { unDeny: need };
      let channel = findExisting(ch.name, ch.type, category.id);

      if (!channel) {
        // Ny kanal får samme overwrites som kategorien, så den står som "synket" i Discord
        // og du kan styre hele kategorien ett sted.
        const body = { name: ch.name, type: ch.type, parent_id: category.id, permission_overwrites: category.permission_overwrites ?? [] };
        if (ch.topic) body.topic = ch.topic;
        if (ch.slowmode) body.rate_limit_per_user = ch.slowmode;
        channel = await api('POST', `/guilds/${guildId}/channels`, body);
        channels.push(channel);
        report.created.push(ch.name);
        console.log(`   + ${ch.name}`);
      } else {
        const patch = {};
        if (!sameName(channel.name, ch.name)) patch.name = ch.name;
        if (channel.parent_id !== category.id) patch.parent_id = category.id;
        // Topic settes bare hvis kanalen ikke har en fra før, så egne endringer overlever.
        if (ch.topic && !channel.topic) patch.topic = ch.topic;
        // Samme for slowmode: settes bare hvis kanalen ikke har noen, så du kan justere den selv.
        if (ch.slowmode && !channel.rate_limit_per_user) patch.rate_limit_per_user = ch.slowmode;
        const { list, changed } = setEveryone(channel.permission_overwrites, guildId, ow);
        if (changed) patch.permission_overwrites = list;
        if (Object.keys(patch).length) {
          Object.assign(channel, await api('PATCH', `/channels/${channel.id}`, patch));
          report.updated.push(ch.name);
          console.log(`   ~ ${ch.name} (fantes, oppdatert)`);
        } else {
          report.kept.push(ch.name);
          console.log(`   = ${ch.name} (fantes allerede)`);
        }
      }
      used.add(channel.id);
      ids[ch.name] = channel.id;
      ch.id = channel.id;
    }
  }

  // Rekkefølge: våre tre kategorier først, i riktig rekkefølge, deretter eventuelle andre.
  channels = await api('GET', `/guilds/${guildId}/channels`);
  const byPos = (a, b) => a.position - b.position || (BigInt(a.id) < BigInt(b.id) ? -1 : 1);
  const ourCatIds = PLAN.map((c) => c.id);
  const otherCats = channels.filter((c) => c.type === CATEGORY && !ourCatIds.includes(c.id)).sort(byPos);
  const positions = [...ourCatIds, ...otherCats.map((c) => c.id)].map((id, i) => ({ id, position: i }));
  for (const cat of PLAN) {
    const ourIds = cat.channels.map((c) => c.id);
    const extra = channels.filter((c) => c.parent_id === cat.id && !ourIds.includes(c.id)).sort(byPos);
    [...ourIds, ...extra.map((c) => c.id)].forEach((id, i) => positions.push({ id, position: i }));
  }
  const current = new Map(channels.map((c) => [c.id, c.position]));
  if (positions.some((p) => current.get(p.id) !== p.position)) {
    await api('PATCH', `/guilds/${guildId}/channels`, positions);
    console.log('   ↕ Rekkefølgen er satt');
  }

  // Meldinger. Bot-meldinger kan bare redigeres av boten selv, så IP og versjon spørres om
  // her; kjør skriptet på nytt for å endre dem senere.
  console.log('\n📝 Infotekster');
  // I kanaler folk skriver i havner botens melding fort lenger opp enn de 50 siste, så festede
  // meldinger sjekkes først. Discord har to pin-endepunkter (nytt og gammelt); begge støttes.
  const getPins = async (channelId) => {
    try {
      const res = await api('GET', `/channels/${channelId}/messages/pins?limit=50`);
      return res.items.map((i) => i.message);
    } catch (e) {
      if (e.status !== 404) throw e;
      return api('GET', `/channels/${channelId}/pins`);
    }
  };
  const pin = async (channelId, messageId) => {
    try {
      await api('PUT', `/channels/${channelId}/messages/pins/${messageId}`);
    } catch (e) {
      if (e.status !== 404) throw e;
      await api('PUT', `/channels/${channelId}/pins/${messageId}`);
    }
    // Fjern Discords "smpbot festet en melding"-varsel; det er bare støy i kanalen.
    const recent = await api('GET', `/channels/${channelId}/messages?limit=10`);
    const notice = recent.find((m) => m.type === 6 && m.author?.id === me.id);
    if (notice) await api('DELETE', `/channels/${channelId}/messages/${notice.id}`).catch(() => {});
  };
  const findMine = async (channelId, key, pinned = false) => {
    const isMine = (m) => m.author?.id === me.id && m.content.includes(key);
    if (pinned) {
      const hit = (await getPins(channelId)).find(isMine);
      if (hit) return hit;
    }
    const msgs = await api('GET', `/channels/${channelId}/messages?limit=50`);
    return msgs.find(isMine);
  };
  const ipChannel = ids['📡・server-ip'];
  const oldIp = await findMine(ipChannel, MESSAGES.serverIp.key);
  if (oldIp) {
    ip = oldIp.content.match(/IP:\*{0,2}\s*`?([^`\n]+?)`?\s*$/m)?.[1] ?? ip;
    version = oldIp.content.match(/Versjon:\*{0,2}\s*(.+?)\s*$/m)?.[1] ?? version;
  }
  const keepHint = (v, ph) => (v === ph ? 'Enter = fyll inn senere' : `Enter = behold ${v}`);
  ip = (await ask(`   Server-IP (${keepHint(ip, IP_PLACEHOLDER)}): `, 'SMP_IP')) || ip;
  version = (await ask(`   Minecraft-versjon (${keepHint(version, VERSION_PLACEHOLDER)}): `, 'SMP_VERSJON')) || version;

  for (const cat of PLAN) {
    for (const ch of cat.channels) {
      if (!ch.message) continue;
      const msg = MESSAGES[ch.message];
      const content = msg.build({ ids, ip, version });
      const existing = ch.message === 'serverIp' ? oldIp : await findMine(ch.id, msg.key, ch.pin);
      let messageId = existing?.id;
      if (!existing) {
        messageId = (await api('POST', `/channels/${ch.id}/messages`, { content, allowed_mentions: { parse: [] } })).id;
        console.log(`   + ${ch.name}: lagt inn`);
      } else if (existing.content !== content) {
        await api('PATCH', `/channels/${ch.id}/messages/${existing.id}`, { content, allowed_mentions: { parse: [] } });
        console.log(`   ~ ${ch.name}: oppdatert`);
      } else {
        console.log(`   = ${ch.name}: uendret`);
      }
      if (ch.pin && !existing?.pinned) {
        await pin(ch.id, messageId);
        console.log(`   📌 ${ch.name}: festet`);
      }
    }
  }

  // Gjør 💤・AFK til serverens faktiske AFK-kanal, ellers er den bare et navn.
  const afkId = PLAN.flatMap((c) => c.channels).find((c) => c.afk)?.id;
  if (afkId && guild.afk_channel_id !== afkId) {
    await api('PATCH', `/guilds/${guildId}`, { afk_channel_id: afkId });
    console.log('\n💤 💤・AFK er satt som serverens AFK-kanal');
  }

  // Advar hvis @everyone-rollen selv mangler grunnleggende rettigheter; det kan ikke kanal-
  // oppsettet fikse, og jeg endrer ikke roller uten at du ber om det.
  const everyone = rolePerms(guildId);
  const missing = Object.entries({ 'Send Messages': P.SEND, 'Attach Files': P.ATTACH, 'Embed Links': P.EMBED, 'Connect': P.CONNECT, 'Speak': P.SPEAK, 'View Channels': P.VIEW })
    .filter(([, bit]) => !(everyone & bit))
    .map(([n]) => n);
  if (missing.length) {
    console.log(`\n⚠️  @everyone-rollen mangler: ${missing.join(', ')}. Medlemmer vil ikke kunne dette noe sted.`);
    console.log('   Fiks det under Serverinnstillinger → Roller → @everyone.');
  }

  // Kanaler som ikke er del av oppsettet (f.eks. Discords standard #general). Slettes bare
  // hvis du sier ja.
  channels = await api('GET', `/guilds/${guildId}/channels`);
  const leftovers = channels
    .filter((c) => !used.has(c.id))
    .sort((a, b) => (a.type === CATEGORY) - (b.type === CATEGORY) || byPos(a, b));
  if (leftovers.length) {
    console.log('\n🧹 Disse kanalene er ikke en del av oppsettet:');
    for (const c of leftovers) console.log(`   - ${c.type === CATEGORY ? '[kategori] ' : c.type === VOICE ? '[voice] ' : '#'}${c.name}`);
    const answer = (await ask('   Skriv "ja" for å SLETTE dem (alt innhold i dem forsvinner), eller trykk Enter for å beholde: ', 'SLETT')).toLowerCase();
    if (answer === 'ja') {
      for (const c of leftovers) {
        try {
          await api('DELETE', `/channels/${c.id}`);
          console.log(`   🗑  slettet ${c.name}`);
        } catch (e) {
          console.log(`   ⚠️  kunne ikke slette ${c.name}: ${e.message}`);
        }
      }
    } else {
      console.log('   Beholdt.');
    }
  }

  console.log('\n✅ Ferdig!');
  console.log(`   Opprettet: ${report.created.length}, oppdatert: ${report.updated.length}, uendret: ${report.kept.length}`);
  if (ip === IP_PLACEHOLDER || version === VERSION_PLACEHOLDER) {
    console.log('   IP/versjon er ikke fylt inn ennå. Kjør skriptet på nytt når du har dem.');
  }
  console.log('   Behold boten på serveren hvis du vil oppdatere tekstene senere med dette skriptet.\n');
}

main()
  .catch((e) => {
    console.error(`\n❌ ${e.message}\n`);
    process.exitCode = 1;
  })
  .finally(() => rl?.close());
