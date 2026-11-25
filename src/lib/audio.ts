"use client";

/**
 * تنبيه صوتي واحد خافت عند انتهاء مؤقت الخطوة — Web Audio بلا أي ملفات.
 *
 * نبرة هادئة: نغمة قصيرة تنزل بلطف ولا تُزعج. تُنشأ AudioContext مع أول
 * ضغط على زر (إيماءة مستخدم) لأن المتصفحات تمنع التشغيل التلقائي.
 */

type AudioContextCtor = new () => AudioContext;

function audioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;

  const scope = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };

  return scope.AudioContext ?? scope.webkitAudioContext ?? null;
}

/** يُعيد دالة تُنشئ تنبيهاً واحداً خافتاً كل مرة تُستدعى. */
export function createChime(): () => void {
  let context: AudioContext | null = null;

  return function chime(): void {
    try {
      const Ctor = audioContextCtor();
      if (!Ctor) return;

      if (!context) context = new Ctor();
      if (context.state === "suspended") void context.resume();

      const now = context.currentTime;

      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(660, now);
      oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.5);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.09, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(now);
      oscillator.stop(now + 1.2);
    } catch {
      // الصوت زينة — نتابع بلا تنبيه إن رفضه المتصفح.
    }
  };
}
