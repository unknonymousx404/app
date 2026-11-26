import { ProfileGate } from "@/components/profile-gate";
import { Screen08 } from "@/components/screens/screen-08";

// الشاشة 08 — لحظات التقدم: أرقام تُروى كقصة، وإنجازات تُقاس بالالتزام.
export default function ProgressPage() {
  return (
    <ProfileGate>
      <Screen08 />
    </ProfileGate>
  );
}
