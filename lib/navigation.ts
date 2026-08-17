import { router, useNavigationContainerRef, type Href } from 'expo-router';
import { useEffect, useState } from 'react';

export function goBackOrReplace(fallback: Href) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

/**
 * 根導覽器是否已掛載完成。
 *
 * 掛在 root layout 裡的閘門元件（AuthGate / WebAdminGate / PushBridge）第一次
 * useEffect 會早於 expo-router 根導覽器完成掛載，此時呼叫 router.replace 會丟出
 * 「Attempted to navigate before mounting the Root Layout component」。
 * 這類第一次渲染就要導向的情境，一律等這個訊號為 true 再導。
 */
export function useNavigationReady(): boolean {
  const navigationRef = useNavigationContainerRef();
  const [ready, setReady] = useState(() => navigationRef.isReady());

  useEffect(() => {
    if (ready) return undefined;
    if (navigationRef.isReady()) {
      setReady(true);
      return undefined;
    }
    // 導覽容器掛載完成時會發出 ready 事件；此監聽在容器就緒前註冊也會被保留。
    return navigationRef.addListener('ready', () => setReady(true));
  }, [navigationRef, ready]);

  return ready;
}
