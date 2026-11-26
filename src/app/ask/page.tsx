import { ProfileGate } from "@/components/profile-gate";
import { Screen07 } from "@/components/screens/screen-07";

// الشاشة 07 — اسألي راحة: مستشار يذكر طفلك.
export default function AskPage() {
  return (
    <ProfileGate>
      <Screen07 />
    </ProfileGate>
  );
}
