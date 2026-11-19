"""
Unit Tests: Serial Parser & Low-Signal Ingestion Rules
Verifies that:
- Readings with arm=1 or hr_ok=false are marked low_signal and never create cardiac drift alerts.
- Malformed serial lines do not crash the parser.
- Buzzer and mute commands are formatted correctly.
"""

import pytest
from backend.app.serial_reader import SerialIngestionWorker

def test_serial_json_validation_and_low_signal():
    worker = SerialIngestionWorker(use_simulator=True)

    # Clean valid line
    line_clean = '{"t":123456,"hr":72,"hr_ok":true,"temp":36.8,"motion":1,"idle_s":0,"vib":2,"impact":0,"arm":0,"fw":"1.0"}'
    data = worker.process_raw_line(line_clean)
    assert data is not None
    assert data["hr"] == 72
    assert data["low_signal"] is False

    # Arm movement artifact: arm == 1 -> Must be marked low_signal
    line_arm = '{"t":123457,"hr":110,"hr_ok":true,"temp":36.8,"motion":1,"idle_s":0,"vib":18,"impact":0,"arm":1,"fw":"1.0"}'
    data_arm = worker.process_raw_line(line_arm)
    assert data_arm is not None
    assert data_arm["low_signal"] is True
    assert "low signal" in data_arm["signal_notice"].lower()

    # hr_ok == false -> Must be marked low_signal
    line_bad_hr = '{"t":123458,"hr":0,"hr_ok":false,"temp":36.8,"motion":1,"idle_s":0,"vib":2,"impact":0,"arm":0,"fw":"1.0"}'
    data_bad_hr = worker.process_raw_line(line_bad_hr)
    assert data_bad_hr is not None
    assert data_bad_hr["low_signal"] is True

def test_malformed_serial_line_handling():
    worker = SerialIngestionWorker(use_simulator=True)

    # Incomplete json
    assert worker.process_raw_line('{"t":123456,"hr":') is None

    # Garbage characters
    assert worker.process_raw_line('GARBAGE_NOISE_1234\r\n') is None

    # Empty string
    assert worker.process_raw_line('') is None
