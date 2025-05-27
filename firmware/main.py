import usb.device
from usb.device.midi import MIDIInterface

from usb.device.hid import HIDInterface  # Hypothetical import
import time
import keeb
from micropython import const


# const midiToFreq = midiNote => 440 * Math.pow(2, (midiNote - 69) / 12);

MODE = 0

m = MIDIInterface()
# m.desc_cfg(None, None, None, ["", "Ashtyn", "Ashtyn Synth", "1"])

HID_REPORT_DESCRIPTOR = bytes(
    [
        0x06,
        0x00,
        0xFF,  # Usage Page (Vendor Defined 0xFF00)
        0x09,
        0x01,  # Usage (Vendor Usage 1)
        0xA1,
        0x01,  # Collection (Application)
        0x15,
        0x00,  # Logical Minimum (0)
        0x26,
        0xFF,
        0x00,  # Logical Maximum (255)
        0x75,
        0x08,  # Report Size (8 bits)
        0x95,
        0x23,  # Report Count (8 bytes)
        0x09,
        0x01,  # Usage (Vendor Usage 1)
        0x81,
        0x02,  # Input (Data,Var,Abs)  -- device to host
        0x09,
        0x01,  # Usage (Vendor Usage 1)
        0x91,
        0x02,  # Output (Data,Var,Abs) -- host to device
        0xC0,  # End Collection
    ]
)

_INTERFACE_PROTOCOL = const(0x01)


class ExInterface(HIDInterface):
    def __init__(self):
        super().__init__(
            HID_REPORT_DESCRIPTOR,
            set_report_buf=bytearray(35),
            protocol=_INTERFACE_PROTOCOL,
            interface_str="Ashtyn Synth ex",
        )
        self.last = []

    def send_data(self, PITCH_MOD, keystate):
        d = bytes([MODE, 5 + PITCH_MOD] + keystate)
        if self.last == d:
            return
        self.send_report(d)
        self.last = d


hid = ExInterface()

# Remove builtin_driver=True if you don't want the MicroPython serial REPL available.
usb.device.get().init(
    m, hid, manufacturer_str="Ashtyn", product_str="Ashtyn synth", builtin_driver=True
)


while not m.is_open():
    time.sleep_ms(100)


# TX constants
CHANNEL = 0
PITCH = 60
CONTROLLER = 0  # 64
control_val = 0
PITCH_MOD = 0
key_pitches = {}
pressed = set()
MODE_CHANGE = False


def calc_key_id(r, c):
    return (r * keeb.num_cols) + c


while m.is_open():
    current_state = keeb.scan_matrix()
    BASE_PITCH = 60 + (12 * PITCH_MOD)  # C4
    KEY_OFFSET = 3
    # NUM_COLS = 8  # columns 3–10
    # Columns with sharps (double press possible)
    SHARP_COLS = {3, 4, 6, 7, 8, 10}
    # MIDI pitches for single and double presses
    SINGLE_ADDS = [0, 2, 4, 5, 7, 9, 11, 12]  # C, D, E, F, G, A, B, C
    # C#, D#, —, F#, G#, A#, —, C#
    DOUBLE_ADDS = [1, 3, None, 6, 8, 10, None, 13]

    # Usage in your code:
    for r in range(keeb.num_rows):
        for c in range(keeb.num_cols):
            col_idx = c - KEY_OFFSET
            # key_id = (r * keeb.num_cols) + c
            key_id = calc_key_id(r, c)
            if current_state[r][c] and not keeb.last_state[r][c]:
                pressed.add(key_id)
                if c > 2:
                    if r == 0 or r == 1:
                        if r == 0 and c in SHARP_COLS:
                            # Row 0: double key (sharp)
                            pitch_add = DOUBLE_ADDS[col_idx]
                            if pitch_add is not None:
                                pitch = BASE_PITCH + pitch_add
                                key_pitches[key_id] = pitch
                                m.note_on(CHANNEL, pitch)
                        elif r == 1 or DOUBLE_ADDS[col_idx] is None:
                            # Row 1: single key (normal)
                            pitch_add = SINGLE_ADDS[col_idx]
                            if pitch_add is not None:
                                pitch = BASE_PITCH + pitch_add
                                key_pitches[key_id] = pitch
                                m.note_on(CHANNEL, pitch)

                if key_id == 26:
                    if PITCH_MOD != -4:
                        PITCH_MOD -= 1

                if key_id == 27:
                    if PITCH_MOD != 3:
                        PITCH_MOD += 1

            if not current_state[r][c] and keeb.last_state[r][c]:
                pressed.discard(key_id)
                if (r == 1 or r == 0) and c > 2:
                    m.note_off(CHANNEL, key_pitches[key_id])
                print("release:", key_id)

    if 26 in pressed and 27 in pressed:
        PITCH_MOD = 0

    if 24 in pressed and 29 in pressed:
        if MODE == 2:
            MODE = 0
        else:
            MODE += 1
        MODE_CHANGE = True

    flat_state = [item for row in current_state for item in row]
    hid.send_data(PITCH_MOD, flat_state)
    # hid.write(bytes([PITCH_MOD, 0, 0, 0, 0, 0, 0, 0]))
    keeb.last_state = current_state
    if MODE_CHANGE:
        time.sleep(0.2)
        MODE_CHANGE = False
    else:
        time.sleep(0.01)

    # time.sleep(1)
    # print(f"TX Note On channel {CHANNEL} pitch {PITCH}")
    # m.note_on(CHANNEL, PITCH)  # Velocity is an optional third argument
    # time.sleep(0.5)
    # print(f"TX Note Off channel {CHANNEL} pitch {PITCH}")
    # m.note_off(CHANNEL, PITCH)
    # time.sleep(1)
    # print(f"TX Control channel {CHANNEL} controller {CONTROLLER} value {control_val}")
    # m.control_change(CHANNEL, CONTROLLER, control_val)
    # control_val += 1
    # if control_val == 0x7F:
    #     control_val = 0
    # time.sleep(1)
