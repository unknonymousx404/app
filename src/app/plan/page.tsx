import { ProfileGate } from "@/components/profile-gate";
import { Screen03 } from "@/components/screens/screen-03";

// الشاشة 03 — الخطة الأولى: لحظة القيمة.
// لا تُفتح بلا ملف طفل محفوظ أو وضع عرض (?demo=1) — لا خطة يتيمة.
export default function PlanPage() {
  return (
    <ProfileGate>
      <Screen03 />
    </ProfileGate>
  );
}
