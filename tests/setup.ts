import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Ta bort det som ritats upp efter varje test så att testerna inte påverkar varandra.
afterEach(() => cleanup());
