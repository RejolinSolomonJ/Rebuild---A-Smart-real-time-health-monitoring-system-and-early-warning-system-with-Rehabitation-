"""
Serial Reader & Ingestion Engine for ReBuild
Reads 1-Hz JSON or Key-Value lines from Arduino Uno/Nano or Simulator over serial/socket.
Validates telemetry, handles auto-reconnect, marks low-signal conditions,
and sends buzzer commands back to the hardware.
"""

import os
import json
import time
import asyncio
import logging
from typing import Optional, Callable, Dict, Any, List

logger = logging.getLogger("rebuild.serial")

class SerialIngestionWorker:
    def __init__(
        self,
        port: str = "AUTO",
        baud: int = 9600,
        use_simulator: bool = True,
        on_reading_callback: Optional[Callable[[Dict[str, Any]], None]] = None
    ):
        self.port = port
        self.baud = baud
        self.use_simulator = use_simulator
        self.on_reading = on_reading_callback

        self.running = False
        self.serial_conn = None
        self.recent_buffer: List[Dict[str, Any]] = []
        self.max_buffer_size = 300
        self.connected_port: Optional[str] = None
        self.last_packet_time: Optional[float] = None
        self.last_raw_line: Optional[str] = None
        self.last_error: Optional[str] = None
        self._loop_task: Optional[asyncio.Task] = None

    @staticmethod
    def scan_ports() -> List[Dict[str, str]]:
        """
        Scans for available serial/COM ports on the host.
        """
        try:
            import serial.tools.list_ports
            ports = list(serial.tools.list_ports.comports())
            return [
                {
                    "port": p.device,
                    "description": p.description,
                    "hwid": p.hwid or ""
                }
                for p in ports
            ]
        except Exception as e:
            logger.error(f"Error scanning COM ports: {e}")
            return []

    def start(self):
        self.running = True

    def stop(self):
        self.running = False
        if self.serial_conn:
            try:
                self.serial_conn.close()
            except Exception:
                pass
            self.serial_conn = None
        self.connected_port = None

    def get_status(self) -> Dict[str, Any]:
        return {
            "mode": "hardware" if not self.use_simulator else "simulator",
            "connected": bool(self.serial_conn and self.serial_conn.is_open),
            "port": self.connected_port or self.port,
            "baud": self.baud,
            "last_packet_time": self.last_packet_time,
            "last_raw_line": self.last_raw_line,
            "last_error": self.last_error,
            "available_ports": self.scan_ports()
        }

    def send_command(self, cmd_dict: Dict[str, Any]):
        """
        Sends JSON command to Arduino (e.g. {"cmd":"buzz","pattern":2})
        """
        payload = json.dumps(cmd_dict) + "\n"
        if self.serial_conn and self.serial_conn.is_open and not self.use_simulator:
            try:
                self.serial_conn.write(payload.encode("utf-8"))
                logger.info(f"Command dispatched to hardware: {payload.strip()}")
            except Exception as e:
                logger.error(f"Failed to send command to serial port: {e}")
        else:
            logger.info(f"[Simulator/Hardware Command Bus]: {payload.strip()}")

    def process_raw_line(self, line: str) -> Optional[Dict[str, Any]]:
        """
        Parses JSON line or Key-Value line from serial or simulator
        and performs signal-quality validation.
        Supports both ReBuild standard telemetry and sentinel_lcdac (T=...,H=...,MOTION=...,VIB=...,IDLE=...,STATE=...).
        """
        import math
        line = line.strip()
        if not line:
            return None

        self.last_raw_line = line
        self.last_packet_time = time.time()
        self.last_error = None

        data: Optional[Dict[str, Any]] = None

        # 1. Try parsing JSON format: {"hr":72,"temp":36.6,...}
        if line.startswith("{") and line.endswith("}"):
            try:
                data = json.loads(line)
            except json.JSONDecodeError:
                logger.warning(f"Malformed serial JSON dropped: {line}")
                return None

        # 2. Try parsing Key-Value format (e.g., T=28.5,H=60.2,MOTION=1,VIB=0,IDLE=4,STATE=NORMAL)
        elif "=" in line and any(k in line.upper() for k in ["T=", "H=", "HR=", "MOT=", "MOTION="]):
            try:
                kv = {}
                for part in line.split(","):
                    if "=" in part:
                        k, v = part.split("=", 1)
                        kv[k.strip().upper()] = v.strip()

                # Temperature parsing with NaN safe fallback
                raw_t = kv.get("T", "36.6")
                try:
                    temp_val = float(raw_t)
                    if math.isnan(temp_val) or math.isinf(temp_val):
                        temp_val = 36.6
                except (ValueError, TypeError):
                    temp_val = 36.6

                # Humidity parsing with NaN safe fallback
                raw_h = kv.get("H", "52.0")
                try:
                    hum_val = float(raw_h)
                    if math.isnan(hum_val) or math.isinf(hum_val):
                        hum_val = 52.0
                except (ValueError, TypeError):
                    hum_val = 52.0

                # Heart rate: sentinel_lcdac has no HR sensor, so defaults to 0 and hr_ok=False
                hr_raw = 0
                if "HR" in kv and kv.get("HR") != "NaN":
                    try:
                        hr_raw = int(float(kv.get("HR", 0)))
                    except Exception:
                        hr_raw = 0

                hr_ok_raw = kv.get("HR_OK", "1" if hr_raw > 0 else "0")
                hr_ok_bool = bool(int(float(hr_ok_raw))) and (hr_raw > 0)

                # Motion: support both MOTION= and MOT=
                motion_raw = kv.get("MOTION", kv.get("MOT", 0))
                try:
                    motion_val = int(float(motion_raw))
                except Exception:
                    motion_val = 0

                # Vibration
                vib_raw = kv.get("VIB", 0)
                try:
                    vib_val = int(float(vib_raw))
                except Exception:
                    vib_val = 0

                # Idle seconds
                idle_raw = kv.get("IDLE", 0)
                try:
                    idle_val = int(float(idle_raw))
                except Exception:
                    idle_val = 0

                # Impact
                imp_raw = kv.get("IMP", kv.get("IMPACT", 0))
                try:
                    imp_val = int(float(imp_raw))
                except Exception:
                    imp_val = 0

                # State mapping: "NORMAL", "HIGH TEMP", "INACTIVE", "FALL CHECK", "FALL ALARM"
                raw_state = kv.get("STATE", "S_NORMAL").strip().upper()
                if raw_state in ["NORMAL", "S_NORMAL"]:
                    state_val = "S_NORMAL"
                elif "HIGH" in raw_state or "TEMP" in raw_state:
                    state_val = "S_HIGH_TEMP"
                elif "INACTIVE" in raw_state:
                    state_val = "S_INACTIVE"
                elif "CHECK" in raw_state:
                    state_val = "S_FALL_CHECK"
                elif "ALARM" in raw_state or "ALERT" in raw_state:
                    state_val = "S_FALL_ALARM"
                else:
                    state_val = raw_state

                data = {
                    "t": int(time.time() * 1000),
                    "temp": temp_val,
                    "humidity": hum_val,
                    "hr": hr_raw if hr_ok_bool else 0,
                    "hr_ok": hr_ok_bool,
                    "motion": motion_val,
                    "idle_s": idle_val,
                    "vib": vib_val,
                    "impact": imp_val,
                    "arm": int(float(kv.get("ARM", 0))),
                    "system_state": state_val,
                    "fw": "1.0"
                }
            except Exception as e:
                logger.warning(f"Error parsing key-value serial format: {e} | Line: {line}")
                return None

        if not data:
            return None

        # Ensure minimal required fields
        if "temp" not in data:
            data["temp"] = 36.6
        if "motion" not in data:
            data["motion"] = 0
        if "hr" not in data:
            data["hr"] = 0
            data["hr_ok"] = False

        # Signal Quality Check:
        hr_ok = bool(data.get("hr_ok", False))
        arm = int(data.get("arm", 0))

        if not hr_ok or data.get("hr", 0) <= 0:
            data["hr_ok"] = False
            data["low_signal"] = True
            data["signal_notice"] = "Heartbeat sensor is not connected. Attach pulse sensor."
        elif arm == 1:
            data["low_signal"] = True
            data["signal_notice"] = "Low signal or arm movement detected; adjust sensor"
        else:
            data["low_signal"] = False
            data["signal_notice"] = "Optimal signal"

        # Maintain in-memory ring buffer
        self.recent_buffer.append(data)
        if len(self.recent_buffer) > self.max_buffer_size:
            self.recent_buffer.pop(0)

        if self.on_reading:
            self.on_reading(data)

        return data

    def pick_target_port(self) -> Optional[str]:
        """
        Determines the appropriate COM port to connect to.
        If port is explicitly specified (e.g. 'COM3'), tests that.
        If 'AUTO', scans for any connected Arduino or USB serial device.
        """
        available = self.scan_ports()
        if not available:
            return None

        if self.port and self.port != "AUTO":
            for p in available:
                if p["port"].upper() == self.port.upper():
                    return p["port"]

        # AUTO detection: prioritize devices with 'arduino', 'ch340', 'ftdi', 'cp210', 'usb' in description
        for p in available:
            desc = p["description"].lower()
            if any(term in desc for term in ["arduino", "ch340", "ftdi", "cp210", "usb-serial", "usb serial"]):
                return p["port"]

        # Fallback to the first available COM port
        return available[0]["port"]

    async def run_serial_loop(self):
        """
        Async worker loop with resilient auto-reconnect for hardware serial.
        Automatically attaches to Arduino on COM3 as soon as port becomes available.
        """
        import serial

        while self.running:
            target_port = self.pick_target_port()
            if not target_port:
                self.connected_port = None
                await asyncio.sleep(3.0)
                continue

            try:
                self.serial_conn = serial.Serial(target_port, self.baud, timeout=1.0)
                self.connected_port = target_port
                self.use_simulator = False
                self.last_error = None
                logger.info(f"Hardware serial CONNECTED successfully on {target_port}!")

                while self.running and self.serial_conn and self.serial_conn.is_open:
                    if self.serial_conn.in_waiting:
                        raw_bytes = self.serial_conn.readline()
                        try:
                            line = raw_bytes.decode("utf-8", errors="replace")
                            self.process_raw_line(line)
                        except Exception as e:
                            logger.error(f"Error parsing serial line: {e}")
                    await asyncio.sleep(0.02)

            except Exception as e:
                err_str = str(e)
                if "PermissionError" in err_str or "Access is denied" in err_str:
                    friendly_err = f"Port {target_port} is open in Arduino IDE. Please close the Serial Monitor in Arduino IDE so ReBuild4 can stream live sensor data."
                else:
                    friendly_err = f"Serial port {target_port} error: {err_str}"
                self.last_error = friendly_err
                if self.serial_conn:
                    try:
                        self.serial_conn.close()
                    except Exception:
                        pass
                    self.serial_conn = None
                self.connected_port = None
                await asyncio.sleep(2.5)
