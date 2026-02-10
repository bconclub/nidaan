import { NextRequest, NextResponse } from "next/server";
import { searchFacilities, getCachedFacilities } from "@/lib/abdm";

/**
 * GET /api/facility-lookup
 * ABDM HFR facility search endpoint.
 *
 * Query params:
 *   lat       — latitude (required)
 *   lng       — longitude (required)
 *   specialty — medical specialty filter (optional)
 *   radius    — search radius in km, default 25 (optional)
 *   type      — facility type filter: PHC, CHC, DH, etc. (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const lat = searchParams.get("lat");
    const lng = searchParams.get("lng");
    const specialty = searchParams.get("specialty") ?? undefined;
    const radius = searchParams.get("radius");
    const facilityType = searchParams.get("type") ?? undefined;

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "lat and lng query parameters are required" },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: "lat and lng must be valid numbers" },
        { status: 400 }
      );
    }

    // Search facilities via ABDM HFR API (with cache fallback)
    const facilities = await searchFacilities({
      latitude,
      longitude,
      radius_km: radius ? parseFloat(radius) : 25,
      specialty,
      facility_type: facilityType,
    });

    return NextResponse.json({ facilities });
  } catch (error) {
    console.error("[api/facility-lookup] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
