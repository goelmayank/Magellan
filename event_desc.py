"""
Contains functions dealing with event descriptions during the simulation/visualization
"""

EVENT_DESCRIPTION_TO_ID = {
    "Dri day Start": 100,
    "Dri day End": 99,

    "Pax 1M Request": 101,
    "Pax 0M Myopic": 102,
    "Pax 0M Non-Myopic": 103,
    "Pax FM Request": 104,

    "Dri from Station": 105,
    "Dri to Station": 106,
    "Dri adds Pax": 107,
    "Dri new Pax": 107,
    "Pax knows Dri": 107,

    "Pax enters Metro": 108,
    "Pax boards Train": 109,
    "Pax in Train": 109,
    "Pax deboards Train": 110,
    "Pax exits Metro": 111,

    "Dri picks 1M Pax": 112,
    "Pax enters 1M": 112,
    "Dri picks 0M Pax": 113,
    "Pax enters 0M": 113,

    "Dri drops 1M Pax": 114,
    "Pax 1M Done": 114,
    "Dri drops 0M Pax": 115,
    "Pax 0M Done": 115,

    "Dri updates Location":116,
    "Pax updates Location":117,

    "Dri error": 119,
    "Pax error": 120,

    "Dri ready Station": 121,
    "Pax waiting Dri": 122

}


def get_event_category(description):
    return EVENT_DESCRIPTION_TO_ID[description]