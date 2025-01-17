import useLatest from '../useLatest';
import type { BasicTarget } from '../utils/domTarget';
import { getTargetElement } from '../utils/domTarget';
import getDocumentOrShadow from '../utils/getDocumentOrShadow';
import useEffectWithTarget from '../utils/useEffectWithTarget';

type DocumentEventKey = keyof DocumentEventMap;

export default function useClickAway<T extends Event = Event>(
  onClickAway: (event: T) => void,
  target: BasicTarget | BasicTarget[],
  eventName: DocumentEventKey | DocumentEventKey[] = 'click',
) {
  const onClickAwayRef = useLatest(onClickAway);

  useEffectWithTarget(
    () => {
      const handler = (event: T) => {
        const targets = Array.isArray(target) ? target : [target];
        if (
          targets.some((item) => {
            const targetElement = getTargetElement(item);
            return !targetElement || event.composedPath().includes(targetElement);
          })
        ) {
          return;
        }
        onClickAwayRef.current(event);
      };

      const targets = Array.isArray(target) ? target : [target];
      const eventNames = Array.isArray(eventName) ? eventName : [eventName];

      const removeEventListeners = targets.map((item) => {
        const targetElement = getTargetElement(item);
        const documentOrShadow = getDocumentOrShadow(targetElement);

        if (documentOrShadow) {
          eventNames.forEach((event) => documentOrShadow.addEventListener(event, handler));
          return () =>
            eventNames.forEach((event) => documentOrShadow.removeEventListener(event, handler));
        }

        return () => {};
      });

      return () => {
        removeEventListeners.forEach((item) => item());
      };
    },
    Array.isArray(eventName) ? eventName : [eventName],
    target,
  );
}
