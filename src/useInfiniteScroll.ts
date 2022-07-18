import { RefObject, useCallback, useMemo, useRef } from "react";

import useEvent from "./useEvent";
import isFunction from "./shared/isFunction";
import createHandlerSetter from "./factory/createHandlerSetter";

import { CallbackSetter, SomeCallback } from "./shared/types";

/**useInfiniteScroll options */
interface IOptions {
  /**monitor which direction of scrolling */
  direction: "x" | "y" | "both";
  /**distance from the bottom of the ref element when the callback is called */
  distance?: number;
  /**never call preventDefault() */
  passive?: boolean;
  /**use capture */
  capture?: boolean;
  /**callback function */
  callback?: SomeCallback<void, any>;
  /**delay callback */
  delay?: number;
}

/**default event options */
const DEFAULT_EVENT_OPTIONS = { passive: true, capture: false };

/**default element state */
const DEFAULT_ELEMENT_STATE = {
  scrollWidth: -1,
  scrollHeight: -1,
};

/**reload useInfiniteScroll to add more features */
interface IUseInfiniteScroll<TElement extends HTMLElement = HTMLElement> {
  (ref: RefObject<TElement>, delay?: number): CallbackSetter<void>;
  (ref: RefObject<TElement>, options: IOptions): CallbackSetter<void>;
}

const useInfiniteScrollByDelay = <TElement extends HTMLElement>(
  ref: RefObject<TElement>,
  delay?: number
): CallbackSetter<void> => {
  const elementStateRef = useRef(DEFAULT_ELEMENT_STATE);

  const onScroll = useEvent<UIEvent, TElement>(
    ref,
    "scroll",
    DEFAULT_EVENT_OPTIONS
  );

  const [onScrollEnd, setOnScrollEnd] = createHandlerSetter<void, any>();

  const handleScroll = ({ target, currentTarget }: UIEvent) => {
    if (
      target === currentTarget &&
      target instanceof HTMLElement &&
      target.scrollHeight !== elementStateRef.current.scrollHeight &&
      target.scrollHeight < target.clientHeight + target.scrollTop + 10
    ) {
      elementStateRef.current = {
        scrollWidth: -1,
        scrollHeight: target.scrollHeight,
      };
      if (onScrollEnd.current) {
        delay ? setTimeout(onScrollEnd.current, delay) : onScrollEnd.current();
      }
    }
  };

  onScroll(handleScroll);

  return setOnScrollEnd;
};

const useInfiniteScrollByOptions = <TElement extends HTMLElement>(
  ref: RefObject<TElement>,
  options: IOptions
): CallbackSetter<void> => {
  const eventOptionsRef = useRef(DEFAULT_EVENT_OPTIONS);
  const elementStateRef = useRef(DEFAULT_ELEMENT_STATE);

  if (typeof options === "object") {
    const { current } = eventOptionsRef;
    if (
      options.capture !== current.capture ||
      options.passive !== current.passive
    ) {
      eventOptionsRef.current = { ...DEFAULT_EVENT_OPTIONS };
      eventOptionsRef.current.capture = options.capture;
      eventOptionsRef.current.passive = options.passive;
    }
  }
  const onScroll = useEvent<UIEvent, TElement>(
    ref,
    "scroll",
    eventOptionsRef.current
  );
  const [onScrollEnd, setOnScrollEnd] = createHandlerSetter<void, any>();

  const handleScroll = ({ target, currentTarget }: UIEvent) => {
    if (
      target === currentTarget &&
      target instanceof HTMLElement &&
      (target.scrollHeight !== elementStateRef.current.scrollHeight ||
        target.scrollWidth !== elementStateRef.current.scrollWidth)
    ) {
      const delay = options.delay || 250,
        distance = options.distance || 10,
        inBottomOfY =
          target.scrollHeight <
          target.clientHeight + target.scrollTop + distance,
        inBottomOfX =
          target.scrollWidth <
          target.clientWidth + target.scrollLeft + distance;

      if (
        (options.direction === "y" && inBottomOfY) ||
        (options.direction === "x" && inBottomOfX) ||
        inBottomOfX ||
        inBottomOfY
      ) {
        elementStateRef.current = {
          scrollWidth: target.scrollWidth,
          scrollHeight: target.scrollHeight,
        };
        if (onScrollEnd.current) {
          delay
            ? setTimeout(onScrollEnd.current, delay)
            : onScrollEnd.current();
        }
      }
    }
  };

  options.callback && setOnScrollEnd(options.callback);
  onScroll(handleScroll);

  return setOnScrollEnd;
};

/**
 * Accepts an HTML Element ref, then returns a function that allows you to handle the infinite
 * scroll for that specific element.
 */
const useInfiniteScroll: IUseInfiniteScroll = (ref, options) => {
  type TElement = typeof ref["current"];

  if (typeof options === "undefined" || typeof options === "number") {
    return useInfiniteScrollByDelay<TElement>(ref, options);
  } else if (options && typeof options === "object") {
    return useInfiniteScrollByOptions<TElement>(ref, options);
  } else {
    throw new TypeError("please make sure to pass in the correct parameters");
  }
};

export default useInfiniteScroll;
