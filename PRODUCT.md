# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML/CSS/JavaScript with no build step, so teachers or others can edit it later. Hosted free on GitHub Pages (`https://s92a15.github.io/drum-game/`). Google Apps Script bound to a Google Sheet acts as the backend API only (songs, charts, scores). The front end cannot run inside GAS HtmlService, because its iframe sandbox blocks microphone access (verified: `NotAllowedError Permission denied`).

## Users

- Primary: elementary-school students in the school's Shi-Gu (十鼓) drum team. They have weak rhythm sense and little patience for repetitive practice.
- Secondary: the teacher or coach, who builds and edits song charts, runs team practice, and reviews progress.

## Product Purpose

A Taiko-no-Tatsujin-style rhythm game that turns drum practice into play. Students use it during team practice and in free time between classes. Success means students practice more often by choice and keep steadier rhythm.

## Positioning

Students play on a real drum, not a controller. A microphone hears each hit and tells a drum-head hit (咚 Don) from a rim hit (咔 Ka). Charts are the team's own original compositions, which the teacher builds from photos of hand-drawn drum notation (read by AI) and then corrects in an editor.

## Operating Context

- Main display: a classroom projector or TV that the whole team watches together. Text and targets must be readable from across a room.
- One Windows computer (Chrome or Edge) and one microphone serve the whole team.
- Team mode (unison): the whole team plays the same part, and the game judges overall timing and togetherness. When parts differ, the game judges rhythm only, not Don/Ka.
- Solo mode: one student, one drum, with full Don/Ka judging.
- Keyboard input (F/J = Don, D/K = Ka) is a fallback for when the microphone setup fails.
- Each device or drum needs a short calibration (Don/Ka samples, hit threshold, latency offset). Calibration lives in the game's Settings.

## Capabilities and Constraints

- Microphone hit detection and Don/Ka classification in the browser (Web Audio). It works on a GitHub Pages prototype, but has not been verified on a real drum yet.
- Wide judgment windows for children (about ±60 ms good, ±120 ms ok); team mode is wider.
- Song charts live in Google Sheets: one row per bar, one character per grid cell (`D` Don, `K` Ka, `.` rest).
- AI recognition of hand-drawn charts goes to `draft`. The teacher previews it, plays it back, edits it, and then publishes.
- Bluetooth audio is not supported, because its latency is too high.
- Use only CC0/open-licensed assets. Never use Taiko no Tatsujin art, sounds, characters, or names.
- Undecided: score and leaderboard design, how students are identified (nickname or seat number), and grade range.

## Brand Commitments

- Visual style: Standard arcade drum rhythm game layout (high-contrast 2D vector kid-friendly aesthetic, dark navy stage, fiery orange-red solid Don discs, sky-blue hollow Ka rings, original cute drum mascot, no copyrighted assets).

## Evidence on Hand

- Working microphone test page: `index.html` (M0 prototype).
- Songs are the team's own original compositions. No real charts or audio files have been provided yet.
- No school logo, team photos, or mascot assets exist yet. Do not fabricate them.

## Product Principles

1. The real drum comes first. Every screen supports playing on the physical drum, not the keyboard.
2. Readable from the back row. The team plays on a projector, so information has to survive distance.
3. Forgiving, not punishing. Children with weak rhythm need encouragement and clear early/late feedback, not harsh failure.
4. The teacher stays in control. AI drafts and the teacher decides; every chart stays editable in plain Google Sheets.

## Accessibility & Inclusion

Young children, some of whom may not read fluently: use short words plus icons, high contrast, and large targets. Color is never the only Don/Ka cue; shape and label also differ.
