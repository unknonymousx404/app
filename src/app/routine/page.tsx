import { ProfileGate } from "@/components/profile-gate";
import { Screen04 } from "@/components/screens/screen-04";

// الشاشة 04 — روتين التهدئة: الخطة تتحرك في البيت.
export default function RoutinePage() {
  return (
    <ProfileGate>
      <Screen04 />
    </ProfileGate>
  );
}
