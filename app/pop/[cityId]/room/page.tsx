import { notFound } from "next/navigation";

import { PopExperienceLayout } from "@/components/pop/pop-experience-layout";
import { PopRoom } from "@/components/pop/pop-room";
import { parsePopCityId } from "@/lib/pop/cities";

type PageProps = {
	params: Promise<{ cityId: string }>;
};

export default async function PopRoomPage({ params }: PageProps) {
	const { cityId: raw } = await params;
	const cityId = parsePopCityId(raw);
	if (!cityId) notFound();

	return (
		<PopExperienceLayout>
			<PopRoom cityId={cityId} />
		</PopExperienceLayout>
	);
}
