import SeatMap from "./SeatMap";

// The "الحضور والانصراف" tab is the live floor-plan seat map (assign / release /
// attendance). The map itself lives in the shared <SeatMap /> so the exact same
// interactive diagram can also be embedded in the "حجوزات المقاعد" tab.
export default function AdminAttendance() {
  return <SeatMap />;
}
