"use client";

import { createContext, useContext, type ReactNode } from "react";

type PresentationValue = {
	/** Production-style copy; hide internal / demo labels (set from Vercel + POP_SHOW_INTERNAL_LABELS). */
	stealth: boolean;
};

const PresentationContext = createContext<PresentationValue>({
	stealth: false,
});

export function PopPresentationProvider({
	stealth,
	children,
}: {
	stealth: boolean;
	children: ReactNode;
}) {
	return (
		<PresentationContext.Provider value={{ stealth }}>
			{children}
		</PresentationContext.Provider>
	);
}

export function usePopPresentation(): PresentationValue {
	return useContext(PresentationContext);
}
