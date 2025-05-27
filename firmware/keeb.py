import json
import time
from machine import Pin


config_json = """
{
    "usb": {
        "device_version": "0.0.4",
        "force_nkro": true
    },
    "features": {
        "bootmagic": true,
        "command": false,
        "console": false,
        "extrakey": true,
        "mousekey": false,
        "nkro": true,
        "steno": true
    },
    "matrix_pins": {
        "cols": ["GP24", "GP23", "GP21", "GP20", "GP19", "GP6", "GP5", "GP4", "GP3", "GP2", "GP1"],
        "rows": ["GP25", "GP18", "GP17"]
    },
    "diode_direction": "COL2ROW",
    "processor": "RP2040",
    "bootloader": "rp2040",
    "layouts": {
        "LAYOUT": {
            "layout": [
                {"matrix": [0, 0], "x": 0, "y": 0},
                {"matrix": [0, 1], "x": 1, "y": 0},
                {"matrix": [0, 2], "x": 2, "y": 0},
                {"matrix": [0, 3], "x": 3, "y": 0},
                {"matrix": [0, 4], "x": 4, "y": 0},
                {"matrix": [0, 5], "x": 7, "y": 0},
                {"matrix": [0, 6], "x": 8, "y": 0},
                {"matrix": [0, 7], "x": 9, "y": 0},
                {"matrix": [0, 8], "x": 10, "y": 0},
                {"matrix": [0, 9], "x": 11, "y": 0},
                {"matrix": [0, 10], "x": 12, "y": 0},
                {"matrix": [1, 0], "x": 0, "y": 1},
                {"matrix": [1, 1], "x": 1, "y": 1},
                {"matrix": [1, 2], "x": 2, "y": 1},
                {"matrix": [1, 3], "x": 3, "y": 1},
                {"matrix": [1, 4], "x": 4, "y": 1},
                {"matrix": [1, 5], "x": 7, "y": 1},
                {"matrix": [1, 6], "x": 8, "y": 1},
                {"matrix": [1, 7], "x": 9, "y": 1},
                {"matrix": [1, 8], "x": 10, "y": 1},
                {"matrix": [1, 9], "x": 11, "y": 1},
                {"matrix": [1, 10], "x": 12, "y": 1},
                {"matrix": [2, 2], "x": 2, "y": 3},
                {"matrix": [2, 3], "x": 3, "y": 3},
                {"matrix": [2, 4], "x": 4, "y": 3},
                {"matrix": [2, 5], "x": 7, "y": 3},
                {"matrix": [2, 6], "x": 8, "y": 3},
                {"matrix": [2, 7], "x": 9, "y": 3}
            ]
        }
    }
}
"""

config = json.loads(config_json)
cols = [int(pin[2:]) for pin in config["matrix_pins"]["cols"]]
rows = [int(pin[2:]) for pin in config["matrix_pins"]["rows"]]
diode_direction = config["diode_direction"]

num_rows = len(rows)
num_cols = len(cols)
last_state = [[0] * num_cols for _ in range(num_rows)]

# Assign drive and sense pins based on diode direction
if diode_direction == "COL2ROW":
    drive_pins = [Pin(pin_num, Pin.OUT) for pin_num in cols]
    sense_pins = [Pin(pin_num, Pin.IN, Pin.PULL_DOWN) for pin_num in rows]
    drive_count = num_cols
    sense_count = num_rows
    drive_first = True
elif diode_direction == "ROW2COL":
    drive_pins = [Pin(pin_num, Pin.OUT) for pin_num in rows]
    sense_pins = [Pin(pin_num, Pin.IN, Pin.PULL_DOWN) for pin_num in cols]
    drive_count = num_rows
    sense_count = num_cols
    drive_first = False
else:
    raise ValueError("Unsupported diode_direction: {}".format(diode_direction))


def scan_matrix():
    state = [[0] * num_cols for _ in range(num_rows)]
    for d in range(drive_count):
        # Set this drive pin high, others low
        for i, pin in enumerate(drive_pins):
            pin.value(1 if i == d else 0)
        time.sleep_us(50)
        for s in range(sense_count):
            val = sense_pins[s].value()
            # Map to [row][col] regardless of direction
            if drive_first:
                state[s][d] = val
            else:
                state[d][s] = val
    # Set all drive pins low after scan
    for pin in drive_pins:
        pin.value(0)
    return state
