import { useEffect, useRef } from "react";
import * as Haptics from "expo-haptics";
import { Audio } from "expo-av";

export function useLessonFeedback() {
  const correctSoundRef = useRef<Audio.Sound | null>(null);
  const wrongSoundRef = useRef<Audio.Sound | null>(null);
  const loadingPromiseRef = useRef<Promise<void> | null>(null);

  const ensureSoundsLoaded = async () => {
    if (correctSoundRef.current && wrongSoundRef.current) {
      return;
    }

    if (loadingPromiseRef.current) {
      await loadingPromiseRef.current;
      return;
    }

    loadingPromiseRef.current = (async () => {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
      });

      const [correctResult, wrongResult] = await Promise.all([
        Audio.Sound.createAsync(require("../assets/sounds/correct.wav")),
        Audio.Sound.createAsync(require("../assets/sounds/wrong.wav")),
      ]);

      correctSoundRef.current = correctResult.sound;
      wrongSoundRef.current = wrongResult.sound;
    })();

    try {
      await loadingPromiseRef.current;
    } finally {
      loadingPromiseRef.current = null;
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await ensureSoundsLoaded();

        if (!mounted) {
          await correctSoundRef.current?.unloadAsync();
          await wrongSoundRef.current?.unloadAsync();
          return;
        }
      } catch (error) {
        console.log("No se pudieron cargar los sonidos:", error);
      }
    })();

    return () => {
      mounted = false;
      void correctSoundRef.current?.unloadAsync();
      void wrongSoundRef.current?.unloadAsync();
    };
  }, []);

  const playCorrect = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await ensureSoundsLoaded();
    await correctSoundRef.current?.replayAsync();
  };

  const playWrong = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    await ensureSoundsLoaded();
    await wrongSoundRef.current?.replayAsync();
  };

  return {
    playCorrect,
    playWrong,
  };
}
