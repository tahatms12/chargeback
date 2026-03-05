def sanitize_customer_name(name: str) -> str:
    if not name:
        return ""
    parts = name.split()
    if len(parts) < 2:
        return name
    return f"{parts[0]} {parts[1][0]}."
