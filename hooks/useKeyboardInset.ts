import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * 每個間距對應兩組類別：鍵盤收起時保留底部安全區，鍵盤升起時只留一般間距。
 * 類別字串必須是字面值，Uniwind 才掃得到。
 */
const SAFE_PAD = {
  2: ['pb-safe-offset-2', 'pb-2'],
  3: ['pb-safe-offset-3', 'pb-3'],
  4: ['pb-safe-offset-4', 'pb-4'],
  5: ['pb-safe-offset-5', 'pb-5'],
  6: ['pb-safe-offset-6', 'pb-6'],
} as const;

export type KeyboardPadSize = keyof typeof SAFE_PAD;

/** 鍵盤目前是否顯示在畫面上。 */
export function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const isIOS = Platform.OS === 'ios';
    const show = Keyboard.addListener(isIOS ? 'keyboardWillShow' : 'keyboardDidShow', () =>
      setOpen(true),
    );
    const hide = Keyboard.addListener(isIOS ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setOpen(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return open;
}

/**
 * 給 KeyboardAvoidingView 內的底部容器使用的間距類別。
 *
 * 鍵盤避讓的高度已經含到螢幕最底部（iOS 的 Home Indicator、Android 的導覽列），
 * 若同時保留 pb-safe-offset-*，鍵盤上方就會多出一條空白，看起來像鍵盤變矮了。
 * 因此鍵盤升起時改用不含安全區的間距，收起時再補回來。
 */
export function useKeyboardSafePad(size: KeyboardPadSize): string {
  const open = useKeyboardOpen();
  const [closedClass, openClass] = SAFE_PAD[size];
  return open ? openClass : closedClass;
}

/**
 * 鍵盤升起時把列表捲到底部。
 *
 * 鍵盤出現後可視高度變小，但捲動位置維持原本的偏移量，最後幾則訊息會落在可視範圍下方，
 * 使用者得手動往下滑才看得到。這個 hook 在鍵盤出現（以及 iOS 上鍵盤高度變化）時
 * 重新捲到底部；是否真的要捲由呼叫端決定（例如使用者正在往上翻歷史時就不該跳走）。
 */
export function useScrollToEndOnKeyboard(scrollToEnd: (animated: boolean) => void): void {
  const handler = useRef(scrollToEnd);

  useEffect(() => {
    handler.current = scrollToEnd;
  }, [scrollToEnd]);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      handler.current(true);
      // 版面在鍵盤動畫結束後才穩定，補一次確保真的停在最後一則。
      timers.push(setTimeout(() => handler.current(true), 160));
    };

    const events =
      Platform.OS === 'ios'
        ? (['keyboardWillShow', 'keyboardDidShow', 'keyboardDidChangeFrame'] as const)
        : (['keyboardDidShow'] as const);
    const subscriptions = events.map((event) => Keyboard.addListener(event, run));

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
      timers.forEach(clearTimeout);
    };
  }, []);
}
