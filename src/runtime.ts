import { Layer, ManagedRuntime } from "effect";
import { ModelProvider } from "./model.provider";

const allLive = Layer.mergeAll(
  ModelProvider.Default
  // Logger.withMinimumLogLevel(LogLevel.Debug)
);

export const Runtime = ManagedRuntime.make(allLive);
