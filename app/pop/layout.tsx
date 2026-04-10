import type { ReactNode } from "react";

import { PopProviders } from "./providers";

export default function PopLayout({ children }: { children: ReactNode }) {
	return <PopProviders>{children}</PopProviders>;
}
