import { handleApiError, ok, readJson } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/dal";
import { saveProfileLocation } from "@/lib/data/profile";
import { CITY_PRESETS, locationSchema } from "@/lib/location";
import { getLocation, saveLocation } from "@/lib/location.server";

/** GET /api/location — current delivery location and supported city presets. */
export async function GET() {
  try {
    return ok({ location: await getLocation(), presets: CITY_PRESETS });
  } catch (error) {
    return handleApiError(error);
  }
}

/** PUT /api/location — { label, lat, lon, pincode } */
export async function PUT(request: Request) {
  try {
    const location = locationSchema.parse(await readJson(request));
    await saveLocation(location);
    const user = await getCurrentUser();
    if (user) await saveProfileLocation(user.id, location);
    return ok({ location });
  } catch (error) {
    return handleApiError(error);
  }
}
