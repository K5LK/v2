import { ui } from "./ui";

export function useTranslations(_lang?: string | null) {
  void _lang;
  return function t(key: keyof (typeof ui)["en"]) {
    return ui.en[key];
  };
}

/**
 * Checks whether a navigation route is active given the current pathname and target route.
 * Handles trailing slashes and matches by exact path or root segment.
 */
export function isActive(currentPath: string, targetPath: string): boolean {
  const normalizedCurrent =
    currentPath.endsWith("/") && currentPath !== "/"
      ? currentPath.slice(0, -1)
      : currentPath;

  const currentPathArray = normalizedCurrent.split("/").filter(p => p.trim());
  const targetPathArray = targetPath.split("/").filter(p => p.trim());

  return (
    normalizedCurrent === targetPath ||
    (currentPathArray.length > 0 && currentPathArray[0] === targetPathArray[0])
  );
}
