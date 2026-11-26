import { ProfileGate } from "@/components/profile-gate";
import { Screen06 } from "@/components/screens/screen-06";

// الشاشة 06 — خطة اليوم المعدّلة: وجه الحصرية الأولى.
export default function AdjustedPlanPage() {
  return (
    <ProfileGate>
      <Screen06 />
    </ProfileGate>
  );
}
