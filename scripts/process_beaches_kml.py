import xml.etree.ElementTree as ET
import re
import json

# Read the KML file
with open('../user_read_only_context/text_attachments/pasted-text-Hq0KH.txt', 'r', encoding='utf-8') as file:
    kml_content = file.read()

# Parse XML
root = ET.fromstring(kml_content)

# Define namespaces
ns = {'kml': 'http://www.opengis.net/kml/2.2'}

beaches = []

# Extract all Placemarks
for placemark in root.findall('.//kml:Placemark', ns):
    beach = {}
    
    # Get name
    name_elem = placemark.find('kml:name', ns)
    if name_elem is not None:
        beach['name'] = name_elem.text
    
    # Get coordinates
    coords_elem = placemark.find('.//kml:coordinates', ns)
    if coords_elem is not None and coords_elem.text:
        coords = coords_elem.text.strip().split(',')
        if len(coords) >= 2:
            beach['longitude'] = float(coords[0])
            beach['latitude'] = float(coords[1])
    
    # Get address
    address_elem = placemark.find('kml:address', ns)
    if address_elem is not None:
        beach['address'] = address_elem.text
    
    # Extract extended data
    extended_data = placemark.find('kml:ExtendedData', ns)
    if extended_data is not None:
        for data in extended_data.findall('kml:Data', ns):
            data_name = data.get('name')
            value_elem = data.find('kml:value', ns)
            if value_elem is not None and value_elem.text:
                if data_name == 'Descripción':
                    beach['description'] = value_elem.text
                elif data_name == 'pic':
                    beach['image_url'] = value_elem.text
                elif data_name == 'Más Información:':
                    beach['more_info_url'] = value_elem.text
                elif data_name == 'gx_media_links':
                    beach['google_image_url'] = value_elem.text
    
    # Only add if has coordinates
    if 'latitude' in beach and 'longitude' in beach:
        beaches.append(beach)

print(f"Total beaches extracted: {len(beaches)}")
print(json.dumps(beaches[:2], indent=2, ensure_ascii=False))  # Print first 2 as sample
