import { useEffect, useRef } from 'react';

interface KeyboardHandlers {
  onSpace?: () => void;
  onAuto?: () => void;
  onNumber?: (num: number) => void;
  onEscape?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onEnter?: () => void;
}

function useKeyboard(handlers: KeyboardHandlers) {
  const handlersRef = useRef(handlers);

  // 保持引用最新
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const h = handlersRef.current;

      // 如果正在输入框中，不触发快捷键
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case 'Space': {
          e.preventDefault();
          h.onSpace?.();
          break;
        }
        case 'KeyA': {
          h.onAuto?.();
          break;
        }
        case 'KeyE': {
          h.onEscape?.();
          break;
        }
        case 'Enter': {
          h.onEnter?.();
          break;
        }
        case 'ArrowUp': {
          h.onArrowUp?.();
          break;
        }
        case 'ArrowDown': {
          h.onArrowDown?.();
          break;
        }
        case 'Digit1':
        case 'Numpad1': {
          h.onNumber?.(1);
          break;
        }
        case 'Digit2':
        case 'Numpad2': {
          h.onNumber?.(2);
          break;
        }
        case 'Digit3':
        case 'Numpad3': {
          h.onNumber?.(3);
          break;
        }
        case 'Digit4':
        case 'Numpad4': {
          h.onNumber?.(4);
          break;
        }
        case 'Digit5':
        case 'Numpad5': {
          h.onNumber?.(5);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}

export default useKeyboard;
