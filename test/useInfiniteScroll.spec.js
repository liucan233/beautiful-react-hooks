import { cleanup, renderHook } from "@testing-library/react-hooks";
import { expect } from "chai";
import Sinon from "sinon";
import useInfiniteScroll from "../dist/useInfiniteScroll";
import assertHook from "./utils/assertHook";

describe("useInfiniteScroll", () => {
  beforeEach(() => cleanup());

  assertHook(useInfiniteScroll);

  it("should return an callback setter", () => {
    const ref = { current: document.createElement("div") };
    const { result } = renderHook(() => useInfiniteScroll(ref));

    expect(result.current).to.be.a("function");
  });

  it("callback when scrolling to the right", () => {
    const element = document.createElement("div");
    element.style.height = "100px";
    element.style.width = "100px";
    element.style.overflow = "scroll scroll";
    element.style.display = "block";

    const subElement = document.createElement("div");
    subElement.style.width = "200px";
    subElement.style.height = "200px";

    element.appendChild(subElement);
    document.body.appendChild(element);

    // why result is 0?
    expect(element.scrollWidth).to.be.equal(200);

    const cb = Sinon.spy();

    const { result } = renderHook(() =>
      useInfiniteScroll(
        {
          current: element,
        },
        {
          passive: true,
          callback: cb,
          delay: 200,
          distance: 100,
          capture: true,
          direction: "x",
        }
      )
    );

    element.dispatchEvent(new Event("scroll"));

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (cb.calledOnce) {
          resolve();
        } else {
          reject("called " + cb.callCount + ", expect is 1");
        }
      }, 500);
    });
  });
});
