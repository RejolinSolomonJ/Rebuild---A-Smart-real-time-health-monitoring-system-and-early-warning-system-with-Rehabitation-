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
        baud: int = 115200,
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
        """
        line = line.strip()
        if not line:
            return None

        self.last_raw_line = line
        self.last_packet_time = time.time()

        data: Optional[Dict[str, Any]] = None

        # 1. Try parsing JSON format: {"hr":72,"temp":36.6,...}
        if line.startswith("{") and line.endswith("}"):
            try:
                data = json.loads(line)
            except json.JSONDecodeError:
                logger.warning(f"Malformed serial JSON dropped: {line}")
                return None

        # 2. Try parsing Key-Value format: T=36.6,H=52.0,HR=72,HR_OK=1,MOT=1,IDLE=0,VIB=2,IMP=0,STATE=S_NORMAL
        elif "=" in line and ("T=" in line or "HR=" in line or "MOT=" in line):
            try:
                kv = {}
                for part in line.split(","):
                    if "=" in part:
                        k, v = part.split("=", 1)
                        kv[k.strip().upper()] = v.strip()

                temp_val = float(kv.get("T", 36.6))
                hum_val = float(kv.get("H", 52.0))
                hr_raw = int(float(kv.get("HR", 0)))
                hr_ok_raw = kv.get("HR_OK", "1" if hr_raw > 0 else "0")
                hr_ok_bool = bool(int(float(hr_ok_raw))) and (hr_raw > 0)

                data = {
                    "t": int(time.time() * 1000),
                    "temp": temp_val,
                    "humidity": hum_val,
                    "hr": hr_raw if hr_ok_bool else 0,
                    "hr_ok": hr_ok_bool,
                    "motion": int(float(kv.get("MOT", 0))),
                    "idle_s": int(float(kv.get("IDLE", 0))),
                    "vib": int(float(kv.get("VIB", 0))),
                    "impact": int(float(kv.get("IMP", 0))),
                    "arm": int(float(kv.get("ARM", 0))),
                    "system_state": kv.get("STATE", "S_NORMAL"),
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
        """
        import serial

        while self.running and not self.use_simulator:
            target_port = self.pick_target_port()
            if not target_port:
                logger.info("No hardware COM port found. Waiting 3 seconds before next scan...")
                self.connected_port = None
                await asyncio.sleep(3.0)
                continue

            logger.info(f"Connecting to hardware serial on {target_port} at {self.baud} baud...")

            try:
                self.serial_conn = serial.Serial(target_port, self.baud, timeout=1.0)
                self.connected_port = target_port
                logger.info(f"Hardware serial CONNECTED successfully on {target_port}!")

                while self.running and not self.use_simulator and self.serial_conn and self.serial_conn.is_open:
                    if self.serial_conn.in_waiting:
                        raw_bytes = self.serial_conn.readline()
                        try:
                            line = raw_bytes.decode("utf-8", errors="replace")
                            self.process_raw_line(line)
                        except Exception as e:
                            logger.error(f"Error parsing serial line: {e}")
                    await asyncio.sleep(0.02)

            except Exception as e:
                logger.warning(f"Serial port {target_port} unavailable ({e}). Reconnecting in 3 seconds...")
                if self.serial_conn:
                    try:
                        self.serial_conn.close()
                    except Exception:
                        pass
                    self.serial_conn = None
                self.connected_port = None
                await asyncio.sleep(3.0)
