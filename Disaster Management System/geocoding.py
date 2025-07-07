import pandas as pd
import requests
import time

# Load the input CSV
df = pd.read_csv("incident_data.csv")
print(f"Total rows in input CSV: {len(df)}")

records = []

for i, row in df.iterrows():
    print(f"Processing row {i+1}/{len(df)}")

    # Safely get columns and strip strings
    ward = str(row.get("Ward", "")).strip()
    mun = str(row.get("Municipality", "")).strip()
    district = str(row.get("District", "")).strip()
    
    # If essential parts missing, skip this row
    if not ward or not mun or not district:
        print(f"Skipping row {i+1} due to missing Ward/Municipality/District")
        continue

    address = f"Ward {ward}, {mun}, {district}, Nepal"
    print(f"Geocoding address: {address}")

    url = f"https://nominatim.openstreetmap.org/search?format=json&q={address}"
    headers = {"User-Agent": "GeoDMS-App"}

    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        result = response.json()
        time.sleep(1)  # Respect Nominatim's rate limit

        if result:
            lat = result[0].get("lat")
            lon = result[0].get("lon")
            print(f"Found coordinates: {lat}, {lon}")
        else:
            print(f"No coordinates found for {address}")
            lat = None
            lon = None

    except Exception as e:
        print(f"Error geocoding {address}: {e}")
        lat = None
        lon = None

    records.append({
        "Title": row.get("Title", ""),
        "Hazard": row.get("Hazard", ""),
        "Incident on": row.get("Incident on", ""),
        "District": district,
        "Municipality": mun,
        "Ward": ward,
        "Latitude": lat,
        "Longitude": lon
    })

output_df = pd.DataFrame(records)
output_df.to_csv("incident_geocoded.csv", index=False)
print(f"✅ Saved {len(output_df)} rows as incident_geocoded.csv")
