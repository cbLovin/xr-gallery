// Smooth crossfade transitions — assignment from Min Lee, Oct 18, 2026.
// Built on the submitted four-mood serial sketch (mood_lights_serial,
// peak-160 version — the code behind Wokwi project 477780722066387969).
//
// WHAT CHANGED vs the submitted version, and why:
// The pattern functions used to draw 60 frames with delay(50) inside
// the function, so a mood "owned" the ring for ~3 seconds and a switch
// was a hard cut. A crossfade needs a fresh frame of the OLD mood and
// a fresh frame of the NEW mood at the same instant, blended together.
// That works here because every pattern is drawn from beatsin8(), which
// is a function of the clock — a mood's frame at any moment is just
// "its color scaled by its beatsin8 value right now." So each pattern
// became renderMood(): draw ONE frame of a mood into a buffer.
// loop() then draws the old mood into one buffer, the new mood into
// another, and blends them over ~2 seconds with blend().
//
// Pattern colors and beatsin8() numbers are IDENTICAL to the
// submission — Warm gold (10, 100, 220), Sad blue (8, 40, 140),
// Calm purple (6, 60, 200), Dynamic red (30, 90, 160) — the 160 peak
// is the cap Min approved. Only the frame delivery changed.
//
// Bonus effect: loop() no longer blocks for ~3 seconds, so a typed
// command starts its fade within one frame (~20ms) instead of
// waiting for the current pattern cycle to finish.
//
// STATUS: local stub compile check only (see check note in folder).
// NOT yet run in Wokwi and NOT flashed to hardware.

#include <Arduino.h>
#include <FastLED.h>

// LED Configuration — same as the submitted sketch
#define LED_P     5       // GPIO pin connected to LED strip
#define NUM_LEDS    16      // Number of LEDs in the strip
#define MAX_BRIGHTNESS 200     // Max brightness (0-255)
#define LED_KIND    WS2812B // LED type
#define COLOR_ORDER GRB

#define FADE_MS 2000        // crossfade duration (~2 seconds)

CRGB leds[NUM_LEDS];        // the real output buffer (what FastLED.show sends)
CRGB fromBuf[NUM_LEDS];     // one frame of the mood fading out
CRGB toBuf[NUM_LEDS];       // one frame of the mood fading in

// ====== MOOD STATE ======
enum Mood { WARM, SAD, CALM, DYNAMIC };

Mood shownMood = WARM;      // mood fully on the ring when no fade is running
Mood fromMood  = WARM;      // mood the current fade started from
Mood toMood    = WARM;      // mood the current fade is heading to
bool transitioning = false; // is a crossfade in progress?
bool fromFrozen = false;    // true if fromBuf is a frozen snapshot (see below)
unsigned long fadeStart = 0;

// ====== FUNCTION DECLARATIONS ======
void renderMood(Mood m, CRGB* buf);
void checkSerialInput();
const char* moodName(Mood m);

// ====== SETUP ======
void setup() {
  FastLED.addLeds<LED_KIND, LED_P, COLOR_ORDER>(leds, NUM_LEDS);
  FastLED.setBrightness(MAX_BRIGHTNESS);
  Serial.begin(115200);
  Serial.println("Mood Lights Started");
  Serial.println("Send: WARM, SAD, CALM, DYNAMIC");
}

// ====== LOOP ======
void loop() {
  checkSerialInput();  // may start a crossfade

  if (transitioning) {
    // Draw the new mood's current frame.
    renderMood(toMood, toBuf);
    // Draw the old mood's current frame too — unless this fade began
    // mid-fade, in which case fromBuf holds a frozen snapshot of the
    // blended frame the ring was actually showing (fading from the
    // real picture, not from a mood that was never fully shown).
    if (!fromFrozen) {
      renderMood(fromMood, fromBuf);
    }

    unsigned long elapsed = millis() - fadeStart;
    uint8_t amount = (elapsed >= FADE_MS)
                       ? 255
                       : (uint8_t)((elapsed * 255UL) / FADE_MS);

    for (int i = 0; i < NUM_LEDS; i++) {
      leds[i] = blend(fromBuf[i], toBuf[i], amount);
    }

    if (amount == 255) {
      transitioning = false;
      shownMood = toMood;
      Serial.print("Mood: ");
      Serial.println(moodName(shownMood));
    }
  } else {
    renderMood(shownMood, leds);
  }

  FastLED.show();
  delay(20);  // ~50 frames/sec — fine enough steps for a smooth fade
}

// ====== SERIAL INPUT ======
// Same commands as before. Difference: instead of switching instantly,
// a valid NEW mood starts a 2-second crossfade to it.
void checkSerialInput() {
  if (Serial.available() > 0) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    cmd.toUpperCase();

    Mood requested;
    if (cmd == "WARM")         { requested = WARM; }
    else if (cmd == "SAD")     { requested = SAD; }
    else if (cmd == "CALM")    { requested = CALM; }
    else if (cmd == "DYNAMIC") { requested = DYNAMIC; }
    else {
      Serial.println("Unknown: " + cmd);
      return;
    }

    Serial.print("Mood set to: ");
    Serial.println(cmd);

    Mood currentTarget = transitioning ? toMood : shownMood;
    if (requested == currentTarget) {
      return;  // already there (or already fading there) — nothing to do
    }

    if (transitioning) {
      // Mid-fade change of mind: freeze whatever blend is on the ring
      // right now and fade from that picture to the new mood.
      for (int i = 0; i < NUM_LEDS; i++) {
        fromBuf[i] = leds[i];
      }
      fromFrozen = true;
    } else {
      fromMood = shownMood;
      fromFrozen = false;
    }
    toMood = requested;
    fadeStart = millis();
    transitioning = true;
  }
}

// ====== PATTERN FRAMES ======
// Each case draws exactly one frame of that mood into buf, using the
// same color and beatsin8() values as the submitted pattern functions.
// No loops, no delay, no FastLED.show() here — loop() owns timing.
void renderMood(Mood m, CRGB* buf) {
  uint8_t b;
  CRGB col;

  switch (m) {
    case WARM:  // golden slow pulse
      b = beatsin8(10, 100, 220);
      col = CRGB::Gold;
      break;
    case SAD:   // dim blue slow fade
      b = beatsin8(8, 40, 140);
      col = CRGB::Blue;
      break;
    case CALM:  // soft purple "breathing" glow
      b = beatsin8(6, 60, 200);
      col = CRGB::Purple;
      break;
    case DYNAMIC:  // controlled red pulse — peak capped at 160 (approved)
    default:
      b = beatsin8(30, 90, 160);
      col = CRGB::Red;
      break;
  }

  col.nscale8(b);
  fill_solid(buf, NUM_LEDS, col);
}

const char* moodName(Mood m) {
  switch (m) {
    case WARM:    return "Warm";
    case SAD:     return "Sad";
    case CALM:    return "Calm";
    case DYNAMIC: return "Dynamic";
  }
  return "?";
}
