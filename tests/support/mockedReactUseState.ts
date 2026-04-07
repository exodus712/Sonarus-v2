import type React from "react";

export const setStateCalls: unknown[] = [];

export function mockedUseState<T>(initialState: T | (() => T)) {
  const actual = jest.requireActual("react") as typeof React;
  const [value, setValue] = actual.useState(initialState);
  const trackedSetter: typeof setValue = (nextValue) => {
    setStateCalls.push(nextValue);
    return setValue(nextValue);
  };

  return [value, trackedSetter] as const;
}
