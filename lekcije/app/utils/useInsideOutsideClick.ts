import { useEffect } from "react";
export function useInsideOutsideClick(
  elementRef: React.RefObject<HTMLElement | null>,
  clickHandler: (isInside: boolean) => void
) {
  useEffect(() => {
    const handleClick = function (event: MouseEvent) {
      const dropdownToggle = elementRef.current;
      if (dropdownToggle === null) {
        throw new Error("Error,  this ref should never be null");
      }
      if (dropdownToggle.contains(event.target as any)) {
        clickHandler(true);
      } else {
        clickHandler(false);
      }
    };

    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);
}
